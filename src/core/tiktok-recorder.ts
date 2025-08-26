import * as fs from 'fs';
import * as path from 'path';
import { ChildProcess, spawn } from 'child_process';
import { EventEmitter } from 'events';
import { Worker, isMainThread, parentPort, workerData } from 'worker_threads';
import { TikTokAPI } from './tiktok-api';
import { logger } from '../utils/logger-manager';
import { VideoManagement } from '../utils/video-management';
import { Telegram } from '../upload';
import { 
  LiveNotFound, 
  UserLiveError, 
  TikTokRecorderError 
} from '../utils/custom-exceptions';
import { Mode, Error, TimeOut, TikTokError } from '../utils/enums';
import { CookiesConfig } from '../types';

// Event class to mimic Python's multiprocessing Event
class StopEvent extends EventEmitter {
  private _isSet: boolean = false;

  set(): void {
    this._isSet = true;
    this.emit('stop');
  }

  isSet(): boolean {
    return this._isSet;
  }

  wait(): Promise<void> {
    return new Promise((resolve) => {
      if (this._isSet) {
        resolve();
      } else {
        this.once('stop', resolve);
      }
    });
  }
}

export class TikTokRecorder {
  private tiktok: TikTokAPI;
  private url?: string;
  private user?: string;
  private roomId?: string;
  private mode: Mode;
  private automaticInterval: number;
  private duration?: number;
  private output?: string;
  private useTelegram: boolean;
  private secUid?: string;
  private stopEvent: StopEvent;

  constructor(
    url?: string,
    user?: string,
    roomId?: string,
    mode: Mode = Mode.MANUAL,
    automaticInterval: number = 5,
    cookies?: CookiesConfig,
    proxy?: string,
    output?: string,
    duration?: number,
    useTelegram: boolean = false
  ) {
    // Setup TikTok API client
    this.tiktok = new TikTokAPI(proxy, cookies);

    // TikTok Data
    this.url = url;
    this.user = user;
    this.roomId = roomId;

    // Tool Settings
    this.mode = mode;
    this.automaticInterval = automaticInterval;
    this.duration = duration;
    this.output = output;

    // Upload Settings
    this.useTelegram = useTelegram;

    // Initialize stop event for signaling between processes
    this.stopEvent = new StopEvent();

    // If proxy is provided, also setup client without proxy for certain operations
    if (proxy) {
      // Keep the proxy-enabled client for most operations
      this.tiktok = new TikTokAPI(proxy, cookies);
    }

    // Bind the stop method to handle SIGINT
    this.handleStopSignal = this.handleStopSignal.bind(this);
    process.on('SIGINT', this.handleStopSignal);
  }

  async run(): Promise<void> {
    // Check if the user's country is blacklisted
    await this.checkCountryBlacklisted();

    // Retrieve sec_uid if the mode is FOLLOWERS
    if (this.mode === Mode.FOLLOWERS) {
      const secUid = await this.tiktok.getSecUid();
      if (!secUid) {
        throw new TikTokRecorderError("Failed to retrieve sec_uid.");
      }
      this.secUid = secUid;
      logger.info("Followers mode activated\n");
    } else {
      // Get live information based on the provided user data
      if (this.url) {
        [this.user, this.roomId] = await this.tiktok.getRoomAndUserFromUrl(this.url);
      }

      if (!this.user && this.roomId) {
        this.user = await this.tiktok.getUserFromRoomId(this.roomId);
      }

      if (!this.roomId && this.user) {
        this.roomId = await this.tiktok.getRoomIdFromUser(this.user);
      }

      logger.info(`USERNAME: ${this.user}${!this.roomId ? '\n' : ''}`);
      if (this.roomId) {
        const isLive = await this.tiktok.isRoomAlive(this.roomId);
        logger.info(`ROOM_ID:  ${this.roomId}${!isLive ? '\n' : ''}`);
      }
    }

    if (this.mode === Mode.MANUAL) {
      await this.manualMode();
    } else if (this.mode === Mode.AUTOMATIC) {
      await this.automaticMode();
    } else if (this.mode === Mode.FOLLOWERS) {
      await this.followersMode();
    }
  }

  private async manualMode(): Promise<void> {
    if (!this.roomId || !(await this.tiktok.isRoomAlive(this.roomId))) {
      throw new UserLiveError(`@${this.user}: ${TikTokError.USER_NOT_CURRENTLY_LIVE}`);
    }

    await this.startRecording(this.user!, this.roomId);
  }

