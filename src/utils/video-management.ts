import * as fs from 'fs';
import ffmpeg from 'fluent-ffmpeg';
import { logger } from './logger-manager';

export class VideoManagement {
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

  static async convertFlvToMp4(file: string): Promise<void> {
    logger.info(`Converting ${file} to MP4 format...`);

    if (!(await this.waitForFileRelease(file))) {
      logger.error(`File ${file} is still locked after waiting. Skipping conversion.`);
      return;
    }

    return new Promise((resolve, reject) => {
      const outputFile = file.replace('_flv.mp4', '.mp4');
      
      ffmpeg(file)
        .outputOptions('-c copy')
        .output(outputFile)
        .on('end', () => {
          fs.unlinkSync(file);
          logger.info(`Finished converting ${file}`);
          resolve();
        })
        .on('error', (err: Error) => {
          logger.error(`ffmpeg error: ${err.message}`);
          reject(err);
        })
        .run();
    });
  }
}