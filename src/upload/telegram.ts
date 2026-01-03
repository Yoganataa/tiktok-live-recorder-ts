import * as fs from 'fs';
import * as path from 'path';
import { TelegramClient } from 'telegram';
import { StringSession } from 'telegram/sessions';
import { Api } from 'telegram';
import { logger } from '../utils/logger-manager';
import { readTelegramConfig } from '../utils/utils';

const FREE_USER_MAX_FILE_SIZE = 2 * 1024 * 1024 * 1024; // 2GB
const PREMIUM_USER_MAX_FILE_SIZE = 4 * 1024 * 1024 * 1024; // 4GB

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

      await this.client.connect();

      // Ensure user is authorized
      // Note: In bot mode, start() with botAuthToken is usually sufficient
      if (!await this.client.isUserAuthorized()) {
          await this.client.start({
              botAuthToken: this.botToken
          });
      }

      // [V7.5 Logic] Check for Premium status to determine max file size
      let maxFileSize = FREE_USER_MAX_FILE_SIZE;
      try {
        const me = await this.client.getMe();
        if (me instanceof Api.User && me.premium) {
            maxFileSize = PREMIUM_USER_MAX_FILE_SIZE;
            logger.info("Telegram Premium account detected. Max file size limit increased to 4GB.");
        }
      } catch (e) {
          logger.warning(`Failed to check Telegram Premium status: ${e}. Defaulting to 2GB limit.`);
      }
      
      logger.info(`File to upload: ${fileName} (${Math.round(fileSize / (1024 * 1024))} MB)`);

      if (fileSize > maxFileSize) {
        logger.warning(
            `The file is too large to be uploaded with this type of account. ` +
            `(Limit: ${maxFileSize / (1024 * 1024 * 1024)}GB)`
        );
        return;
      }

      logger.info("Uploading video on Telegram... This may take a while depending on the file size.");

      // Upload the file
      await this.client.sendFile(this.chatId, {
        file: filePath,
        caption: '🎥 <b>Video recorded via <a href="https://github.com/Yoganataa/tiktok-live-recorder-ts">TikTok Live Recorder</a></b>',
        parseMode: 'html',
        forceDocument: true // Ensure sending as file, not compressed video
      });

      logger.info("File successfully uploaded to Telegram.\n");
    } catch (error) {
      logger.error(`Error during Telegram upload: ${error}\n`);
    } finally {
        await this.client.disconnect();
    }
  }
}