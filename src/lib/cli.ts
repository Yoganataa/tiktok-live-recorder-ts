#!/usr/bin/env node

import { Command } from 'commander';
import * as fs from 'fs';
import * as path from 'path';
import { TstokRecorder } from '../lib';
import { Mode } from '../utils/enums';
import { logger } from '../utils/logger-manager';
import { banner } from '../utils/utils';
import { checkUpdates } from '../check-updates';
import { TikTokRecorderError } from '../utils/custom-exceptions';
import { CookiesConfig, TelegramConfig } from '../types';

/**
 * CLI arguments interface
 * @interface CLIArgs
 */
export interface CLIArgs {
  /** TikTok username(s) to record from */
  user?: string | string[];
  /** TikTok live URL to record from */
  url?: string;
  /** TikTok room ID to record from */
  roomId?: string;
  /** Recording mode: manual, automatic, followers */
  mode: string;
  /** Interval in minutes for automatic mode checking */
  automaticInterval: number;
  /** Path to cookies.json file */
  cookies?: string;
  /** Path to telegram.json file */
  telegram?: string;
  /** HTTP proxy to bypass restrictions */
  proxy?: string;
  /** Output directory for recordings */
  output?: string;
  /** Recording duration in seconds */
  duration?: number;
  /** Whether to check for updates */
  updateCheck: boolean;
}

/**
 * Parse cookies file from the provided path
 * @param cookiesPath - Path to cookies.json file
 * @returns Cookies configuration object
 */
function parseCookiesFile(cookiesPath?: string): CookiesConfig {
  const defaultCookies = {
    sessionid_ss: '',
    'tt-target-idc': 'useast2a'
  };

  if (!cookiesPath) {
    return defaultCookies;
  }

  try {
    const fullPath = path.resolve(cookiesPath);
    if (!fs.existsSync(fullPath)) {
      logger.warning(`Cookies file not found: ${fullPath}`);
      logger.info("Tip: Copy cookies.json.example to cookies.json and fill in your TikTok session ID");
      return defaultCookies;
    }

    const content = fs.readFileSync(fullPath, 'utf8');
    return JSON.parse(content);
  } catch (error) {
    logger.warning(`Failed to read cookies file: ${error}`);
    logger.info("Tip: Check the format of your cookies.json file. See cookies.json.example for the correct format");
    return defaultCookies;
  }
}

/**
 * Parse Telegram configuration file from the provided path
 * @param telegramPath - Path to telegram.json file
 * @returns Telegram configuration object or undefined
 */
function parseTelegramFile(telegramPath?: string): TelegramConfig | undefined {
  if (!telegramPath) {
    return undefined;
  }

  try {
    const fullPath = path.resolve(telegramPath);
    if (!fs.existsSync(fullPath)) {
      logger.warning(`Telegram config file not found: ${fullPath}`);
      logger.info("Tip: Copy telegram.json.example to telegram.json and fill in your Telegram credentials");
      return undefined;
    }

    const content = fs.readFileSync(fullPath, 'utf8');
    return JSON.parse(content);
  } catch (error) {
    logger.warning(`Failed to read telegram config file: ${error}`);
    logger.info("Tip: Check the format of your telegram.json file. See telegram.json.example for the correct format");
    return undefined;
  }
}

/**
 * Validate CLI arguments
 * @param args - CLI arguments to validate
 * @throws {Error} If arguments are invalid
 */
function validateArgs(args: CLIArgs): void {
  if (!['manual', 'automatic', 'followers'].includes(args.mode)) {
    throw new Error("Incorrect mode value. Choose between 'manual', 'automatic' or 'followers'.");
  }

  if (['manual', 'automatic'].includes(args.mode)) {
    if (!args.user && !args.roomId && !args.url) {
      throw new Error("Missing URL, username, or room ID. Please provide one of these parameters.");
    }
  }

  if (args.automaticInterval < 1) {
    throw new Error("Incorrect automatic_interval value. Must be one minute or more.");
  }

  if (args.duration !== undefined && args.duration <= 0) {
    throw new Error("Duration must be a positive number of seconds.");
  }

  if (args.url && !/.*www\.tiktok\.com.*|.*vm\.tiktok\.com.*/.test(args.url)) {
    throw new Error("The provided URL does not appear to be a valid TikTok live URL.");
  }
}

/**
 * Parse user input string into username(s)
 * @param userInput - User input string (comma-separated usernames)
 * @returns Single username string or array of usernames
 */
function parseUserInput(userInput?: string): string | string[] | undefined {
  if (!userInput) return undefined;
  
  const users = userInput.split(',').map(u => u.replace(/^@/, '').trim()).filter(u => u);
  return users.length === 1 ? users[0] : users;
}

/**
 * Main CLI function
 * @returns Promise that resolves when CLI execution is complete
 */
async function main(): Promise<void> {
  const program = new Command();

  program
    .name('tstok')
    .description('TstokRecorder - A library and CLI tool for recording live TikTok sessions.')
    .version('1.0.1-alpha');

  program
    .option('-u, --user <user>', 'Record from TikTok username(s), comma-separated for multiple')
    .option('--url <url>', 'Record from TikTok live URL')
    .option('-r, --room-id <roomId>', 'Record from TikTok room ID')
    .option('-m, --mode <mode>', 'Recording mode: manual, automatic, followers', 'manual')
    .option('-a, --automatic-interval <interval>', 'Check interval in minutes for automatic mode', '5')
    .option('-c, --cookies <path>', 'Path to cookies.json file (see cookies.json.example for format)')
    .option('-t, --telegram <path>', 'Path to telegram.json file (see telegram.json.example for format)')
    .option('-p, --proxy <proxy>', 'HTTP proxy to bypass restrictions')
    .option('-o, --output <output>', 'Output directory for recordings')
    .option('-d, --duration <duration>', 'Recording duration in seconds')
    .option('--no-update-check', 'Skip update check');

  program.parse();

  try {
    banner();

    const options = program.opts();
    const args: CLIArgs = {
      user: parseUserInput(options.user),
      url: options.url,
      roomId: options.roomId,
      mode: options.mode,
      automaticInterval: parseInt(options.automaticInterval),
      cookies: options.cookies,
      telegram: options.telegram,
      proxy: options.proxy,
      output: options.output,
      duration: options.duration ? parseInt(options.duration) : undefined,
      updateCheck: options.updateCheck !== false
    };

    validateArgs(args);

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
    }

    // Parse config files
    const cookies = parseCookiesFile(args.cookies);
    const telegramConfig = parseTelegramFile(args.telegram);

    // Convert mode string to enum
    let mode: Mode;
    switch (args.mode) {
      case 'manual':
        mode = Mode.MANUAL;
        break;
      case 'automatic':
        mode = Mode.AUTOMATIC;
        break;
      case 'followers':
        mode = Mode.FOLLOWERS;
        break;
      default:
        throw new Error("Invalid mode");
    }

    // Create recorder instance
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
      logger.critical(`Error: ${error}`);
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
  process.exit(1);
});

if (require.main === module) {
  main().catch(error => {
    logger.critical(`Unhandled error in main: ${error}`);
    process.exit(1);
  });
}