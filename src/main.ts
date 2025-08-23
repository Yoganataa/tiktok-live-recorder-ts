import { validateAndParseArgs } from './utils/args-handler';
import { readCookies, banner } from './utils/utils';
import { logger } from './utils/logger-manager';
import { TikTokRecorderError } from './utils/custom-exceptions';
import { checkUpdates } from './check-updates';
import { TikTokRecorder } from './core/tiktok-recorder';
import { Mode } from './utils/enums';
import { ChildProcess, spawn } from 'child_process';
import * as path from 'path';

async function recordUser(
  user?: string | string[],
  url?: string,
  roomId?: string,
  mode: Mode = Mode.MANUAL,
  interval: number = 5,
  proxy?: string,
  output?: string,
  duration?: number,
  useTelegram: boolean = false,
  cookies?: any
): Promise<void> {
  try {
    const recorder = new TikTokRecorder(
      url,
      typeof user === 'string' ? user : undefined,
      roomId,
      mode,
      interval,
      cookies,
      proxy,
      output,
      duration,
      useTelegram
    );
    
    await recorder.run();
  } catch (error) {
    logger.error(`Recording error: ${error}`);
  }
}

async function runRecordings(
  args: any,
  mode: Mode,
  cookies: any
): Promise<void> {
  if (Array.isArray(args.user)) {
    const processes: ChildProcess[] = [];
    
    for (const user of args.user) {
      const childArgs = [
        path.join(__dirname, 'main.js'),
        '-user', user,
        '-mode', args.mode
      ];

      if (args.automaticInterval) {
        childArgs.push('-automatic_interval', args.automaticInterval.toString());
      }
      if (args.proxy) {
        childArgs.push('-proxy', args.proxy);
      }
      if (args.output) {
        childArgs.push('-output', args.output);
      }
      if (args.duration) {
        childArgs.push('-duration', args.duration.toString());
      }
      if (args.telegram) {
        childArgs.push('-telegram');
      }

      const process = spawn('node', childArgs, {
        stdio: 'inherit',
        detached: false
      });
      
      processes.push(process);
    }

    // Handle Ctrl+C for multiple processes
    const handleSignal = (signal: string) => {
      console.log(`\n[!] ${signal} detected.`);
      processes.forEach(p => {
        if (!p.killed) {
          p.kill('SIGTERM');
        }
      });
      process.exit(0);
    };

    process.on('SIGINT', () => handleSignal('SIGINT'));
    process.on('SIGTERM', () => handleSignal('SIGTERM'));

    // Wait for all processes to complete
    await Promise.all(processes.map(p => new Promise<void>((resolve) => {
      p.on('close', (code) => {
        logger.info(`Child process exited with code ${code}`);
        resolve();
      });
      p.on('error', (error) => {
        logger.error(`Child process error: ${error}`);
        resolve();
      });
    })));
    
  } else {
    await recordUser(
      args.user,
      args.url,
      args.roomId,
      mode,
      args.automaticInterval,
      args.proxy,
      args.output,
      args.duration,
      args.telegram,
      cookies
    );
  }
}

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

    // Read cookies from the config file
    let cookies: any;
    try {
      cookies = readCookies();
    } catch (cookieError) {
      logger.warning(`Failed to read cookies: ${cookieError}. Continuing without cookies...`);
      cookies = { sessionid_ss: '', 'tt-target-idc': 'useast2a' };
    }

    // Run the recordings based on the parsed arguments
    await runRecordings(args, mode, cookies);

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