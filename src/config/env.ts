// src/config/env.ts
import { z } from 'zod';
import 'dotenv/config';

/**
 * Helper untuk parsing boolean dari string .env.
 * Nilai 'true' (case insensitive) dianggap true, selain itu false.
 */
const booleanString = z
  .string()
  .optional()
  .transform((val) => val?.toLowerCase() === 'true');

const envSchema = z.object({
  TIKTOK_SESSIONID_SS: z.string().min(1, 'TIKTOK_SESSIONID_SS is required'),
  TIKTOK_IDC: z.string().default('useast2a'),
  TIKTOK_PROXY: z.string().optional(),

  // Custom FFmpeg Paths (Optional)
  FFMPEG_PATH: z.string().optional(),
  FFPROBE_PATH: z.string().optional(),

  // Recorder Config
  // Default values are boolean literals, inputs are strings from .env
  KEEP_FLV: booleanString.default(false),

  RECORDER_FORMAT: z.enum(['mp4', 'mkv']).default('mkv'),

  USE_SEGMENTATION: booleanString.default(true),

  RECORDER_STALL_TIMEOUT: z.coerce.number().default(15000),
  RECORDER_QUALITY_UPGRADE_COUNT: z.coerce.number().default(5),

  TELEGRAM_API_ID: z.coerce.number().optional(),
  TELEGRAM_API_HASH: z.string().optional(),
  TELEGRAM_CHAT_ID: z.string().default('me'),
  TELEGRAM_SESSION: z.string().optional(),

  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
});

const parsed = envSchema.parse(process.env);

export interface Config {
  tiktok: {
    sessionId: string;
    idc: string;
    proxy?: string;
  };
  ffmpeg: {
    ffmpegPath?: string;
    ffprobePath?: string;
  };
  recorder: {
    keepFlv: boolean;
    format: 'mp4' | 'mkv';
    useSegmentation: boolean;
    stallTimeout: number;
    qualityUpgradeCount: number;
  };
  telegram: {
    apiId?: number;
    apiHash?: string;
    chatId: string;
    session?: string;
  };
  isProduction: boolean;
}

export const env: Config = {
  tiktok: {
    sessionId: parsed.TIKTOK_SESSIONID_SS,
    idc: parsed.TIKTOK_IDC,
    proxy: parsed.TIKTOK_PROXY,
  },
  ffmpeg: {
    ffmpegPath: parsed.FFMPEG_PATH,
    ffprobePath: parsed.FFPROBE_PATH,
  },
  recorder: {
    keepFlv: parsed.KEEP_FLV,
    format: parsed.RECORDER_FORMAT,
    useSegmentation: parsed.USE_SEGMENTATION,
    stallTimeout: parsed.RECORDER_STALL_TIMEOUT,
    qualityUpgradeCount: parsed.RECORDER_QUALITY_UPGRADE_COUNT,
  },
  telegram: {
    apiId: parsed.TELEGRAM_API_ID,
    apiHash: parsed.TELEGRAM_API_HASH,
    chatId: parsed.TELEGRAM_CHAT_ID,
    session: parsed.TELEGRAM_SESSION,
  },
  isProduction: parsed.NODE_ENV === 'production',
};
