import * as dotenv from 'dotenv';
import { TikTokRecorder } from '../core/tiktok-recorder';
import { Mode } from '../utils/enums';
import { CookiesConfig, TelegramConfig } from '../types';
import { logger } from '../utils/logger-manager';

// Load environment variables
dotenv.config();

/**
 * Configuration interface for TstokRecorder
 * @interface TstokRecorderConfig
 */
export interface TstokRecorderConfig {
  /** TikTok username(s) to record from. Can be a single username or array of usernames */
  user?: string | string[];
  /** TikTok live URL to record from */
  url?: string;
  /** TikTok room ID to record from */
  roomId?: string;
  /** Recording mode: MANUAL, AUTOMATIC, or FOLLOWERS */
  mode?: Mode;
  /** Interval in minutes for automatic mode checking */
  automaticInterval?: number;
  /** TikTok session cookies for authentication */
  cookies?: CookiesConfig;
  /** HTTP proxy to bypass restrictions */
  proxy?: string;
  /** Output directory for recordings */
  output?: string;
  /** Recording duration in seconds */
  duration?: number;
  /** Telegram configuration for uploading recordings */
  telegramConfig?: TelegramConfig;
}

/**
 * Main class for TstokRecorder library
 * Provides a simple interface for recording TikTok Live sessions
 * Supports multiple users concurrently.
 * * @class TstokRecorder
 */
export class TstokRecorder {
  // [Changed] Now holds an array of recorders to support multiple users
  private recorders: TikTokRecorder[] = [];
  
  private config: Required<Omit<TstokRecorderConfig, 'user' | 'url' | 'roomId' | 'proxy' | 'output' | 'duration' | 'telegramConfig'>> & 
    Pick<TstokRecorderConfig, 'user' | 'url' | 'roomId' | 'proxy' | 'output' | 'duration' | 'telegramConfig'>;

  /**
   * Creates an instance of TstokRecorder
   * @param config - Configuration options for the recorder
   */
  constructor(config: TstokRecorderConfig) {
    // Load config from environment variables if not provided
    const envConfig = this.loadEnvConfig();
    
    // Merge provided config with env config (provided config takes precedence)
    this.config = {
      mode: config.mode ?? Mode.MANUAL,
      automaticInterval: config.automaticInterval ?? 5,
      cookies: config.cookies ?? envConfig.cookies ?? {
        sessionid_ss: '',
        'tt-target-idc': 'useast2a'
      },
      user: config.user,
      url: config.url,
      roomId: config.roomId,
      proxy: config.proxy ?? envConfig.proxy,
      output: config.output ?? envConfig.output,
      duration: config.duration,
      telegramConfig: config.telegramConfig ?? envConfig.telegramConfig
    };

    this.initializeRecorders();
  }

  /**
   * Initializes recorder instances based on configuration
   * Handles single user, multiple users, URL, or RoomID
   * @private
   */
  private initializeRecorders(): void {
    const { user, url, roomId, mode, automaticInterval, cookies, proxy, output, duration, telegramConfig } = this.config;
    const useTelegram = !!telegramConfig;

    // Case 1: Multiple users (Array)
    if (Array.isArray(user)) {
      if (url || roomId) {
        logger.warning("Multiple users provided. Ignoring 'url' and 'roomId' parameters.");
      }
      
      this.recorders = user.map(username => new TikTokRecorder(
        undefined, // url
        username,
        undefined, // roomId
        mode,
        automaticInterval,
        cookies,
        proxy,
        output,
        duration,
        useTelegram
      ));
    } 
    // Case 2: Single user (String) or URL or RoomID
    else {
      this.recorders = [new TikTokRecorder(
        url,
        user, // string or undefined
        roomId,
        mode,
        automaticInterval,
        cookies,
        proxy,
        output,
        duration,
        useTelegram
      )];
    }
  }

