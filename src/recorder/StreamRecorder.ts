import { createWriteStream } from 'node:fs';
import { unlink, access } from 'node:fs/promises';
import { pipeline } from 'node:stream/promises';
import { Readable } from 'node:stream';
import type { HttpClient } from '../client/HttpClient';
import { logger } from '../utils/logger';

export interface StreamRecordOptions {
  signal?: AbortSignal;
}

export class StreamRecorder {
  constructor(private readonly http: HttpClient) {}

  async record(
    url: string,
    output: string,
    options: StreamRecordOptions = {}
  ): Promise<void> {
    logger.info({ output }, 'Starting stream recording');

    const stream = await this.http.getStream(url, { signal: options.signal });
    const readable = Readable.fromWeb(stream as never);
    const file = createWriteStream(output);

    try {
      await pipeline(readable, file, { signal: options.signal });
      logger.info({ output }, 'Stream recording completed successfully');
    } catch (err) {
      // Clean up on error
      file.close();

      if (options.signal?.aborted) {
        logger.info({ output }, 'Stream recording aborted');
        
        try {
          await access(output);
          await unlink(output);
          logger.debug({ output }, 'Deleted incomplete recording file');
        } catch {
          // File doesn't exist or can't be deleted, ignore
        }
        
        return;
      }

      logger.error({ err, output }, 'Stream recording failed');
      throw err;
    }
  }
}
