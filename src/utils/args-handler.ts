import { Command } from 'commander';
import { ArgsParseError } from './custom-exceptions';
import { Mode, Regex } from './enums';

export interface ParsedArgs {
  url?: string;
  user?: string | string[];
  roomId?: string;
  mode: string;
  automaticInterval: number;
  proxy?: string;
  output?: string;
  duration?: number;
  telegram: boolean;
  updateCheck: boolean;
}

export function parseArgs(): ParsedArgs {
  const program = new Command();

  program
    .name('tiktok-live-recorder')
    .description('TikTok Live Recorder - A tool for recording live TikTok sessions.')
    .version('7.0.0');

  program
    .option('-url <url>', 'Record a live session from the TikTok URL.')
    .option('-user <user>', 'Record a live session from the TikTok username.')
    .option('-room_id <roomId>', 'Record a live session from the TikTok room ID.')
    .option('-mode <mode>', 'Recording mode: (manual, automatic, followers) [Default: manual]', 'manual')
    .option('-automatic_interval <interval>', 'Sets the interval in minutes to check if the user is live in automatic mode. [Default: 5]', '5')
    .option('-proxy <proxy>', 'Use HTTP proxy to bypass login restrictions in some countries.')
    .option('-output <output>', 'Specify the output directory where recordings will be saved.')
    .option('-duration <duration>', 'Specify the duration in seconds to record the live session [Default: None].')
    .option('-telegram', 'Activate the option to upload the video to Telegram at the end of the recording.')
    .option('-no-update-check', 'Disable the check for updates before running the program.');

  program.parse();

  const options = program.opts();

  return {
    url: options.Url,
    user: options.User,
    roomId: options.Room_id,
    mode: options.Mode,
    automaticInterval: parseInt(options.Automatic_interval),
    proxy: options.Proxy,
    output: options.Output,
    duration: options.Duration ? parseInt(options.Duration) : undefined,
    telegram: options.Telegram || false,
    updateCheck: !options.NoUpdateCheck
  };
}

export function validateAndParseArgs(): [ParsedArgs, Mode] {
  const args = parseArgs();

  // Ensure mode has a default value if not provided
  if (!args.mode) {
    args.mode = 'manual';
  }

  if (!['manual', 'automatic', 'followers'].includes(args.mode)) {
    throw new ArgsParseError("Incorrect mode value. Choose between 'manual', 'automatic' or 'followers'.");
  }

  if (['manual', 'automatic'].includes(args.mode)) {
    if (!args.user && !args.roomId && !args.url) {
      throw new ArgsParseError("Missing URL, username, or room ID. Please provide one of these parameters.");
    }
  }

  if (args.user) {
    if (typeof args.user === 'string') {
      const users = args.user.split(',').map(u => u.replace('@', '').trim()).filter(u => u);
      args.user = users.length === 1 ? users[0] : users;
    }
  }

  if (Array.isArray(args.user) && args.user.length > 1 && (args.roomId || args.url)) {
    throw new ArgsParseError("When using multiple usernames, do not provide room_id or url.");
  }

  if (args.url && !Regex.IS_TIKTOK_LIVE.test(args.url)) {
    throw new ArgsParseError("The provided URL does not appear to be a valid TikTok live URL.");
  }

  if (args.automaticInterval < 1) {
    throw new ArgsParseError("Incorrect automatic_interval value. Must be one minute or more.");
  }

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
      throw new ArgsParseError("Invalid mode");
  }

  return [args, mode];
}