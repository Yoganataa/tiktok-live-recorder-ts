import { spawn } from 'node:child_process';
import { unlink } from 'node:fs/promises';
import { logger } from './logger';

export async function convertFlvToMp4(
  input: string,
  output: string,
  signal?: AbortSignal
): Promise<void> {
  return new Promise((resolve, reject) => {
    logger.info({ input, output }, 'Starting FFmpeg conversion');

    const ffmpeg = spawn('ffmpeg', ['-y', '-i', input, '-c', 'copy', output]);

    const onAbort = (): void => {
      ffmpeg.kill('SIGTERM');
      reject(new Error('FFmpeg conversion aborted'));
    };

    signal?.addEventListener('abort', onAbort);

    let stderr = '';

    ffmpeg.stderr.on('data', (data: Buffer) => {
      stderr += data.toString();
    });

    ffmpeg.on('close', async (code) => {
      signal?.removeEventListener('abort', onAbort);

      if (code === 0) {
        logger.info({ output }, 'FFmpeg conversion completed successfully');
        
        // Delete original FLV file
        try {
          await unlink(input);
          logger.debug({ input }, 'Deleted original FLV file');
        } catch (err) {
          logger.warn({ input, err }, 'Failed to delete original FLV file');
        }
        
        resolve();
      } else {
        logger.error({ code, stderr }, 'FFmpeg conversion failed');
        reject(new Error(`FFmpeg exited with code ${code}: ${stderr}`));
      }
    });

    ffmpeg.on('error', (err) => {
      signal?.removeEventListener('abort', onAbort);
      logger.error({ err }, 'FFmpeg process error');
      reject(err);
    });
  });
}