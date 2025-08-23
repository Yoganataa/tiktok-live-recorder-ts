import * as fs from 'fs';
import * as path from 'path';
import { ChildProcess, spawn } from 'child_process';
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

    // If proxy is provided, set up the HTTP client without the proxy
    if (proxy) {
      this.tiktok = new TikTokAPI(undefined, cookies);
    }
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
    while (true) {
      try {
        this.roomId = await this.tiktok.getRoomIdFromUser(this.user!);
        await this.manualMode();
      } catch (error) {
        if (error instanceof UserLiveError) {
          logger.info(error.message);
          logger.info(`Waiting ${this.automaticInterval} minutes before recheck\n`);
          await this.sleep(this.automaticInterval * TimeOut.ONE_MINUTE * 1000);
        } else if (error instanceof LiveNotFound) {
          logger.error(`Live not found: ${error.message}`);
          logger.info(`Waiting ${this.automaticInterval} minutes before recheck\n`);
          await this.sleep(this.automaticInterval * TimeOut.ONE_MINUTE * 1000);
        } else {
          logger.error(`Unexpected error: ${error}\n`);
        }
      }
    }
  }

  private async followersMode(): Promise<void> {
    const activeRecordings: Map<string, ChildProcess> = new Map();

    while (true) {
      try {
        const followers = await this.tiktok.getFollowersList(this.secUid!);

        for (const follower of followers) {
          const existingProcess = activeRecordings.get(follower);
          if (existingProcess && !existingProcess.killed) {
            continue;
          } else if (existingProcess && existingProcess.killed) {
            logger.info(`Recording of @${follower} finished.`);
            activeRecordings.delete(follower);
          }

          try {
            const roomId = await this.tiktok.getRoomIdFromUser(follower);
            
            if (!roomId || !(await this.tiktok.isRoomAlive(roomId))) {
              continue;
            }

            logger.info(`@${follower} is live. Starting recording...`);

            const process = spawn('node', ['dist/main.js', '-user', follower, '-mode', 'manual'], {
              detached: true,
              stdio: 'ignore'
            });

            activeRecordings.set(follower, process);
            await this.sleep(2500);

          } catch (error) {
            logger.error(`Error while processing @${follower}: ${error}`);
            continue;
          }
        }

        console.log();
        const delay = this.automaticInterval * TimeOut.ONE_MINUTE;
        logger.info(`Waiting ${delay} minutes for the next check...`);
        await this.sleep(delay * 1000);

      } catch (error) {
        if (error instanceof UserLiveError) {
          logger.info(error.message);
          logger.info(`Waiting ${this.automaticInterval} minutes before recheck\n`);
          await this.sleep(this.automaticInterval * TimeOut.ONE_MINUTE * 1000);
        } else {
          logger.error(`Unexpected error: ${error}\n`);
        }
      }
    }
  }

  private async startRecording(user: string, roomId: string): Promise<void> {
    const liveUrl = await this.tiktok.getLiveUrl(roomId);
    if (!liveUrl) {
      throw new LiveNotFound(TikTokError.RETRIEVE_LIVE_URL);
    }

    const currentDate = new Date().toISOString()
      .replace(/:/g, '-')
      .replace(/\./g, '_')
      .substring(0, 19);

    let outputPath = this.output || '';
    if (outputPath && !outputPath.endsWith('/') && !outputPath.endsWith('\\')) {
      outputPath += process.platform === 'win32' ? '\\' : '/';
    }

    const output = `${outputPath}TK_${user}_${currentDate}_flv.mp4`;

    if (this.duration) {
      logger.info(`Started recording for ${this.duration} seconds `);
    } else {
      logger.info("Started recording...");
    }

    const bufferSize = 512 * 1024; // 512 KB buffer
    let buffer = Buffer.alloc(0);

    logger.info("[PRESS CTRL + C ONCE TO STOP]");

    return new Promise(async (resolve, reject) => {
      const writeStream = fs.createWriteStream(output);
      let stopRecording = false;
      const startTime = Date.now();

      // Handle Ctrl+C
      const handleInterrupt = () => {
        logger.info("Recording stopped by user.");
        stopRecording = true;
      };

      process.on('SIGINT', handleInterrupt);

      try {
        while (!stopRecording) {
          try {
            if (!(await this.tiktok.isRoomAlive(roomId))) {
              logger.info("User is no longer live. Stopping recording.");
              break;
            }

            const streamGen = this.tiktok.downloadLiveStream(liveUrl);
            
            for await (const chunk of streamGen) {
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

              if (stopRecording) break;
            }

          } catch (error) {
            logger.error(`Stream error: ${error}`);
            await this.sleep(2000);
          }
        }

        if (buffer.length > 0) {
          writeStream.write(buffer);
        }

        writeStream.end();

        writeStream.on('finish', async () => {
          logger.info(`Recording finished: ${output}\n`);
          
          try {
            await VideoManagement.convertFlvToMp4(output);
            
            if (this.useTelegram) {
              const telegram = new Telegram();
              await telegram.upload(output.replace('_flv.mp4', '.mp4'));
            }
          } catch (error) {
            logger.error(`Post-processing error: ${error}`);
          }

          process.off('SIGINT', handleInterrupt);
          resolve();
        });

      } catch (error) {
        process.off('SIGINT', handleInterrupt);
        writeStream.destroy();
        reject(error);
      }
    });
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
}