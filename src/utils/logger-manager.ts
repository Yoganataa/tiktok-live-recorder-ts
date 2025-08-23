class LoggerManager {
  private static instance: LoggerManager;

  private constructor() {}

  static getInstance(): LoggerManager {
    if (!LoggerManager.instance) {
      LoggerManager.instance = new LoggerManager();
    }
    return LoggerManager.instance;
  }

  private formatTime(): string {
    return new Date().toISOString().replace('T', ' ').substring(0, 19);
  }

  info(message: string): void {
    console.log(`[*] ${this.formatTime()} - ${message}`);
  }

  error(message: string): void {
    console.error(`[!] ${this.formatTime()} - ${message}`);
  }

  warning(message: string): void {
    console.warn(`[!] ${this.formatTime()} - ${message}`);
  }

  critical(message: string): void {
    console.error(`[CRITICAL] ${this.formatTime()} - ${message}`);
  }
}

export const logger = LoggerManager.getInstance();