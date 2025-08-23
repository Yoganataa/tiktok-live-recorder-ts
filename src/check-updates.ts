import * as fs from 'fs';
import * as path from 'path';
import * as https from 'https';
import * as AdmZip from 'adm-zip';
import { logger } from './utils/logger-manager';

const URL = "https://raw.githubusercontent.com/Yoganataa/tiktok-live-recorder/main/src/utils/enums.py";
const URL_REPO = "https://github.com/Yoganataa/tiktok-live-recorder/archive/refs/heads/main.zip";
const FILE_TEMP = "enums_temp.py";
const FILE_NAME_UPDATE = URL_REPO.split("/").pop() || "main.zip";

function deleteTmpFile(): void {
  try {
    fs.unlinkSync(FILE_TEMP);
  } catch {
    // Ignore error
  }
}

function checkFile(filePath: string): boolean {
  return fs.existsSync(filePath);
}

function downloadFile(url: string, fileName: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(fileName);
    
    https.get(url, (response) => {
      if (response.statusCode === 200) {
        response.pipe(file);
        file.on('finish', () => {
          file.close();
          resolve();
        });
      } else {
        fs.unlinkSync(fileName);
        reject(new Error("Error downloading the file."));
      }
    }).on('error', (err) => {
      fs.unlinkSync(fileName);
      reject(err);
    });
  });
}

export async function checkUpdates(): Promise<boolean> {
  try {
    await downloadFile(URL, FILE_TEMP);

    if (!checkFile(FILE_TEMP)) {
      deleteTmpFile();
      logger.info("The temporary file does not exist.");
      return false;
    }

    // Since this is a TypeScript conversion, we'll skip the Python module import
    // and assume no updates are available for now
    deleteTmpFile();
    return false;

  } catch (error) {
    logger.error(`Update check failed: ${error}`);
    deleteTmpFile();
    return false;
  }
}