  private async automaticMode(): Promise<void> {
    while (!this.stopEvent.isSet()) {
      try {
        if (this.user) {
          this.roomId = await this.tiktok.getRoomIdFromUser(this.user);
          await this.manualMode();
        }
        
        if (this.stopEvent.isSet()) break;
      } catch (error) {
        if (this.stopEvent.isSet()) break;
        
        if (error instanceof UserLiveError) {
          logger.info(error.message);
          logger.info(`Waiting ${this.automaticInterval} minutes before recheck\n`);
          // Wait with periodic stop event checks
          for (let i = 0; i < this.automaticInterval * TimeOut.ONE_MINUTE; i++) {
            if (this.stopEvent.isSet()) {
              logger.info("🛑 Automatic mode stopped during wait period");
              return;
            }
            await this.sleep(1000);
          }
        } else if (error instanceof LiveNotFound) {
          logger.error(`Live not found: ${error.message}`);
          logger.info(`Waiting ${this.automaticInterval} minutes before recheck\n`);
          // Wait with periodic stop event checks
          for (let i = 0; i < this.automaticInterval * TimeOut.ONE_MINUTE; i++) {
            if (this.stopEvent.isSet()) {
              logger.info("🛑 Automatic mode stopped during wait period");
              return;
            }
            await this.sleep(1000);
          }
        } else {
          logger.error(`Connection error: ${Error.CONNECTION_CLOSED_AUTOMATIC}`);
          // Wait with periodic stop event checks
          const waitTime = TimeOut.CONNECTION_CLOSED * TimeOut.ONE_MINUTE;
          for (let i = 0; i < waitTime; i++) {
            if (this.stopEvent.isSet()) {
              logger.info("🛑 Automatic mode stopped during connection recovery");
              return;
            }
            await this.sleep(1000);
          }
        }
      }
      
      if (this.stopEvent.isSet()) break;
    }
    
    if (this.stopEvent.isSet()) {
      logger.info("🛑 Automatic mode stopped gracefully");
    }
  }

  private async followersMode(): Promise<void> {
    const activeRecordings: Map<string, ChildProcess> = new Map();

    while (!this.stopEvent.isSet()) {
      try {
        const followers = await this.tiktok.getFollowersList(this.secUid!);

        for (const follower of followers) {
          if (this.stopEvent.isSet()) break;
          
          const existingProcess = activeRecordings.get(follower);
          if (existingProcess && !existingProcess.killed) {
            continue;
          } else if (existingProcess?.exitCode !== null) {
            logger.info(`Recording of @${follower} finished.`);
            activeRecordings.delete(follower);
          }

          try {
            const roomId = await this.tiktok.getRoomIdFromUser(follower);
            
            if (!roomId || !(await this.tiktok.isRoomAlive(roomId))) {
              continue;
            }

            logger.info(`@${follower} is live. Starting recording...`);

            // Create a worker for each recording to enable better event handling
            if (isMainThread) {
              const process = spawn('node', [
                path.join(__dirname, '..', 'main.js'),
                '-user', follower,
                '-mode', 'manual'
              ], {
                detached: false,
                stdio: 'pipe'
              });

              activeRecordings.set(follower, process);
              await this.sleep(2500);
            }

          } catch (error) {
            logger.error(`Error while processing @${follower}: ${error}`);
            continue;
          }
        }
        
        if (this.stopEvent.isSet()) break;

        console.log();
        const delay = this.automaticInterval * TimeOut.ONE_MINUTE;
        logger.info(`Waiting ${delay} seconds for the next check...`);
        
        // Wait with periodic stop event checks
        for (let i = 0; i < delay; i++) {
          if (this.stopEvent.isSet()) {
            logger.info("🛑 Followers mode stopped during wait period");
            return;
          }
          await this.sleep(1000);
        }

      } catch (error) {
        if (this.stopEvent.isSet()) break;
        
        if (error instanceof UserLiveError) {
          logger.info(error.message);
          logger.info(`Waiting ${this.automaticInterval} minutes before recheck\n`);
          // Wait with periodic stop event checks
          for (let i = 0; i < this.automaticInterval * TimeOut.ONE_MINUTE; i++) {
            if (this.stopEvent.isSet()) {
              return;
            }
            await this.sleep(1000);
          }
        } else {
          logger.error(`Connection error: ${Error.CONNECTION_CLOSED_AUTOMATIC}`);
          // Wait with periodic stop event checks
          const waitTime = TimeOut.CONNECTION_CLOSED * TimeOut.ONE_MINUTE;
          for (let i = 0; i < waitTime; i++) {
            if (this.stopEvent.isSet()) {
              return;
            }
            await this.sleep(1000);
          }
        }
      }
      
      if (this.stopEvent.isSet()) break;
    }
    
    if (this.stopEvent.isSet()) {
      logger.info("🛑 Followers mode stopped gracefully");
    }
  }

