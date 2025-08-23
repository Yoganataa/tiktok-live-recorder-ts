import { validateAndParseArgs } from './utils/args-handler';
import { readCookies, banner } from './utils/utils';
import { logger } from './utils/logger-manager';
import { TikTokRecorderError } from './utils/custom-exceptions';
import { checkUpdates } from './check-updates';
import { TikTokRecorder } from './core/tiktok-recorder';
import { Mode } from './utils/enums';
import { ChildProcess, spawn } from 'child_process';

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
    logger.error(`${error}`);
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
      const process = spawn('node', [
        'dist/main.js',
        '-user', user,
        '-mode', args.mode,
        ...(args.automaticInterval ? ['-automatic_interval', args.automaticInterval.toString()] : []),
        ...(args.proxy ? ['-proxy', args.proxy] : []),
        ...(args.output ? ['-output', args.output] : []),
        ...(args.duration ? ['-duration', args.duration.toString()] : []),
        ...(args.telegram ? ['-telegram'] : [])
      ], {
        stdio: 'inherit'
      });
      
      processes.push(process);
    }

    // Handle Ctrl+C for multiple processes
    process.on('SIGINT', () => {
      console.log('\n[!] Ctrl-C detected.');
      processes.forEach(p => {
        if (!p.killed) {
          p.kill('SIGTERM');
        }
      });
    });

    // Wait for all processes to complete
    await Promise.all(processes.map(p => new Promise<void>((resolve) => {
      p.on('close', () => resolve());
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
      const hasUpdates = await checkUpdates();
      if (hasUpdates) {
        process.exit(0);
      }
    } else {
      logger.info("Skipped update check\n");
    }

    // Read cookies from the config file
    const cookies = readCookies();

    // Run the recordings based on the parsed arguments
    await runRecordings(args, mode, cookies);

  } catch (error) {
    if (error instanceof TikTokRecorderError) {
      logger.error(`Application Error: ${error.message}`);
    } else {
      logger.critical(`Generic Error: ${error}`);
    }
  }
}

// Run the main function
if (require.main === module) {
  main().catch(error => {
    logger.critical(`Unhandled error: ${error}`);
    process.exit(1);
  });
}