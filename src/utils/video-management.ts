import * as fs from 'fs';
import ffmpeg from 'fluent-ffmpeg';
import { logger } from './logger-manager';

/**
 * Supported video output formats
 */
export enum VideoFormat {
  MP4 = 'mp4',
  MKV = 'mkv',
  AVI = 'avi',
  MOV = 'mov',
  WEBM = 'webm'
}

/**
 * Video codec configurations for different formats
 */
interface CodecConfig {
  videoCodec: string;
  audioCodec: string;
  container: string;
}

const CODEC_CONFIGS: Record<VideoFormat, CodecConfig> = {
  [VideoFormat.MP4]: {
    videoCodec: 'copy',
    audioCodec: 'copy',
    container: 'mp4'
  },
  [VideoFormat.MKV]: {
    videoCodec: 'copy',
    audioCodec: 'copy',
    container: 'matroska'
  },
  [VideoFormat.AVI]: {
    videoCodec: 'copy',
    audioCodec: 'copy',
    container: 'avi'
  },
  [VideoFormat.MOV]: {
    videoCodec: 'copy',
    audioCodec: 'copy',
    container: 'mov'
  },
  [VideoFormat.WEBM]: {
    videoCodec: 'libvpx-vp9',
    audioCodec: 'libopus',
    container: 'webm'
  }
};

export class VideoManagement {
  /**
   * Get output format from environment variable or default to MP4
   */
  private static getOutputFormat(): VideoFormat {
    const envFormat = process.env.VIDEO_OUTPUT_FORMAT?.toLowerCase();
    
    if (envFormat && Object.values(VideoFormat).includes(envFormat as VideoFormat)) {
      return envFormat as VideoFormat;
    }
    
    if (envFormat) {
      logger.warning(`Invalid VIDEO_OUTPUT_FORMAT: ${envFormat}. Using default: mp4`);
    }
    
    return VideoFormat.MP4;
  }

  /**
   * Check if video codec conversion is enabled
   */
  private static isReencodeEnabled(): boolean {
    return process.env.VIDEO_REENCODE === 'true';
  }

  /**
   * Get custom video codec from environment
   */
  private static getCustomVideoCodec(): string | undefined {
    return process.env.VIDEO_CODEC;
  }

  /**
   * Get custom audio codec from environment
   */
  private static getCustomAudioCodec(): string | undefined {
    return process.env.AUDIO_CODEC;
  }

  /**
   * Wait for file to be released by other processes
   * @param file - Path to the file
   * @param timeout - Maximum wait time in seconds
   * @returns True if file is released, false if timeout
   */
  static async waitForFileRelease(file: string, timeout: number = 10): Promise<boolean> {
    const startTime = Date.now();
    
    while (Date.now() - startTime < timeout * 1000) {
      try {
        const handle = fs.openSync(file, 'a');
        fs.closeSync(handle);
        return true;
      } catch (error) {
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }
    return false;
  }

  /**
   * Check if raw FLV files should be kept after conversion
   */
  private static shouldKeepRawFile(): boolean {
    return process.env.KEEP_RAW_FILE === 'true';
  }

  /**
   * Get formatted file size in human-readable format
   */
  private static getFormattedFileSize(bytes: number): string {
    const units = ['B', 'KB', 'MB', 'GB'];
    let size = bytes;
    let unitIndex = 0;
    
    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024;
      unitIndex++;
    }
    
    return `${size.toFixed(2)} ${units[unitIndex]}`;
  }