  private async startRecording(user: string, roomId: string): Promise<void> {
    const liveUrl = await this.tiktok.getLiveUrl(roomId);
    if (!liveUrl) {
      throw new LiveNotFound(TikTokError.RETRIEVE_LIVE_URL);
    }

    const currentDate = new Date()
      .toISOString()
      .replace(/[:.]/g, '-')
      .replace('T', '_')
      .substring(0, 19);

    let outputPath = this.output || '';
    if (outputPath && !outputPath.endsWith('/') && !outputPath.endsWith('\\')) {
      outputPath += process.platform === 'win32' ? '\\' : '/';
    }

    const output = `${outputPath}TK_${user}_${currentDate}_flv.mp4`;

    if (this.duration) {
      logger.info(`Started recording for ${this.duration} seconds`);
    } else {
      logger.info("Started recording...");
    }

    const bufferSize = 512 * 1024; // 512 KB buffer
    let buffer = Buffer.alloc(0);
    let stopRecording = false;

    logger.info("[Recording can be stopped gracefully via bot commands]");

    try {
      const writeStream = fs.createWriteStream(output);
      const startTime = Date.now();

      while (!stopRecording && !this.stopEvent.isSet()) {
        try {
          if (this.stopEvent.isSet()) {
            logger.info("🛑 Graceful stop requested, finishing current segment...");
            stopRecording = true;
            break;
          }
          
          if (!(await this.tiktok.isRoomAlive(roomId))) {
            logger.info("User is no longer live. Stopping recording.");
            break;
          }

          const streamGen = this.tiktok.downloadLiveStream(liveUrl);
          const streamIterator = await streamGen;
          
          for await (const chunk of streamIterator) {
            if (stopRecording || this.stopEvent.isSet()) {
              if (this.stopEvent.isSet()) {
                logger.info("🛑 Graceful stop during download, finishing...");
              }
              break;
            }
            
            buffer = Buffer.concat([buffer, chunk]);
            
            if (buffer.length >= bufferSize) {
              writeStream.write(buffer);
              buffer = Buffer.alloc(0);
            }

            const elapsed = Date.now() - startTime;
            if (this.duration && elapsed >= this.duration * 1000) {
              stopRecording = true;
              break;
            }
          }

        } catch (streamError) {
          if (this.stopEvent.isSet()) break;
          logger.error(`Stream error: ${streamError}`);
          await this.sleep(2000);
        }
      }

      if (buffer.length > 0) {
        writeStream.write(buffer);
      }

      writeStream.end();

      await new Promise<void>((resolve) => {
        writeStream.on('finish', resolve);
      });

      logger.info(`Recording finished: ${output}\n`);
      
      // Critical: Convert file before process ends
      // This ensures the file is properly converted even during graceful stop
      logger.info("🔄 Converting FLV to MP4...");
      try {
        await VideoManagement.convertFlvToMp4(output);
        logger.info("✅ File conversion completed successfully");
        
        if (this.useTelegram) {
          const telegram = new Telegram();
          await telegram.upload(output.replace('_flv.mp4', '.mp4'));
        }
      } catch (error) {
        logger.error(`Post-processing error: ${error}`);
      }

    } catch (error) {
      logger.error(`Recording error: ${error}`);
      throw error;
    }
  }

  private async checkCountryBlacklisted(): Promise<void> {
    const isBlacklisted = await this.tiktok.isCountryBlacklisted();
    if (!isBlacklisted) {
      return;
    }

    if (!this.roomId) {
      throw new TikTokRecorderError(TikTokError.COUNTRY_BLACKLISTED);
    }

    if (this.mode === Mode.AUTOMATIC) {
      throw new TikTokRecorderError(TikTokError.COUNTRY_BLACKLISTED_AUTO_MODE);
    } else if (this.mode === Mode.FOLLOWERS) {
      throw new TikTokRecorderError(TikTokError.COUNTRY_BLACKLISTED_FOLLOWERS_MODE);
    }
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Request graceful shutdown of the recorder
   */
  public async stop(): Promise<void> {
    logger.info("🛑 Graceful stop requested for TikTok recorder");
    this.stopEvent.set();
  }

  /**
   * Handle SIGINT signal for graceful shutdown
   */
  private handleStopSignal(): void {
    logger.info("🛑 SIGINT received, requesting graceful stop");
    this.stopEvent.set();
  }
}