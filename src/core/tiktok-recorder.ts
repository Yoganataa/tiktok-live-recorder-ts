import * as fs from 'fs';
import * as path from 'path';
import { EventEmitter } from 'events';
import { TikTokAPI } from './tiktok-api';
import { logger } from '../utils/logger-manager';
import { VideoManagement } from '../utils/video-management';
import { Telegram } from '../upload';
import { 
  LiveNotFound, 
  UserLiveError, 
  TikTokRecorderError,
  NetworkError
} from '../utils/custom-exceptions';
import { Mode, SystemError, TimeOut, TikTokError } from '../utils/enums';
import { CookiesConfig } from '../types';

/**
 * Event class to mimic Python's multiprocessing Event
 * Used for signaling between processes in a Node.js environment
 * @class StopEvent
 * @extends EventEmitter
 */
class StopEvent extends EventEmitter {
  private _isSet: boolean = false;

  /**
   * Set the event state to true and emit the 'stop' event
   */
  set(): void {
    this._isSet = true;
    this.emit('stop');
  }

  /**
   * Check if the event is set
   * @returns True if the event is set, false otherwise
   */
  isSet(): boolean {
    return this._isSet;
  }

  /**
   * Wait for the event to be set
   * @returns Promise that resolves when the event is set
   */
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

/**
 * Main TikTok recorder class
 * Handles the core functionality for recording TikTok Live sessions
 * @class TikTokRecorder
 */
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

  /**
   * Creates an instance of TikTokRecorder
   * @param url - TikTok live URL to record from
   * @param user - TikTok username to record from
   * @param roomId - TikTok room ID to record from
   * @param mode - Recording mode (MANUAL, AUTOMATIC, FOLLOWERS)
   * @param automaticInterval - Interval in minutes for automatic mode checking
   * @param cookies - TikTok session cookies for authentication
   * @param proxy - HTTP proxy to bypass restrictions
   * @param output - Output directory for recordings
   * @param duration - Recording duration in seconds
   * @param useTelegram - Whether to upload recordings to Telegram
   */
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

  /**
   * Run the recorder based on the configured mode
   * @returns Promise that resolves when recording is complete
   * @throws {TikTokRecorderError} If recording fails
   */
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

  /**
   * Manual recording mode
   * Records a single live session immediately
   * @returns Promise that resolves when recording is complete
   * @private
   */
  private async manualMode(): Promise<void> {
    if (!this.roomId || !(await this.tiktok.isRoomAlive(this.roomId))) {
      throw new UserLiveError(`@${this.user}: ${TikTokError.USER_NOT_CURRENTLY_LIVE}`);
    }

    await this.startRecording(this.user!, this.roomId);
  }

  /**
   * Automatic recording mode
   * Continuously monitors a user and records when they go live
   * @returns Promise that resolves when monitoring stops
   * @private
   */
  private async automaticMode(): Promise<void> {
    while (!this.stopEvent.isSet()) {
      try {
        if (this.user) {
          // Always refresh room_id in automatic mode (v7.5 logic)
          this.roomId = await this.tiktok.getRoomIdFromUser(this.user);
          await this.manualMode();
        }
        
        if (this.stopEvent.isSet()) break;

      } catch (error) {
        if (this.stopEvent.isSet()) break;
        
        if (error instanceof UserLiveError) {
          logger.info(error.message);
          logger.info(`Waiting ${this.automaticInterval} minutes before recheck\n`);
          await this.waitWithCheck(this.automaticInterval * TimeOut.ONE_MINUTE);

        } else if (error instanceof LiveNotFound) {
          logger.error(`Live not found: ${error.message}`);
          logger.info(`Waiting ${this.automaticInterval} minutes before recheck\n`);
          await this.waitWithCheck(this.automaticInterval * TimeOut.ONE_MINUTE);

        } else if (error instanceof NetworkError || (error instanceof Error && error.message.includes('Connection'))) {
          logger.error(`Connection error: ${SystemError.CONNECTION_CLOSED_AUTOMATIC}`);
          await this.waitWithCheck(TimeOut.CONNECTION_CLOSED * TimeOut.ONE_MINUTE);

        } else {
          logger.error(`Unexpected error: ${error}\n`);
          // Safety wait to avoid tight loops on unexpected errors
          await this.waitWithCheck(1 * TimeOut.ONE_MINUTE);
        }
      }
      
      if (this.stopEvent.isSet()) break;
    }
    
    if (this.stopEvent.isSet()) {
      logger.info("🛑 Automatic mode stopped gracefully");
    }
  }

