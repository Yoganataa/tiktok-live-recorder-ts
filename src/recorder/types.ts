// src/recorder/types.ts
import type { Mode } from '../enums';
import type { Logger } from 'pino';

export interface StreamRecordOptions {
  signal?: AbortSignal;
  logger?: Logger;
}

export type StreamRecordResult = {
  status: 'completed' | 'aborted' | 'max_segments_reached';
  segments: string[];
};

export type UrlProvider = (
  isRetry: boolean,
  previousErrorWasStall: boolean,
  attemptUpgrade: boolean,
) => Promise<string>;

export interface RecorderEvents {
  onStart?: (meta: { user: string; roomId: string }) => void;
  onStop?: () => void;
  onError?: (error: Error) => void;
}

export interface TikTokRecorderOptions {
  user: string;
  roomId?: string;
  mode: Mode;
  outputDir: string;
  intervalMinutes?: number;
  uploadToTelegram?: boolean;
  maxParallelRecordings?: number;
  events?: RecorderEvents;
}
