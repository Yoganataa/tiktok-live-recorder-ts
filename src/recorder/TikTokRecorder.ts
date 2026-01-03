import { join } from 'node:path';
import { mkdir } from 'node:fs/promises';
import { TikTokAPI } from '../client/TikTokAPI';
import { HttpClient } from '../client/HttpClient';
import { StreamRecorder } from './StreamRecorder';
import { FollowersTracker } from './FollowersTracker';
import { TelegramUploader } from '../upload/TelegramUploader';
import { Mode } from '../enums';
import { env } from '../config/env';
import { logger } from '../utils/logger';
import { convertFlvToMp4 } from '../utils/ffmpeg';
import { UserNotLiveError } from '../errors/errors';

export interface RecorderEvents {
  onStart?: (meta: { user: string; roomId: string }) => void;
  onStop?: () => void;
  onError?: (error: Error) => void;
}

export interface TikTokRecorderOptions {
  user: string;
  roomId?: string;
  mode: Mode;
  outputDir: string;
  intervalMinutes?: number;
  uploadToTelegram?: boolean;
  maxParallelRecordings?: number;
  events?: RecorderEvents;
}

export class TikTokRecorder {
  private readonly abortController = new AbortController();
  private readonly api: TikTokAPI;
  private readonly streamRecorder: StreamRecorder;
  private readonly telegram?: TelegramUploader;
  private readonly options: TikTokRecorderOptions;

  constructor(options: TikTokRecorderOptions) {
    this.options = {
      intervalMinutes: 5,
      maxParallelRecordings: 3,
      ...options,
    };

    const http = new HttpClient({
      proxy: env.tiktok.proxy,
      cookies: {
        sessionid_ss: env.tiktok.sessionId,
        'tt-target-idc': env.tiktok.idc,
      },
    });

    this.api = new TikTokAPI(http);
    this.streamRecorder = new StreamRecorder(http);

    if (env.telegram.apiId && env.telegram.apiHash) {
      this.telegram = new TelegramUploader();
    }

    // Ensure output directory exists
    mkdir(this.options.outputDir, { recursive: true }).catch((err) => {
      logger.error({ err, dir: this.options.outputDir }, 'Failed to create output directory');
    });
  }

  async start(): Promise<void> {
    logger.info({ mode: this.options.mode, user: this.options.user }, 'Starting TikTok recorder');

    try {
      switch (this.options.mode) {
        case Mode.MANUAL:
          await this.runManual();
          break;

        case Mode.AUTOMATIC:
          await this.runAutomatic();
          break;

        case Mode.FOLLOWERS:
          await this.runFollowers();
          break;

        default:
          throw new Error(`Unknown mode: ${this.options.mode}`);
      }
    } catch (err) {
      this.options.events?.onError?.(err as Error);
      throw err;
    } finally {
      await this.cleanup();
    }
  }

  stop(): void {
    if (!this.abortController.signal.aborted) {
      logger.info('Stopping recorder');
      this.abortController.abort();
      this.options.events?.onStop?.();
    }
  }

  private async runManual(): Promise<void> {
    const roomId = this.options.roomId || await this.api.getRoomIdFromUser(this.options.user);
    
    const isLive = await this.api.isRoomAlive(roomId);
    if (!isLive) {
      throw new UserNotLiveError(`@${this.options.user} is not currently live`);
    }

    await this.record(roomId, this.options.user);
  }

  private async runAutomatic(): Promise<void> {
    const interval = (this.options.intervalMinutes || 5) * 60_000;

    logger.info({ intervalMinutes: this.options.intervalMinutes }, 'Starting automatic mode');

    while (!this.abortController.signal.aborted) {
      try {
        const roomId = this.options.roomId || await this.api.getRoomIdFromUser(this.options.user);
        
        if (await this.api.isRoomAlive(roomId)) {
          await this.record(roomId, this.options.user);
        } else {
          logger.debug({ user: this.options.user }, 'User is not live');
        }
      } catch (err) {
        logger.warn({ err }, 'Automatic loop error, will retry');
      }

      if (!this.abortController.signal.aborted) {
        logger.debug({ intervalMs: interval }, 'Waiting before next check');
        await new Promise((resolve) => setTimeout(resolve, interval));
      }
    }
  }

