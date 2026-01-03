#!/usr/bin/env node

import { Command } from 'commander';
import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';
import { TstokRecorder } from '../lib';
import { Mode } from '../utils/enums';
import { logger } from '../utils/logger-manager';
import { banner } from '../utils/utils';
import { checkUpdates } from '../check-updates';
import { TikTokRecorderError } from '../utils/custom-exceptions';
import { CookiesConfig, TelegramConfig } from '../types';
import * as packageJson from '../../package.json';

// Load environment variables from .env file
dotenv.config();

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
 * Load cookies configuration from environment variables
 * @returns Cookies configuration object
 */
function loadCookiesFromEnv(): CookiesConfig {
  const sessionId = process.env.TIKTOK_SESSION_ID || '';
  const targetIdc = process.env.TIKTOK_TARGET_IDC || 'useast2a';

  if (!sessionId) {
    logger.warning('TIKTOK_SESSION_ID not found in .env file');
    logger.info('Tip: Add TIKTOK_SESSION_ID=your_session_id to your .env file for full functionality');
  }

  return {
    sessionid_ss: sessionId,
    'tt-target-idc': targetIdc
  };
}

/**
 * Load Telegram configuration from environment variables
 * @returns Telegram configuration object or undefined if not configured
 */
function loadTelegramFromEnv(): TelegramConfig | undefined {
  const apiId = process.env.TELEGRAM_API_ID;
  const apiHash = process.env.TELEGRAM_API_HASH;
  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;

  // Check if all required Telegram credentials are present
  if (!botToken || !chatId) {
    return undefined;
  }

  if (!apiId || !apiHash) {
    logger.warning('TELEGRAM_API_ID or TELEGRAM_API_HASH not found in .env');
    logger.info('Tip: Add all Telegram credentials to .env for upload functionality');
    return undefined;
  }

  return {
    api_id: apiId,
    api_hash: apiHash,
    bot_token: botToken,
    chat_id: parseInt(chatId)
  };
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
 * Display environment configuration summary
 */
function displayEnvSummary(): void {
  logger.info('📋 Environment Configuration:');
  
  // TikTok Config
  const hasSession = !!process.env.TIKTOK_SESSION_ID;
  logger.info(`  • Session ID: ${hasSession ? '✅ Configured' : '❌ Not configured'}`);
  
  // Video Config
  const videoFormat = process.env.VIDEO_OUTPUT_FORMAT || 'mp4';
  const keepRaw = process.env.KEEP_RAW_FILE === 'true';
  const reencode = process.env.VIDEO_REENCODE === 'true';
  logger.info(`  • Video Format: ${videoFormat.toUpperCase()}`);
  logger.info(`  • Keep Raw FLV: ${keepRaw ? '✅ Yes' : '❌ No'}`);
  logger.info(`  • Re-encode: ${reencode ? '✅ Yes' : '❌ No (Stream copy)'}`);
  
  // Telegram Config
  const hasTelegram = !!(process.env.TELEGRAM_BOT_TOKEN && process.env.TELEGRAM_CHAT_ID);
  logger.info(`  • Telegram Upload: ${hasTelegram ? '✅ Enabled' : '❌ Disabled'}`);
  
  // Proxy Config
  const hasProxy = !!process.env.TIKTOK_PROXY;
  logger.info(`  • Proxy: ${hasProxy ? '✅ Configured' : '❌ Not configured'}`);
  
  logger.info('');
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
    .version(packageJson.version);

  program
    .option('-u, --user <user>', 'Record from TikTok username(s), comma-separated for multiple')
    .option('--url <url>', 'Record from TikTok live URL')
    .option('-r, --room-id <roomId>', 'Record from TikTok room ID')
    .option('-m, --mode <mode>', 'Recording mode: manual, automatic, followers', 'manual')
    .option('-a, --automatic-interval <interval>', 'Check interval in minutes for automatic mode', '5')
    .option('-p, --proxy <proxy>', 'HTTP proxy to bypass restrictions (overrides .env)')
    .option('-o, --output <output>', 'Output directory for recordings (overrides .env)')
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

    // Display environment configuration summary
    displayEnvSummary();

    // Load configuration from environment variables
    const cookies = loadCookiesFromEnv();
    const telegramConfig = loadTelegramFromEnv();

    // Merge CLI args with environment variables (CLI takes precedence)
    const proxy = args.proxy || process.env.TIKTOK_PROXY;
    const output = args.output || process.env.TIKTOK_OUTPUT_DIR;

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

    // Validate Followers mode requirements
    if (mode === Mode.FOLLOWERS && !cookies.sessionid_ss) {
      throw new TikTokRecorderError(
        "Followers mode requires TIKTOK_SESSION_ID in .env file.\n" +
        "Please add your TikTok session ID to the .env file."
      );
    }

    // Create recorder instance
    const recorder = new TstokRecorder({
      user: args.user,
      url: args.url,
      roomId: args.roomId,
      mode,
      automaticInterval: args.automaticInterval,
      cookies,
      proxy,
      output,
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