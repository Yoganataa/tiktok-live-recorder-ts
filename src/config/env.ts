import 'dotenv/config';

interface TikTokConfig {
  sessionId: string;
  idc: string;
  proxy?: string;
}

interface TelegramConfig {
  apiId?: number;
  apiHash?: string;
  chatId: string;
}

export interface Config {
  tiktok: TikTokConfig;
  telegram: TelegramConfig;
}

export const env: Config = {
  tiktok: {
    sessionId: process.env.TIKTOK_SESSIONID_SS || '',
    idc: process.env.TIKTOK_IDC || 'useast2a',
    proxy: process.env.TIKTOK_PROXY,
  },
  telegram: {
    apiId: process.env.TELEGRAM_API_ID ? Number(process.env.TELEGRAM_API_ID) : undefined,
    apiHash: process.env.TELEGRAM_API_HASH,
    chatId: process.env.TELEGRAM_CHAT_ID || 'me',
  },
};

if (!env.tiktok.sessionId) {
  throw new Error('TIKTOK_SESSIONID_SS is required in environment variables');
}