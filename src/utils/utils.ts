import * as fs from 'fs';
import * as path from 'path';
import { CookiesConfig, TelegramConfig } from '../types';
import { Info } from './enums';

/**
 * Display the application banner in the console
 */
export function banner(): void {
  console.log(Info.BANNER);
}

/**
 * Read cookies configuration from cookies.json file
 * @returns Cookies configuration object
 * @throws {Error} If cookies file is not found or invalid
 */
export function readCookies(): CookiesConfig {
  const configPath = path.join(__dirname, '..', 'cookies.json');
  if (!fs.existsSync(configPath)) {
    throw new Error("Cookies file not found. Please create a cookies.json file in the project root or specify a custom path with the -cookies option. See cookies.json.example for the required format.");
  }
  const content = fs.readFileSync(configPath, 'utf8');
  return JSON.parse(content);
}

/**
 * Read Telegram configuration from telegram.json file
 * @returns Telegram configuration object
 * @throws {Error} If Telegram config file is not found or invalid
 */
export function readTelegramConfig(): TelegramConfig {
  const configPath = path.join(__dirname, '..', 'telegram.json');
  if (!fs.existsSync(configPath)) {
    throw new Error("Telegram config file not found. Please create a telegram.json file in the project root or specify a custom path with the -telegram option. See telegram.json.example for the required format.");
  }
  const content = fs.readFileSync(configPath, 'utf8');
  return JSON.parse(content);
}

/**
 * Check if the application is running in Termux environment
 * @returns True if running in Termux, false otherwise
 */
export function isTermux(): boolean {
  // Simple check for Termux environment
  return process.env.PREFIX?.includes('com.termux') || false;
}

/**
 * Check if the application is running on Windows
 * @returns True if running on Windows, false otherwise
 */
export function isWindows(): boolean {
  return process.platform === 'win32';
}

/**
 * Check if the application is running on Linux
 * @returns True if running on Linux, false otherwise
 */
export function isLinux(): boolean {
  return process.platform === 'linux';
}

/**
 * Check if a file exists at the specified path
 * @param filePath - Path to the file to check
 * @returns True if file exists, false otherwise
 */
export function fileExists(filePath: string): boolean {
  return fs.existsSync(filePath);
}