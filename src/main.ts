// Legacy main.ts file for backward compatibility
// This file maintains compatibility with the old CLI interface

import { TstokRecorder } from './lib';
import { validateAndParseArgs } from './utils/args-handler';
import { readCookies, readTelegramConfig, banner } from './utils/utils';
import { logger } from './utils/logger-manager';
import { TikTokRecorderError } from './utils/custom-exceptions';
import { checkUpdates } from './check-updates';
import { Mode } from './utils/enums';

async function main(): Promise<void> {
  try {
    // Print the banner
    banner();

    // Validate and parse command line arguments
    const [args, mode] = validateAndParseArgs();

    // Check for updates
    if (args.updateCheck) {
      logger.info("Checking for updates...\n");
      try {
        const hasUpdates = await checkUpdates();
        if (hasUpdates) {
          process.exit(0);
        }
      } catch (updateError) {
        logger.warning(`Update check failed: ${updateError}. Continuing...`);
      }
    } else {
      logger.info("Skipped update check\n");
    }

    // Read cookies and telegram config
    let cookies: any;
    let telegramConfig: any;
    
    try {
      cookies = readCookies();
    } catch (cookieError) {
      logger.warning(`Failed to read cookies: ${cookieError}. Continuing without cookies...`);
      cookies = { sessionid_ss: '', 'tt-target-idc': 'useast2a' };
    }

    try {
      telegramConfig = args.telegram ? readTelegramConfig() : undefined;
    } catch (telegramError) {
      logger.warning(`Failed to read telegram config: ${telegramError}. Continuing without telegram...`);
      telegramConfig = undefined;
    }

    // Create recorder instance using the new library
    const recorder = new TstokRecorder({
      user: args.user,
      url: args.url,
      roomId: args.roomId,
      mode,
      automaticInterval: args.automaticInterval,
      cookies,
      proxy: args.proxy,
      output: args.output,
      duration: args.duration,
      telegramConfig
    });

    // Start recording
    await recorder.start();

  } catch (error) {
    if (error instanceof TikTokRecorderError) {
      logger.error(`Application Error: ${error.message}`);
      process.exit(1);
    } else {
      logger.critical(`Generic Error: ${error}`);
      process.exit(1);
    }
  }
}

// Handle unhandled rejections and exceptions
process.on('unhandledRejection', (reason, promise) => {
  logger.critical(`Unhandled Rejection at: ${promise}, reason: ${reason}`);
  process.exit(1);
});

process.on('uncaughtException', (error) => {
  logger.critical(`Uncaught Exception: ${error.message}`);
  logger.critical(`Stack: ${error.stack}`);
  process.exit(1);
});

// Run the main function
if (require.main === module) {
  main().catch(error => {
    logger.critical(`Unhandled error in main: ${error}`);
    process.exit(1);
  });
}