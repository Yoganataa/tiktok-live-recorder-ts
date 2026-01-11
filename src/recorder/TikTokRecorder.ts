// src/recorder/TikTokRecorder.ts
import { randomUUID } from 'node:crypto';
import { mkdir, statfs, stat } from 'node:fs/promises';
import { join } from 'node:path';

import pLimit from 'p-limit';

import { HttpClient } from '../client/HttpClient';
import { TikTokAPI } from '../client/TikTokAPI';
import { env } from '../config/env';
import { Mode } from '../enums';
import { UserNotLiveError } from '../errors/errors';
import { TelegramUploader } from '../upload/TelegramUploader';
import {
  mergeSegments,
  checkSegmentCompatibility,
  ensureFFmpegAvailable,
  ensureFFprobeAvailable,
} from '../utils/ffmpeg';
import { logger as globalLogger } from '../utils/logger';

import { FollowersTracker } from './FollowersTracker';
import { StreamRecorder } from './StreamRecorder';

import type { StreamRecordResult, UrlProvider, TikTokRecorderOptions } from './types';

export { TikTokRecorderOptions };

export class TikTokRecorder {
  private readonly mainAbortController = new AbortController();
  private readonly activeSessions = new Map<string, AbortController>();
  private readonly api: TikTokAPI;
  private readonly streamRecorder: StreamRecorder;
  private readonly telegram?: TelegramUploader;
  private readonly options: TikTokRecorderOptions;
  private readonly MIN_DISK_SPACE_BYTES = 1024 * 1024 * 1024; // 1 GB

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

