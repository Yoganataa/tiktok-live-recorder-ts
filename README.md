# TstokRecorder - TikTok Live Recorder Library & CLI

A modern TypeScript library and CLI tool for recording live TikTok sessions with enhanced error handling and professional architecture.

> **📍 Based on:** This project is a TypeScript rewrite and enhancement of the original [tiktok-live-recorder](https://github.com/Michele0303/tiktok-live-recorder) by [Michele0303](https://github.com/Michele0303).

## 🚀 Installation

### Global Installation (CLI Tool)

```bash
npm install -g tstok
```

### Local Installation (Library)

```bash
npm install tstok
```

### Prerequisites
- Node.js 16 or higher
- FFmpeg installed on your system

### Install FFmpeg

**Windows:**
```bash
# Using Chocolatey
choco install ffmpeg
```

**macOS:**
```bash
brew install ffmpeg
```

**Ubuntu/Debian:**
```bash
sudo apt update
sudo apt install ffmpeg
```

## 📋 CLI Usage

### Basic Commands

```bash
# Record a specific user
tstok -user username

# Record from URL
tstok -url "https://www.tiktok.com/@username/live"

# Record with room ID
tstok -room_id 1234567890

# Use custom cookies file
tstok -user username -cookies ./my-cookies.json

# Use custom telegram config
tstok -user username -telegram ./my-telegram.json

# Multiple users
tstok -user "user1,user2,user3" -mode manual
```

### Advanced Options

```bash
# Automatic mode (keeps checking if user goes live)
tstok -user username -mode automatic

# Set custom check interval (minutes)
tstok -user username -mode automatic -automatic_interval 3

# Record with duration limit (seconds)
tstok -user username -duration 3600

# Custom output directory
tstok -user username -output "./recordings/"

# Use proxy
tstok -user username -proxy "http://127.0.0.1:8080"

# Followers mode (record all your followed users when they go live)
tstok -mode followers -cookies ./cookies.json
```

### Configuration Files

#### Custom Cookies File (`my-cookies.json`)
```json
{
  "sessionid_ss": "your_session_id_here",
  "tt-target-idc": "useast2a"
}
```

#### Custom Telegram Config (`my-telegram.json`)
```json
{
  "api_id": "your_api_id",
  "api_hash": "your_api_hash",
  "bot_token": "your_bot_token",
  "chat_id": 1234567890
}
```

## 📚 Library Usage

### Environment Variables Setup

Create a `.env` file in your project root:

```env
# TikTok Cookies
TIKTOK_SESSION_ID=your_session_id_here
TIKTOK_TARGET_IDC=useast2a

# Optional: Proxy
TIKTOK_PROXY=http://127.0.0.1:8080

# Optional: Output Directory
TIKTOK_OUTPUT_DIR=./recordings/

# Optional: Telegram Config
TELEGRAM_API_ID=your_api_id
TELEGRAM_API_HASH=your_api_hash
TELEGRAM_BOT_TOKEN=your_bot_token
TELEGRAM_CHAT_ID=1234567890
```

### Basic Usage

```typescript
import { TstokRecorder, Mode } from 'tstok';

// Quick record a user (uses .env config)
await TstokRecorder.recordUser('username');

// Quick record from URL
await TstokRecorder.recordFromUrl('https://www.tiktok.com/@username/live');

// Automatic mode
await TstokRecorder.recordAutomatic('username', {
  automaticInterval: 5 // Check every 5 minutes
});
```

### Advanced Usage

```typescript
import { TstokRecorder, Mode } from 'tstok';

// Create recorder with custom configuration
const recorder = new TstokRecorder({
  user: 'username',
  mode: Mode.MANUAL,
  automaticInterval: 5,
  cookies: {
    sessionid_ss: 'your_session_id',
    'tt-target-idc': 'useast2a'
  },
  output: './my-recordings/',
  duration: 3600, // 1 hour limit
  telegramConfig: {
    api_id: 'your_api_id',
    api_hash: 'your_api_hash',
    bot_token: 'your_bot_token',
    chat_id: 1234567890
  }
});

// Start recording
await recorder.start();
```

### Multiple Users

```typescript
import { TstokRecorder, Mode } from 'tstok';

// Record multiple users
const recorder = new TstokRecorder({
  user: ['user1', 'user2', 'user3'],
  mode: Mode.MANUAL
});

await recorder.start();
```

### Using Only Environment Variables

```typescript
import { TstokRecorder } from 'tstok';

// Create recorder from environment variables
const recorder = TstokRecorder.fromEnv();

// Update specific config
recorder.updateConfig({
  user: 'username',
  mode: Mode.AUTOMATIC
});

await recorder.start();
```

### Error Handling

```typescript
import { 
  TstokRecorder, 
  TikTokRecorderError, 
  UserLiveError, 
  LiveNotFound 
} from 'tstok';

try {
  await TstokRecorder.recordUser('username');
} catch (error) {
  if (error instanceof UserLiveError) {
    console.log('User is not currently live');
  } else if (error instanceof LiveNotFound) {
    console.log('Live stream not found');
  } else if (error instanceof TikTokRecorderError) {
    console.log('TikTok recorder error:', error.message);
  } else {
    console.log('Unexpected error:', error);
  }
}
```

## 🛠 Development

```bash
# Clone the repository
git clone https://github.com/Yoganataa/tstok.git
cd tstok

# Install dependencies
npm install

# Build the project
npm run build

# Run CLI in development
npm run dev -- -user username

# Watch for changes
npm run watch
```

### Available Scripts
- `npm run build` - Compile TypeScript to JavaScript
- `npm run start` - Run the compiled CLI
- `npm run dev` - Run with ts-node for development
- `npm run watch` - Watch for changes and rebuild
- `npm run clean` - Remove dist folder

## 📊 API Reference

### TstokRecorder Class

#### Constructor
```typescript
new TstokRecorder(config: TstokRecorderConfig)
```

#### Static Methods
- `TstokRecorder.recordUser(username, options?)` - Quick record a user
- `TstokRecorder.recordFromUrl(url, options?)` - Quick record from URL
- `TstokRecorder.recordAutomatic(username, options?)` - Automatic mode recording
- `TstokRecorder.fromEnv()` - Create from environment variables

#### Instance Methods
- `start()` - Start recording
- `getConfig()` - Get current configuration
- `updateConfig(newConfig)` - Update configuration

### Configuration Interface

```typescript
interface TstokRecorderConfig {
  user?: string | string[];
  url?: string;
  roomId?: string;
  mode?: Mode;
  automaticInterval?: number;
  cookies?: CookiesConfig;
  proxy?: string;
  output?: string;
  duration?: number;
  telegramConfig?: TelegramConfig;
}
```

### Modes

```typescript
enum Mode {
  MANUAL = 0,      // Record once if live
  AUTOMATIC = 1,   // Keep checking if user goes live
  FOLLOWERS = 2    // Record all followed users when they go live
}
```

## 🔧 Troubleshooting

### Common Issues

1. **"Unable to retrieve live streaming url"**
   - User might not be live
   - Add cookies configuration
   - Check if you need a proxy due to geo-restrictions

2. **FFmpeg not found**
   - Install FFmpeg and ensure it's in your PATH
   - On Windows, you might need to restart your terminal

3. **Permission errors**
   - Ensure you have write permissions to the output directory
   - On Linux/Mac, check file permissions

4. **Library import errors**
   - Make sure you've installed the package: `npm install tstok`
   - Check that your TypeScript/Node.js version is compatible

## 📄 Publishing

To publish this as an npm package:

```bash
# Build the project
npm run build

# Publish to npm
npm publish
```

## 🙏 Credits

This project is based on the original work by **[Michele0303](https://github.com/Michele0303)**:
- **Original Repository**: [tiktok-live-recorder](https://github.com/Michele0303/tiktok-live-recorder)

This TypeScript version includes:
- Complete rewrite as a library and CLI tool
- Environment variable support
- Enhanced error handling and logging
- Modern async/await patterns
- Professional code architecture
- Better resource management

Special thanks to Michele0303 for the original implementation! 🙏

## 📄 License

This project is licensed under the MIT License.

## ⚠️ Disclaimer

This tool is for educational purposes only. Please respect TikTok's Terms of Service and content creators' rights. Use responsibly and ensure you have permission to record content.