  /**
   * Followers recording mode
   * Records live sessions from users that the authenticated user follows
   * @returns Promise that resolves when monitoring stops
   * @private
   */
  private async followersMode(): Promise<void> {
    if (!this.secUid) {
      throw new TikTokRecorderError("secUid is required for followers mode");
    }

    logger.info("Checking for live followers...\n");

    while (!this.stopEvent.isSet()) {
      try {
        const followers = await this.tiktok.getFollowersList(this.secUid);
        
        if (followers.length > 0) {
          logger.info(`Found ${followers.length} followers`);
          
          // Check each follower for live status
          for (const follower of followers) {
            if (this.stopEvent.isSet()) break;

            try {
              const roomId = await this.tiktok.getRoomIdFromUser(follower);
              if (roomId) {
                // Check if the follower is live
                const isLive = await this.tiktok.isRoomAlive(roomId);
                if (isLive) {
                  logger.info(`Recording live follower: ${follower}`);
                  await this.startRecording(follower, roomId);
                }
              }
            } catch (error) {
              // Continue to next follower if one fails (logging minimal to avoid spam)
              continue;
            }
          }
        } else {
          logger.info("No followers found");
        }

        if (this.stopEvent.isSet()) break;

        logger.info(`Waiting ${this.automaticInterval} minutes before next check\n`);
        await this.waitWithCheck(this.automaticInterval * TimeOut.ONE_MINUTE);

      } catch (error) {
        if (this.stopEvent.isSet()) break;
        
        if (error instanceof UserLiveError) {
             logger.info(error.message);
             logger.info(`Waiting ${this.automaticInterval} minutes before recheck\n`);
             await this.waitWithCheck(this.automaticInterval * TimeOut.ONE_MINUTE);

        } else if (error instanceof NetworkError || (error instanceof Error && error.message.includes('Connection'))) {
             logger.error(`Connection error: ${SystemError.CONNECTION_CLOSED_AUTOMATIC}`);
             await this.waitWithCheck(TimeOut.CONNECTION_CLOSED * TimeOut.ONE_MINUTE);
             
        } else {
             logger.error(`Error in followers mode: ${error}`);
             logger.info(`Waiting ${this.automaticInterval} minutes before retry\n`);
             await this.waitWithCheck(this.automaticInterval * TimeOut.ONE_MINUTE);
        }
      }
    }
    
    if (this.stopEvent.isSet()) {
      logger.info("🛑 Followers mode stopped gracefully");
    }
  }

  /**
   * Helper function to wait for a duration while checking for stop signals
   * @param seconds - Number of seconds to wait
   */
  private async waitWithCheck(seconds: number): Promise<void> {
      const ms = seconds * 1000;
      const step = 1000; // Check every 1 second
      let waited = 0;
      
      while (waited < ms) {
          if (this.stopEvent.isSet()) return;
          await this.sleep(step);
          waited += step;
      }
  }

  /**
   * Start recording a live session
   * @param user - TikTok username
   * @param roomId - TikTok room ID
   * @returns Promise that resolves when recording is complete
   * @private
   */
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

    // Create folder if it doesn't exist (recursive for nested paths)
    const outputDir = path.dirname(output);
    if (!fs.existsSync(outputDir)) {
      try {
        fs.mkdirSync(outputDir, { recursive: true });
      } catch (err) {
        logger.error(`Failed to create output directory: ${err}`);
        throw err;
      }
    }

    if (this.duration) {
      logger.info(`Started recording for ${this.duration} seconds`);
    } else {
      logger.info("Started recording...");
    }

    const bufferSize = 512 * 1024; // 512 KB buffer
    let buffer = Buffer.alloc(0);
    let stopRecording = false;

    logger.info("[PRESS CTRL + C ONCE TO STOP]");

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
          
          for await (const chunk of streamGen) {
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
          // Handle specific stream errors or just wait and retry
          if (this.mode === Mode.AUTOMATIC && (streamError instanceof NetworkError)) {
               logger.error(SystemError.CONNECTION_CLOSED_AUTOMATIC);
               await this.waitWithCheck(TimeOut.CONNECTION_CLOSED * TimeOut.ONE_MINUTE);
          } else {
               // Small delay before retrying the loop/check
               await this.sleep(2000);
          }
        }
      }

      // Flush remaining buffer
      if (buffer.length > 0) {
        writeStream.write(buffer);
      }

      writeStream.end();

      await new Promise<void>((resolve) => {
        writeStream.on('finish', resolve);
      });

      logger.info(`Recording finished: ${output}\n`);
      
      // Get video format from environment or default to MP4
      const videoFormat = process.env.VIDEO_OUTPUT_FORMAT?.toLowerCase() || 'mp4';
      logger.info(`🔄 Converting FLV to ${videoFormat.toUpperCase()}...`);
      
      try {
        await VideoManagement.convertFlvToMp4(output);
        logger.info("✅ File conversion completed successfully");
        
        // Determine the final output file based on format and KEEP_RAW_FILE setting
        const keepRaw = process.env.KEEP_RAW_FILE === 'true';
        const finalOutput = output.replace('_flv.mp4', `.${videoFormat}`);
        
        // Upload to Telegram if enabled
        if (this.useTelegram) {
          const telegram = new Telegram();
          
          // Upload the converted file
          logger.info(`📤 Uploading ${videoFormat.toUpperCase()} to Telegram...`);
          await telegram.upload(finalOutput);
          
          // If keeping raw files, also upload the FLV
          if (keepRaw) {
            const flvFile = output.replace('_flv.mp4', '.flv');
            if (fs.existsSync(flvFile)) {
              logger.info(`📤 Uploading original FLV to Telegram...`);
              await telegram.upload(flvFile);
            }
          }
        }
      } catch (error) {
        logger.error(`Post-processing error: ${error}`);
      }

    } catch (error) {
      logger.error(`Recording error: ${error}`);
      throw error;
    }
  }

  /**
   * Stop the recorder gracefully
   * @returns Promise that resolves when recorder stops
   */
  async stop(): Promise<void> {
    logger.info("🛑 Graceful stop requested for TikTok recorder");
    this.stopEvent.set();
  }

  /**
   * Handle SIGINT signal for graceful shutdown
   * @private
   */
  private handleStopSignal(): void {
    logger.info("🛑 SIGINT received, requesting graceful stop");
    this.stopEvent.set();
  }

  /**
   * Check if the user's country is blacklisted
   * @returns Promise that resolves when check is complete
   * @private
   */
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

  /**
   * Utility function to sleep for a specified number of milliseconds
   * @param ms - Number of milliseconds to sleep
   * @returns Promise that resolves after the specified time
   * @private
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}