    mkdir(this.options.outputDir, { recursive: true }).catch((err) => {
      globalLogger.error({ err, dir: this.options.outputDir }, 'Failed to create output directory');
    });
  }

  private extractUsernameFromUrl(url: string): string | null {
    const match = url.match(/@([a-zA-Z0-9_.]+(\.[a-zA-Z0-9_.]+)?)/);
    return match?.[1] || null;
  }

  private async checkDiskSpace(): Promise<void> {
    try {
      // statfs is used to check disk partition space
      const stats = await statfs(this.options.outputDir);
      const freeBytes = stats.bfree * stats.bsize;
      if (freeBytes < this.MIN_DISK_SPACE_BYTES) {
        throw new Error(
          `Insufficient disk space. Free: ${(freeBytes / 1e6).toFixed(2)} MB, Required: 1024 MB`,
        );
      }
    } catch (err) {
      // If code is ENOENT (directory doesn't exist yet), ignore, as mkdir will fix it
      if ((err as NodeJS.ErrnoException).code !== 'ENOENT') throw err;
    }
  }

  /**
   * Centralized Logic: Resolves RoomID (if needed), checks liveness, and triggers recording.
   * Returns true if recording started, false otherwise.
   */
  private async tryStartRecording(user: string, preResolvedRoomId?: string): Promise<boolean> {
    try {
      // 1. Resolve Room ID if not provided
      const roomId = preResolvedRoomId || (await this.api.getRoomIdFromUser(user));

      // 2. Prevent duplicate sessions
      if (this.activeSessions.has(roomId)) {
        globalLogger.debug({ user, roomId }, 'User already being recorded');
        return false;
      }

      // 3. Check Liveness
      const isAlive = await this.api.isRoomAlive(roomId);
      if (!isAlive) {
        globalLogger.debug({ user, roomId }, 'User is not live');
        return false;
      }

      // 4. Start Recording
      // We do not await this, as recording is a long-running background process.
      // Error handling for the recording process is handled inside record().
      this.record(roomId, user).catch((err) =>
        globalLogger.error({ user, err }, 'Recording session crashed'),
      );

      return true;
    } catch (err) {
      globalLogger.warn({ user, err }, 'Failed to start recording session');
      return false;
    }
  }

  public async captureLink(url: string): Promise<void> {
    const user = this.extractUsernameFromUrl(url);
    if (!user) {
      globalLogger.warn({ url }, 'Could not extract username from URL');
      return;
    }

    if (this.activeSessions.size >= (this.options.maxParallelRecordings || 3)) {
      globalLogger.warn({ user }, 'Ignored: Max parallel limit reached');
      return;
    }

    globalLogger.info({ user, source: 'external-link' }, 'Processing capture link...');
    await this.tryStartRecording(user);
  }

  async start(): Promise<void> {
    globalLogger.info({ mode: this.options.mode, user: this.options.user }, 'Starting recorder');
    try {
      await Promise.all([ensureFFmpegAvailable(), ensureFFprobeAvailable(), this.checkDiskSpace()]);

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
    if (!this.mainAbortController.signal.aborted) {
      globalLogger.info('Stopping recorder...');
      this.mainAbortController.abort();
      this.activeSessions.forEach((ctrl) => ctrl.abort());
      this.activeSessions.clear();
      this.options.events?.onStop?.();
    }
  }

  private async runManual(): Promise<void> {
    // For manual mode, we want explicit errors if they are not live
    const roomId = this.options.roomId || (await this.api.getRoomIdFromUser(this.options.user));
    if (!(await this.api.isRoomAlive(roomId))) {
      throw new UserNotLiveError(`@${this.options.user} is not currently live`);
    }
    await this.record(roomId, this.options.user);
  }

  private async runAutomatic(): Promise<void> {
    const intervalMs = (this.options.intervalMinutes || 5) * 60000;

    while (!this.mainAbortController.signal.aborted) {
      await this.tryStartRecording(this.options.user, this.options.roomId);

      if (!this.mainAbortController.signal.aborted) {
        await new Promise((resolve) => setTimeout(resolve, intervalMs));
      }
    }
  }

  private async runFollowers(): Promise<void> {
    const tracker = new FollowersTracker();
    const maxParallel = this.options.maxParallelRecordings || 3;
    const intervalMs = (this.options.intervalMinutes || 5) * 60000;
    const limit = pLimit(10);

    const secUid = await this.api.getSecUid();
    if (!secUid) throw new Error('Failed to resolve secUid for followers mode');

    // Use void to tell linter we don't expect to await this specific promise
    this.mainAbortController.signal.addEventListener('abort', () => {
      void tracker.stopAll();
    });

    while (!this.mainAbortController.signal.aborted) {
      try {
        const followers = await this.api.getFollowers(secUid);
        const candidates = followers.filter((u) => !tracker.has(u));

        await Promise.all(
          candidates.map((user) =>
            limit(async () => {
              if (this.mainAbortController.signal.aborted || tracker.size() >= maxParallel) return;

              // We check active sessions here before attempting logic to save resources
              // Note: tracker.has() checks our internal tracking, activeSessions checks actual recording
              if (tracker.has(user)) return;

              // We manually construct the record promise to track it in FollowersTracker
              try {
                const roomId = await this.api.getRoomIdFromUser(user);
                if (await this.api.isRoomAlive(roomId)) {
                  // Start the record process and track it
                  const recordTask = this.record(roomId, user);
                  tracker.add(user, recordTask);
                }
              } catch {
                // Ignore transient check errors
              }
            }),
          ),
        );
      } catch (err) {
        globalLogger.warn({ err }, 'Followers polling error');
      }

      if (!this.mainAbortController.signal.aborted) {
        await new Promise((resolve) => setTimeout(resolve, intervalMs));
      }
    }
    await tracker.stopAll();
  }

  private async record(roomId: string, user: string): Promise<void> {
    const sessionController = new AbortController();
    this.activeSessions.set(roomId, sessionController);

    const onMainAbort = () => sessionController.abort();
    this.mainAbortController.signal.addEventListener('abort', onMainAbort);

    const sessionLogger = globalLogger.child({
      user,
      roomId,
      sessionId: randomUUID().split('-')[0],
    });

    try {
      await this.checkDiskSpace();
      const timestamp = new Date()
        .toISOString()
        .replace(/[:.]/g, '-')
        .split('T')
        .join('_')
        .split('.')[0];
      const safeUser = user.replace(/[^a-zA-Z0-9_-]/g, '_');
      const baseName = join(this.options.outputDir, `TK_${safeUser}_${timestamp}`);

      this.options.events?.onStart?.({ user, roomId });

      let currentQuality = 0;
      let lastWorkingQuality = 0;

      const urlProvider: UrlProvider = async (isRetry, prevStall, attemptUpgrade) => {
        if (isRetry && prevStall) currentQuality++;
        else if (attemptUpgrade && currentQuality > 0) currentQuality--;

        try {
          const url = await this.api.getLiveStreamUrl(roomId, currentQuality);
          lastWorkingQuality = currentQuality;
          return url;
        } catch (err) {
          if (currentQuality !== lastWorkingQuality) {
            currentQuality = lastWorkingQuality;
            return this.api.getLiveStreamUrl(roomId, currentQuality);
          }
          throw err;
        }
      };

      const result = await this.streamRecorder.record(urlProvider, `${baseName}.flv`, {
        signal: sessionController.signal,
        logger: sessionLogger,
      });

      await this.processResult(result, baseName, sessionLogger);
    } catch (err) {
      if (!sessionController.signal.aborted) {
        sessionLogger.error({ err }, 'Recording failed');
        throw err;
      }
    } finally {
      this.mainAbortController.signal.removeEventListener('abort', onMainAbort);
      this.activeSessions.delete(roomId);
    }
  }

  private async processResult(
    result: StreamRecordResult,
    baseName: string,
    logger: typeof globalLogger,
  ) {
    if (!result.segments.length) return;

    const outputPath = `${baseName}.${env.recorder.format}`;
    const validSegments: string[] = [];

    for (const seg of result.segments) {
      try {
        // Use 'stat' to check actual file existence and size
        const fileStat = await stat(seg);
        if (fileStat.size > 0) validSegments.push(seg);
      } catch {
        // Ignore missing or inaccessible files
      }
    }

    if (validSegments.length) {
      const isCompatible = await checkSegmentCompatibility(validSegments);
      await mergeSegments(validSegments, outputPath, {
        keepSource: env.recorder.keepFlv,
        reEncode: !isCompatible,
      });

      if (this.telegram && this.options.uploadToTelegram) {
        this.telegram
          .upload(outputPath)
          .catch((err) => logger.error({ err }, 'Telegram upload error'));
      }
    }
  }

  private async cleanup(): Promise<void> {
    if (this.telegram) await this.telegram.disconnect();
  }
}