  private async runFollowers(): Promise<void> {
    const tracker = new FollowersTracker();
    const maxParallel = this.options.maxParallelRecordings || 3;
    const interval = (this.options.intervalMinutes || 5) * 60_000;

    logger.info({ maxParallel, intervalMinutes: this.options.intervalMinutes }, 'Starting followers mode');

    const secUid = await this.api.getSecUid();
    if (!secUid) {
      throw new Error('Failed to resolve secUid for followers mode. Ensure you are logged in with valid cookies.');
    }

    // Setup cleanup on abort
    this.abortController.signal.addEventListener('abort', () => {
      tracker.stopAll().catch((err) => {
        logger.error({ err }, 'Error stopping all recordings');
      });
    });

    while (!this.abortController.signal.aborted) {
      try {
        const followers = await this.api.getFollowers(secUid);

        for (const follower of followers) {
          if (this.abortController.signal.aborted) {
            break;
          }

          if (tracker.has(follower)) {
            continue;
          }

          if (tracker.size() >= maxParallel) {
            logger.debug({ maxParallel }, 'Max parallel recordings reached');
            break;
          }

          const task = this.tryRecordFollower(follower);
          tracker.add(follower, task);

          // Rate limiting
          await new Promise((resolve) => setTimeout(resolve, 2500));
        }
      } catch (err) {
        logger.warn({ err }, 'Followers polling error');
      }

      if (!this.abortController.signal.aborted) {
        logger.debug({ intervalMs: interval }, 'Waiting before next followers check');
        await new Promise((resolve) => setTimeout(resolve, interval));
      }
    }

    await tracker.stopAll();
  }

  private async tryRecordFollower(user: string): Promise<void> {
    try {
      logger.debug({ user }, 'Checking if follower is live');

      const roomId = await this.api.getRoomIdFromUser(user);
      
      const isLive = await this.api.isRoomAlive(roomId);
      if (!isLive) {
        return;
      }

      logger.info({ user, roomId }, 'Follower is live, starting recording');
      await this.record(roomId, user);
    } catch (err) {
      logger.warn({ user, err }, 'Follower recording failed');
    }
  }

  private async record(roomId: string, user: string): Promise<void> {
    const signal = this.abortController.signal;

    logger.info({ user, roomId }, 'Starting recording');

    try {
      const liveUrl = await this.api.getLiveStreamUrl(roomId);
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-').split('T').join('_').split('.')[0];

      const flvPath = join(this.options.outputDir, `TK_${user}_${timestamp}_flv.mp4`);
      const mp4Path = join(this.options.outputDir, `TK_${user}_${timestamp}.mp4`);

      this.options.events?.onStart?.({ user, roomId });

      // Record stream
      await this.streamRecorder.record(liveUrl, flvPath, { signal });

      // Convert to MP4
      await convertFlvToMp4(flvPath, mp4Path, signal);

      logger.info({ user, output: mp4Path }, 'Recording completed successfully');

      // Upload to Telegram (non-blocking)
      if (this.telegram && this.options.uploadToTelegram) {
        this.telegram.upload(mp4Path).catch((err) => {
          logger.error({ err }, 'Telegram upload failed (non-blocking)');
        });
      }
    } catch (err) {
      if (signal.aborted) {
        logger.info({ user }, 'Recording aborted');
        return;
      }
      
      logger.error({ err, user, roomId }, 'Recording failed');
      throw err;
    }
  }

  private async cleanup(): Promise<void> {
    logger.info('Cleaning up resources');
    
    if (this.telegram) {
      await this.telegram.disconnect();
    }
  }
}