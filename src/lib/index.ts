import * as dotenv from 'dotenv';
import { TikTokRecorder } from '../core/tiktok-recorder';
import { Mode } from '../utils/enums';
import { CookiesConfig, TelegramConfig } from '../types';
import { logger } from '../utils/logger-manager';

// Load environment variables
dotenv.config();

export interface TstokRecorderConfig {
  user?: string | string[];
  url?: string;
  roomId?: string;
  mode?: Mode;
  automaticInterval?: number;
  cookies?: CookiesConfig;
  proxy?: string;
  output?: string;
  duration?: number;
  telegramConfig?: TelegramConfig;
}

export class TstokRecorder {
  private recorder: TikTokRecorder;
  private config: Required<Omit<TstokRecorderConfig, 'user' | 'url' | 'roomId' | 'proxy' | 'output' | 'duration' | 'telegramConfig'>> & 
    Pick<TstokRecorderConfig, 'user' | 'url' | 'roomId' | 'proxy' | 'output' | 'duration' | 'telegramConfig'>;

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
   * Get the current configuration
   */
  getConfig(): TstokRecorderConfig {
    return { ...this.config };
  }

  /**
   * Update configuration
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

// Export default
export default TstokRecorder;