// src/utils/ffmpeg.ts
import { spawn, execFile } from 'node:child_process';
import { unlink, writeFile, rename } from 'node:fs/promises';
import { resolve } from 'node:path';
import { promisify } from 'node:util';

import { env } from '../config/env';

import { logger } from './logger';

const execFileAsync = promisify(execFile);

// Use path from env if available, otherwise use system default
const FFMPEG_BIN = env.ffmpeg.ffmpegPath || 'ffmpeg';
const FFPROBE_BIN = env.ffmpeg.ffprobePath || 'ffprobe';

/**
 * Checks if a binary is available in PATH or at the specific location.
 */
async function checkToolAvailability(toolName: string, binPath: string): Promise<void> {
  try {
    await execFileAsync(binPath, ['-version']);
    logger.debug({ tool: toolName, path: binPath }, 'Tool found and executable');
  } catch {
    // We don't need the error variable here, so we omit it to silence linter
    throw new Error(
      `${toolName} is not installed or not found at path: "${binPath}". Please install it or check .env config.`,
    );
  }
}

export const ensureFFmpegAvailable = () => checkToolAvailability('ffmpeg', FFMPEG_BIN);
export const ensureFFprobeAvailable = () => checkToolAvailability('ffprobe', FFPROBE_BIN);

interface MediaInfo {
  width?: number;
  height?: number;
  codec_name?: string;
}

async function getMediaInfo(filePath: string): Promise<MediaInfo> {
  try {
    const { stdout } = await execFileAsync(FFPROBE_BIN, [
      '-v',
      'error',
      '-select_streams',
      'v:0',
      '-show_entries',
      'stream=width,height,codec_name',
      '-of',
      'json',
      filePath,
    ]);

    const json = JSON.parse(stdout);
    const stream = json.streams?.[0];
    return stream
      ? { width: stream.width, height: stream.height, codec_name: stream.codec_name }
      : {};
  } catch {
    return {};
  }
}

export async function checkSegmentCompatibility(segments: string[]): Promise<boolean> {
  if (segments.length < 2) return true;
  try {
    const [first, ...rest] = segments;
    const baseInfo = await getMediaInfo(first!);

    if (!baseInfo.width || !baseInfo.height) return true;

    for (const segment of rest) {
      const info = await getMediaInfo(segment);
      if (
        info.width !== baseInfo.width ||
        info.height !== baseInfo.height ||
        info.codec_name !== baseInfo.codec_name
      ) {
        logger.warn(
          { msg: 'Segment incompatibility detected', base: baseInfo, current: info },
          'Segments differ in resolution or codec',
        );
        return false;
      }
    }
    return true;
  } catch (err) {
    logger.warn({ err }, 'Compatibility check failed, assuming incompatible');
    return false;
  }
}

function getOutputArguments(output: string, reEncode: boolean): string[] {
  const isMp4 = output.endsWith('.mp4');
  const isMkv = output.endsWith('.mkv');

  const commonArgs = ['-fflags', '+genpts'];

  const encodingArgs = reEncode
    ? ['-c:v', 'libx264', '-preset', 'veryfast', '-crf', '23', '-c:a', 'aac']
    : ['-c', 'copy', '-bsf:a', 'aac_adtstoasc', '-avoid_negative_ts', 'make_zero'];

  const containerArgs = isMp4
    ? ['-movflags', '+faststart', '-f', 'mp4']
    : isMkv
      ? ['-f', 'matroska']
      : [];

  return [...encodingArgs, ...commonArgs, ...containerArgs];
}

/**
 * Shared helper to execute FFmpeg, handle temp files, renaming, and cleanup.
 */
async function processFFmpegOperation(
  args: string[],
  output: string,
  tempOutput: string,
  cleanupTasks: (() => Promise<void>)[],
  signal?: AbortSignal,
): Promise<void> {
  const absOutput = resolve(output);

  await executeFFmpeg(
    args,
    async () => {
      await rename(tempOutput, absOutput);
      await Promise.all(cleanupTasks.map((task) => task()));
    },
    signal,
  );
}

export async function mergeSegments(
  segments: string[],
  output: string,
  options: { keepSource: boolean; reEncode: boolean },
): Promise<void> {
  if (segments.length === 0) return;
  if (segments.length === 1) {
    return convertFlvToContainer(segments[0]!, output, undefined, options.keepSource);
  }

  const absOutput = resolve(output);
  const tempOutput = `${absOutput}.tmp`;
  const listPath = `${absOutput}.txt`;

  // Create concat list
  const listContent = segments
    .map((f) => `file '${resolve(f).replace(/\\/g, '/').replace(/'/g, "'\\''")}'`)
    .join('\n');

  await writeFile(listPath, listContent);

  const args = [
    '-y',
    '-f',
    'concat',
    '-safe',
    '0',
    '-i',
    listPath,
    ...getOutputArguments(output, options.reEncode),
    tempOutput,
  ];

  const cleanupTasks = [
    async () => unlink(listPath).catch(() => {}), // Always delete list file
  ];

  if (!options.keepSource) {
    cleanupTasks.push(async () => {
      await Promise.all(segments.map((s) => unlink(s).catch(() => {})));
    });
  }

  await processFFmpegOperation(args, output, tempOutput, cleanupTasks);
}

export async function convertFlvToContainer(
  input: string,
  output: string,
  signal?: AbortSignal,
  keepSource = false,
): Promise<void> {
  const absInput = resolve(input);
  const absOutput = resolve(output);
  const tempOutput = `${absOutput}.tmp`;

  const args = [
    '-y',
    '-fflags',
    '+genpts',
    '-i',
    absInput,
    ...getOutputArguments(output, false), // Force copy for single file
    tempOutput,
  ];

  const cleanupTasks: (() => Promise<void>)[] = [];
  if (!keepSource) {
    cleanupTasks.push(async () =>
      unlink(absInput).catch((e) => logger.warn({ err: e }, 'Failed to delete source')),
    );
  }

  await processFFmpegOperation(args, output, tempOutput, cleanupTasks, signal);
}

function executeFFmpeg(
  args: string[],
  onSuccess: () => Promise<void>,
  signal?: AbortSignal,
): Promise<void> {
  return new Promise((resolve, reject) => {
    // USE CUSTOM BINARY
    const ffmpeg = spawn(FFMPEG_BIN, args);
    let stderr = '';

    const abortHandler = () => {
      ffmpeg.kill('SIGTERM');
      reject(new Error('FFmpeg processing aborted'));
    };
    signal?.addEventListener('abort', abortHandler);

    ffmpeg.stderr.on('data', (d) => (stderr += d.toString()));

    ffmpeg.on('close', async (code) => {
      signal?.removeEventListener('abort', abortHandler);
      if (code === 0) {
        try {
          await onSuccess();
          logger.info('FFmpeg process completed successfully');
          resolve();
        } catch (err) {
          reject(err as Error);
        }
      } else {
        if (!signal?.aborted) {
          logger.error({ code, stderr: stderr.slice(-300) }, 'FFmpeg failed');
        }
        reject(
          new Error(signal?.aborted ? 'FFmpeg aborted by user' : `FFmpeg exited with code ${code}`),
        );
      }
    });

    ffmpeg.on('error', (err) => {
      signal?.removeEventListener('abort', abortHandler);
      reject(err);
    });
  });
}
