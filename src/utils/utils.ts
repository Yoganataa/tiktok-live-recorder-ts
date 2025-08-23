import * as fs from 'fs';
import * as path from 'path';
import { CookiesConfig, TelegramConfig } from '../types';
import { Info } from './enums';

export function banner(): void {
  console.log(Info.BANNER);
}

export function readCookies(): CookiesConfig {
  const configPath = path.join(__dirname, '..', 'cookies.json');
  const content = fs.readFileSync(configPath, 'utf8');
  return JSON.parse(content);
}

export function readTelegramConfig(): TelegramConfig {
  const configPath = path.join(__dirname, '..', 'telegram.json');
  const content = fs.readFileSync(configPath, 'utf8');
  return JSON.parse(content);
}

export function isTermux(): boolean {
  // Simple check for Termux environment
  return process.env.PREFIX?.includes('com.termux') || false;
}

export function isWindows(): boolean {
  return process.platform === 'win32';
}

export function isLinux(): boolean {
  return process.platform === 'linux';
}

export function fileExists(filePath: string): boolean {
  return fs.existsSync(filePath);
}