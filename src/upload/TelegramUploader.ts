import { TelegramClient } from 'telegram';
import { StringSession } from 'telegram/sessions';
import { statSync } from 'node:fs';
import { basename } from 'node:path';
import { logger } from '../utils/logger';
import { env } from '../config/env';

const FREE_MAX_SIZE = 2 * 1024 * 1024 * 1024; // 2 GB
const PREMIUM_MAX_SIZE = 4 * 1024 * 1024 * 1024; // 4 GB

export class TelegramUploader {
  private client: TelegramClient | null = null;

  private async getClient(): Promise<TelegramClient> {
    if (this.client) {
      return this.client;
    }

    if (!env.telegram.apiId || !env.telegram.apiHash) {
      throw new Error('Telegram API credentials are missing in environment');
    }

    logger.info('Initializing Telegram client');

    const sessionString = process.env.TELEGRAM_SESSION || '';
    const session = new StringSession(sessionString);
    
    const client = new TelegramClient(session, env.telegram.apiId, env.telegram.apiHash, {
      connectionRetries: 3,
    });

    await client.start({
      phoneNumber: async () => {
        throw new Error('Interactive login is not supported. Please set TELEGRAM_SESSION in your .env file.');
      },
      password: async () => {
        throw new Error('2FA Password required but interactive mode is disabled. Please update your session string.');
      },
      phoneCode: async () => {
        throw new Error('Login code required but interactive mode is disabled. Please update your session string.');
      },
      onError: (err) => {
        logger.error({ err }, 'Telegram client error');
      },
    });

    this.client = client;
    logger.info('Telegram client initialized successfully');
    
    return client;
  }

  async upload(filePath: string): Promise<void> {
    try {
      const client = await this.getClient();
      const stat = statSync(filePath);

      const me = await client.getMe();
      const isPremium = Boolean((me as { premium?: boolean })?.premium);
      const maxSize = isPremium ? PREMIUM_MAX_SIZE : FREE_MAX_SIZE;

      logger.info({
        file: basename(filePath),
        sizeMB: Math.round(stat.size / (1024 * 1024)),
        isPremium,
      }, 'Preparing Telegram upload');

      if (stat.size > maxSize) {
        logger.warn({
          sizeMB: Math.round(stat.size / (1024 * 1024)),
          maxMB: Math.round(maxSize / (1024 * 1024)),
        }, 'File too large for Telegram upload');
        return;
      }

      await client.sendFile(env.telegram.chatId, {
        file: filePath,
        forceDocument: true,
        caption: '🎥 Recorded via <b>@yoganataa/tstok</b>',
        parseMode: 'html',
      });

      logger.info({ file: basename(filePath) }, 'Telegram upload completed successfully');
    } catch (err) {
      logger.error({ err, file: basename(filePath) }, 'Telegram upload failed');
    }
  }

  async disconnect(): Promise<void> {
    if (this.client) {
      await this.client.disconnect();
      this.client = null;
      logger.info('Telegram client disconnected');
    }
  }
}