  /**
   * Convert FLV to specified format based on environment configuration
   * @param file - Path to the FLV file
   * @param outputFormat - Optional override for output format
   * @returns Promise that resolves when conversion is complete
   */
  static async convertFlvToMp4(file: string, outputFormat?: VideoFormat): Promise<void> {
    const format = outputFormat || this.getOutputFormat();
    const codecConfig = CODEC_CONFIGS[format];
    const keepRaw = this.shouldKeepRawFile();
    
    logger.info(`Converting ${file} to ${format.toUpperCase()} format...`);
    
    if (keepRaw) {
      logger.info(`📦 KEEP_RAW_FILE enabled - Original FLV will be preserved`);
    }

    if (!(await this.waitForFileRelease(file))) {
      logger.error(`File ${file} is still locked after waiting. Skipping conversion.`);
      return;
    }

    return new Promise((resolve, reject) => {
      const outputFile = file.replace('_flv.mp4', `.${format}`);
      
      // Determine codecs
      let videoCodec = codecConfig.videoCodec;
      let audioCodec = codecConfig.audioCodec;
      
      // Check if re-encoding is enabled or custom codecs are specified
      if (this.isReencodeEnabled()) {
        videoCodec = this.getCustomVideoCodec() || videoCodec;
        audioCodec = this.getCustomAudioCodec() || audioCodec;
        
        logger.info(`Re-encoding enabled: video=${videoCodec}, audio=${audioCodec}`);
      }

      const converter = ffmpeg(file)
        .videoCodec(videoCodec)
        .audioCodec(audioCodec);

      // Add format-specific options
      if (format === VideoFormat.MKV) {
        converter.format(codecConfig.container);
      } else if (format === VideoFormat.WEBM) {
        // WebM specific quality settings
        converter
          .outputOptions([
            '-crf 30',
            '-b:v 0',
            '-b:a 128k'
          ]);
      }

      converter
        .output(outputFile)
        .on('start', (commandLine) => {
          logger.info(`FFmpeg command: ${commandLine}`);
        })
        .on('progress', (progress) => {
          if (progress.percent) {
            logger.info(`Conversion progress: ${Math.round(progress.percent)}%`);
          }
        })
        .on('end', () => {
          try {
            // Get file sizes for logging
            const originalSize = fs.statSync(file).size;
            const convertedSize = fs.statSync(outputFile).size;
            
            logger.info(`✅ Conversion completed: ${outputFile}`);
            logger.info(`📊 File sizes: Original=${this.getFormattedFileSize(originalSize)}, Converted=${this.getFormattedFileSize(convertedSize)}`);
            
            // Delete or keep original FLV file based on configuration
            if (keepRaw) {
              // Rename FLV file to have proper .flv extension
              const flvFile = file.replace('_flv.mp4', '.flv');
              try {
                fs.renameSync(file, flvFile);
                logger.info(`📦 Original FLV saved as: ${flvFile}`);
              } catch (renameErr) {
                logger.warning(`Failed to rename FLV file: ${renameErr}`);
                logger.info(`📦 Original FLV kept as: ${file}`);
              }
            } else {
              fs.unlinkSync(file);
              logger.info(`🗑️  Original FLV file deleted`);
            }
            
            resolve();
          } catch (err) {
            logger.warning(`Post-conversion cleanup error: ${err}`);
            resolve(); // Still resolve as conversion succeeded
          }
        })
        .on('error', (err: Error) => {
          logger.error(`❌ FFmpeg conversion error: ${err.message}`);
          reject(err);
        })
        .run();
    });
  }

  /**
   * Get video file information using ffprobe
   * @param file - Path to the video file
   * @returns Promise with video metadata
   */
  static getVideoInfo(file: string): Promise<ffmpeg.FfprobeData> {
    return new Promise((resolve, reject) => {
      ffmpeg.ffprobe(file, (err, metadata) => {
        if (err) {
          reject(err);
        } else {
          resolve(metadata);
        }
      });
    });
  }

  /**
   * Validate if FFmpeg supports the specified codec
   * @param codec - Codec name to validate
   * @param type - 'video' or 'audio'
   * @returns Promise that resolves to true if codec is supported
   */
  static async validateCodec(codec: string, type: 'video' | 'audio'): Promise<boolean> {
    return new Promise((resolve) => {
      const command = ffmpeg();
      
      const handler = type === 'video' ? 'availableEncoders' : 'availableCodecs';
      
      command[handler]((err, codecs) => {
        if (err || !codecs) {
          resolve(false);
          return;
        }
        resolve(codec in codecs);
      });
    });
  }
}