import * as https from 'https';
import { logger } from './utils/logger-manager';

/**
 * URL to the package.json file in the main branch of this repository
 */
const PACKAGE_JSON_URL = "https://raw.githubusercontent.com/Yoganataa/tiktok-live-recorder-ts/main/package.json";

/**
 * Download a file from a URL
 * @param url - URL to download from
 * @returns Promise that resolves with the file content as a string
 * @throws {Error} If download fails
 */
function downloadFile(url: string): Promise<string> {
  return new Promise((resolve, reject) => {
    https.get(url, (response) => {
      if (response.statusCode === 200) {
        let data = '';
        response.on('data', (chunk) => {
          data += chunk;
        });
        response.on('end', () => {
          resolve(data);
        });
      } else {
        reject(new Error(`Error downloading file. Status code: ${response.statusCode}`));
      }
    }).on('error', (err) => {
      reject(err);
    });
  });
}

/**
 * Check for updates by comparing local and remote versions
 * @returns Promise that resolves with true if updates are available, false otherwise
 */
export async function checkUpdates(): Promise<boolean> {
  try {
    // Get the current version from the local package.json
    const currentVersion = require('../package.json').version;
    logger.info(`Current version: ${currentVersion}`);

    // Download the package.json from the repository
    const remotePackageJson = await downloadFile(PACKAGE_JSON_URL);
    const remoteVersion = JSON.parse(remotePackageJson).version;
    logger.info(`Remote version: ${remoteVersion}`);

    // Compare versions
    if (remoteVersion !== currentVersion) {
      logger.info("A new version is available!");
      logger.info(`Update by running: npm install -g tstok`);
      return true;
    } else {
      logger.info("You are using the latest version.");
      return false;
    }
  } catch (error) {
    logger.error(`Update check failed: ${error}`);
    return false;
  }
}