  /**
   * Loads configuration from environment variables
   * @returns Partial configuration from environment variables
   * @private
   */
  private loadEnvConfig(): Partial<TstokRecorderConfig> {
    return {
      cookies: {
        sessionid_ss: process.env.TIKTOK_SESSION_ID || '',
        'tt-target-idc': process.env.TIKTOK_TARGET_IDC || 'useast2a'
      },
      proxy: process.env.TIKTOK_PROXY,
      output: process.env.TIKTOK_OUTPUT_DIR,
      telegramConfig: (process.env.TELEGRAM_BOT_TOKEN && process.env.TELEGRAM_CHAT_ID) ? {
        api_id: process.env.TELEGRAM_API_ID || '',
        api_hash: process.env.TELEGRAM_API_HASH || '',
        bot_token: process.env.TELEGRAM_BOT_TOKEN,
        chat_id: parseInt(process.env.TELEGRAM_CHAT_ID)
      } : undefined
    };
  }

  /**
   * Start recording based on configuration
   * Runs all recorder instances concurrently
   * @returns Promise that resolves when all recordings are complete
   */
  async start(): Promise<void> {
    try {
      if (this.recorders.length === 0) {
        logger.error("No recorders initialized. Please check your configuration.");
        return;
      }

      if (this.recorders.length > 1) {
        logger.info(`Starting ${this.recorders.length} recorders concurrently...`);
      }

      // Run all recorders in parallel
      const promises = this.recorders.map(recorder => recorder.run().catch(err => {
        logger.error(`Recorder instance failed: ${err}`);
      }));

      await Promise.all(promises);
    } catch (error) {
      logger.error(`Fatal error in main recording loop: ${error}`);
      throw error;
    }
  }

  /**
   * Request graceful shutdown of all recorders
   * @returns Promise that resolves when all recorders stop
   */
  async stop(): Promise<void> {
    try {
      logger.info("Stopping all recorders...");
      const promises = this.recorders.map(recorder => recorder.stop());
      await Promise.all(promises);
    } catch (error) {
      logger.error(`Error stopping recorders: ${error}`);
      throw error;
    }
  }

  /**
   * Get the current configuration
   * @returns Current configuration object
   */
  getConfig(): TstokRecorderConfig {
    return { ...this.config };
  }

  /**
   * Update configuration and re-initialize recorders
   * @param newConfig - Partial configuration to update
   */
  updateConfig(newConfig: Partial<TstokRecorderConfig>): void {
    this.config = { ...this.config, ...newConfig };
    // Re-initialize to reflect config changes (e.g. changing users)
    this.initializeRecorders();
  }

  /**
   * Static method to create a recorder with environment variables only
   */
  static fromEnv(): TstokRecorder {
    return new TstokRecorder({});
  }

  /**
   * Static method to record a user quickly
   */
  static async recordUser(username: string, options: Partial<TstokRecorderConfig> = {}): Promise<void> {
    const recorder = new TstokRecorder({
      user: username,
      mode: Mode.MANUAL,
      ...options
    });
    await recorder.start();
  }

  /**
   * Static method to record from URL quickly
   */
  static async recordFromUrl(url: string, options: Partial<TstokRecorderConfig> = {}): Promise<void> {
    const recorder = new TstokRecorder({
      url,
      mode: Mode.MANUAL,
      ...options
    });
    await recorder.start();
  }

  /**
   * Static method for automatic mode recording
   */
  static async recordAutomatic(username: string, options: Partial<TstokRecorderConfig> = {}): Promise<void> {
    const recorder = new TstokRecorder({
      user: username,
      mode: Mode.AUTOMATIC,
      ...options
    });
    await recorder.start();
  }
}

// Export types and enums for library users
export { Mode } from '../utils/enums';
export { CookiesConfig, TelegramConfig } from '../types';
export { 
  TikTokRecorderError, 
  UserLiveError, 
  LiveNotFound,
  ArgsParseError,
  NetworkError 
} from '../utils/custom-exceptions';

export default TstokRecorder;