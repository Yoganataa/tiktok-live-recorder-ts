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
 * 
 * @class TstokRecorder
 * @example
 * ```typescript
 * // Record a user manually
 * const recorder = new TstokRecorder({
 *   user: 'username',
 *   mode: Mode.MANUAL
 * });
 * await recorder.start();
 * ```
 */
export class TstokRecorder {
  private recorder: TikTokRecorder;
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

    // Create TikTokRecorder instance
    this.recorder = new TikTokRecorder(
      this.config.url,
      typeof this.config.user === 'string' ? this.config.user : undefined,
      this.config.roomId,
      this.config.mode,
      this.config.automaticInterval,
      this.config.cookies,
      this.config.proxy,
      this.config.output,
      this.config.duration,
      !!this.config.telegramConfig
    );
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
   * @returns Promise that resolves when recording starts
   * @throws {TikTokRecorderError} If recording fails to start
   */
  async start(): Promise<void> {
    try {
      await this.recorder.run();
    } catch (error) {
      logger.error(`Recording failed: ${error}`);
      throw error;
    }
  }

  /**
   * Request graceful shutdown of the recorder
   * @returns Promise that resolves when recorder stops
   * @throws {TikTokRecorderError} If stopping fails
   */
  async stop(): Promise<void> {
    try {
      await this.recorder.stop();
    } catch (error) {
      logger.error(`Error stopping recorder: ${error}`);
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
   * Update configuration
   * @param newConfig - Partial configuration to update
   */
  updateConfig(newConfig: Partial<TstokRecorderConfig>): void {
    this.config = { ...this.config, ...newConfig };
    
    // Recreate recorder with new config
    this.recorder = new TikTokRecorder(
      this.config.url,
      typeof this.config.user === 'string' ? this.config.user : undefined,
      this.config.roomId,
      this.config.mode,
      this.config.automaticInterval,
      this.config.cookies,
      this.config.proxy,
      this.config.output,
      this.config.duration,
      !!this.config.telegramConfig
    );
  }

  /**
   * Static method to create a recorder with environment variables only
   * @returns New TstokRecorder instance configured from environment variables
   */
  static fromEnv(): TstokRecorder {
    return new TstokRecorder({});
  }

  /**
   * Static method to record a user quickly
   * @param username - TikTok username to record
   * @param options - Additional configuration options
   * @returns Promise that resolves when recording completes
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
   * @param url - TikTok live URL to record
   * @param options - Additional configuration options
   * @returns Promise that resolves when recording completes
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
   * @param username - TikTok username to monitor and record
   * @param options - Additional configuration options
   * @returns Promise that resolves when recording completes
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

// Export default
export default TstokRecorder;