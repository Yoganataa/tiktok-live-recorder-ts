import * as fs from 'fs';
import * as path from 'path';
import { TelegramClient } from 'telegram';
import { StringSession } from 'telegram/sessions';
import { logger } from '../utils/logger-manager';
import { readTelegramConfig } from '../utils/utils';

const FREE_USER_MAX_FILE_SIZE = 2 * 1024 * 1024 * 1024; // 2GB

export class Telegram {
  private apiId: number;
  private apiHash: string;
  private botToken: string;
  private chatId: number;
  private client: TelegramClient;

  constructor() {
    const config = readTelegramConfig();
    
    this.apiId = parseInt(config.api_id);
    this.apiHash = config.api_hash;
    this.botToken = config.bot_token;
    this.chatId = config.chat_id;

    // Using StringSession to store session data in memory
    const session = new StringSession('');
    this.client = new TelegramClient(session, this.apiId, this.apiHash, {
      connectionRetries: 5,
    });
  }

  async upload(filePath: string): Promise<void> {
    try {
      const stats = fs.statSync(filePath);
      const fileSize = stats.size;
      const fileName = path.basename(filePath);
      
      logger.info(`File to upload: ${fileName} (${Math.round(fileSize / (1024 * 1024))} MB)`);

      // Check file size (assuming free user for simplicity)
      if (fileSize > FREE_USER_MAX_FILE_SIZE) {
        logger.warning("The file is too large to be uploaded with this type of account.");
        return;
      }

      logger.info("Uploading video on Telegram... This may take a while depending on the file size.");

      // Start the client
      await this.client.start({
        botAuthToken: this.botToken
      });

      // Upload the file
      await this.client.sendFile(this.chatId, {
        file: filePath,
        caption: '🎥 <b>Video recorded via <a href="https://github.com/Yoganataa/tiktok-live-recorder">TikTok Live Recorder</a></b>',
        parseMode: 'html'
      });

      logger.info("File successfully uploaded to Telegram.\n");
    } catch (error) {
      logger.error(`Error during Telegram upload: ${error}\n`);
    }
  }
}