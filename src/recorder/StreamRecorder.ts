// src/recorder/StreamRecorder.ts
import { createWriteStream } from 'node:fs';
import { Readable } from 'node:stream';
import { pipeline } from 'node:stream/promises';

import { env } from '../config/env';
import { logger as globalLogger } from '../utils/logger';

import type { StreamRecordOptions, StreamRecordResult, UrlProvider } from './types';
import type { HttpClient } from '../client/HttpClient';

export class StreamRecorder {
  private readonly MAX_RECONNECT_ATTEMPTS = 50;
  private readonly MAX_SEGMENTS_PER_SESSION = 200;
  private readonly STALL_TIMEOUT_MS = env.recorder.stallTimeout;
  private readonly UPGRADE_THRESHOLD = env.recorder.qualityUpgradeCount;

  constructor(private readonly http: HttpClient) {}

  async record(
    urlProvider: UrlProvider,
    baseOutput: string,
    options: StreamRecordOptions = {},
  ): Promise<StreamRecordResult> {
    const logger = options.logger || globalLogger;
    let attempts = 0;

    const segmentsSet = new Set<string>();
    let lastErrorWasStall = false;
    let cleanSegmentsCount = 0;

    while (!options.signal?.aborted) {
      if (segmentsSet.size >= this.MAX_SEGMENTS_PER_SESSION) {
        logger.warn(
          { count: segmentsSet.size },
          'Max segments limit reached. Stopping session to merge safely.',
        );
        return { status: 'max_segments_reached', segments: Array.from(segmentsSet) };
      }

      const segmentIndex = segmentsSet.size;
      const currentPath = baseOutput.replace(/(\.[\w\d]+)$/, `_part_${segmentIndex}$1`);
      const fileFlags = 'w';

      try {
        if (attempts > 0) {
          logger.info(
            { attempts, output: currentPath, wasStall: lastErrorWasStall },
            'Reconnecting stream...',
          );
        } else {
          logger.info({ output: currentPath }, 'Starting stream recording');
        }

        const isRetry = attempts > 0;
        const shouldAttemptUpgrade =
          !isRetry && !lastErrorWasStall && cleanSegmentsCount >= this.UPGRADE_THRESHOLD;

        if (shouldAttemptUpgrade) {
          logger.info(
            { cleanSegmentsCount, threshold: this.UPGRADE_THRESHOLD },
            'Network appears stable. Attempting quality upgrade...',
          );
        }

        const url = await urlProvider(isRetry, lastErrorWasStall, shouldAttemptUpgrade);

        // PERBAIKAN: Gunakan header khusus untuk stream download
        // Beberapa CDN menolak referer tiktok.com, jadi kita kosongkan atau samakan dengan URL
        const streamHeaders = {
          referer: '', // Kosongkan referer untuk menghindari blokir CDN
        };

        const segmentController = new AbortController();
        const onGlobalAbort = () => segmentController.abort();
        options.signal?.addEventListener('abort', onGlobalAbort);

        let thisSegmentStalled = false;
        let stallInterval: NodeJS.Timeout | null = null;

        try {
          const stream = await this.http.getStream(url, {
            signal: segmentController.signal,
            headers: streamHeaders,
          });
          
          const readable = Readable.fromWeb(stream);
          const file = createWriteStream(currentPath, { flags: fileFlags });

          let lastDataTime = Date.now();
          let bytesReceived = 0;

          stallInterval = setInterval(() => {
            if (segmentController.signal.aborted) return;

            const idleTime = Date.now() - lastDataTime;
            if (idleTime > this.STALL_TIMEOUT_MS) {
              logger.warn({
                idleTime,
                bytesReceived,
                msg: 'Stream stalled (No Data). Forcing reconnect...',
              });
              thisSegmentStalled = true;
              segmentController.abort();
            }
          }, 5000);

          readable.on('data', (chunk: Buffer | string) => {
            if (chunk.length > 0) {
              bytesReceived += chunk.length;
              lastDataTime = Date.now();
            }
          });

          await pipeline(readable, file, { signal: segmentController.signal });

          attempts = 0;

          if (thisSegmentStalled) {
            cleanSegmentsCount = 0;
          } else {
            cleanSegmentsCount++;
          }

          if (shouldAttemptUpgrade) {
            cleanSegmentsCount = 0;
          }

          logger.info(
            { segment: currentPath, totalBytes: bytesReceived, cleanSeq: cleanSegmentsCount },
            'Segment ended normally.',
          );
        } catch (err) {
          if (thisSegmentStalled) {
            lastErrorWasStall = true;
            cleanSegmentsCount = 0;
          } else {
            lastErrorWasStall = false;
          }
          throw err;
        } finally {
          if (stallInterval) clearInterval(stallInterval);
          options.signal?.removeEventListener('abort', onGlobalAbort);
          segmentsSet.add(currentPath);
        }
      } catch (err) {
        if (options.signal?.aborted) {
          logger.info('Stream recording stopped by user.');
          return { status: 'aborted', segments: Array.from(segmentsSet) };
        }

        attempts++;
        const errMsg = err instanceof Error ? err.message : String(err);
        const isAbortError =
          err instanceof Error && (err.name === 'AbortError' || err.message.includes('aborted'));

        // PERBAIKAN: Jika error adalah 403/404, anggap sebagai stall agar memicu downgrade quality
        const isFatalStreamError = errMsg.includes('404') || errMsg.includes('403');
        if (isFatalStreamError) {
          lastErrorWasStall = true; 
        }

        if (!isAbortError || lastErrorWasStall) {
          logger.warn(
            {
              err: errMsg,
              attempts,
              wasStall: lastErrorWasStall,
            },
            lastErrorWasStall
              ? 'Stall/Error detected. Connection reset & potential quality downgrade...'
              : 'Stream interrupted. Retrying...',
          );
        }

        if (attempts >= this.MAX_RECONNECT_ATTEMPTS) {
          logger.error('Max reconnection attempts reached. Giving up.');
          throw err;
        }

        const delay = Math.min(2000 * Math.ceil(attempts / 2), 10000);
        await new Promise((res) => setTimeout(res, delay));
      }
    }
    return { status: 'aborted', segments: Array.from(segmentsSet) };
  }
}