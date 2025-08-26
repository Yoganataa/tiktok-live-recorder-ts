# TstokRecorder - TikTok Live Recorder

A modern TypeScript library and CLI tool for recording live TikTok sessions.

[![Release](https://github.com/Yoganataa/tiktok-live-recorder-ts/actions/workflows/release.yml/badge.svg)](https://github.com/Yoganataa/tiktok-live-recorder-ts/actions/workflows/release.yml)
[![Test](https://github.com/Yoganataa/tiktok-live-recorder-ts/actions/workflows/test.yml/badge.svg)](https://github.com/Yoganataa/tiktok-live-recorder-ts/actions/workflows/test.yml)
[![CodeQL](https://github.com/Yoganataa/tiktok-live-recorder-ts/actions/workflows/codeql.yml/badge.svg)](https://github.com/Yoganataa/tiktok-live-recorder-ts/actions/workflows/codeql.yml)

> **📍 Based on:** This project is a TypeScript rewrite and enhancement of the original [tiktok-live-recorder](https://github.com/Michele0303/tiktok-live-recorder) by [Michele0303](https://github.com/Michele0303).

## 🚀 Features

- 🎯 **Multiple Recording Modes**: Manual, Automatic, and Followers modes
- 📺 **High Quality Recording**: Records in the best available quality
- 🤖 **Telegram Integration**: Automatically upload recordings to Telegram
- 🔧 **Flexible Configuration**: Support for cookies, proxies, and environment variables
- 🌐 **Cross-Platform**: Works on Windows, macOS, and Linux
- 📦 **Dual Usage**: Available as both CLI tool and library
- 🔄 **Auto-Update Checking**: Notifies when new versions are available

## 📦 Installation

This package is designed to be installed directly from GitHub only.

### Prerequisites

- Node.js 16 or higher
- FFmpeg installed on your system

### Installation from GitHub

#### Using HTTPS (Recommended)

```bash
# Install the latest version from the main branch
npm install github:Yoganataa/tiktok-live-recorder-ts

# Install a specific branch
npm install github:Yoganataa/tiktok-live-recorder-ts#branch-name

# Install a specific tag/release
npm install github:Yoganataa/tiktok-live-recorder-ts#v1.0.0
```

#### Using SSH (if you have SSH keys set up with GitHub)

```bash
npm install git+ssh://git@github.com:Yoganataa/tiktok-live-recorder-ts.git
```

#### From Source (Manual Clone)

```bash
git clone https://github.com/Yoganataa/tiktok-live-recorder-ts.git
cd tiktok-live-recorder-ts
npm install
```

### Development Installation

For development purposes:

```bash
git clone https://github.com/Yoganataa/tiktok-live-recorder-ts.git
cd tiktok-live-recorder-ts
npm install
npm link
```

Note: This package is not published to npm registry. Please install directly from GitHub.

## 🖥️ CLI Usage

### Basic Commands

```bash
# Record a specific user
tstok -u username

# Record from URL
tstok --url "https://www.tiktok.com/@username/live"

# Record with room ID
tstok -r 1234567890

# Multiple users (comma-separated)
tstok -u "user1,user2,user3"
```

### Recording Modes

```bash
# Manual mode (default) - record if user is live now
tstok -u username -m manual

# Automatic mode - continuously check if user goes live
tstok -u username -m automatic -a 5

# Followers mode - record live streams of your followers
tstok -m followers -c ./cookies.json
```

### Advanced Options

```bash
# Custom output directory
tstok -u username -o "./recordings/"

# Limit recording duration (in seconds)
tstok -u username -d 3600

# Use proxy
tstok -u username -p "http://127.0.0.1:8080"

# Enable Telegram upload
tstok -u username -t ./telegram.json

# Skip update check
tstok -u username --no-update-check
```

### CLI Options Reference

| Option | Alias | Description |
|--------|-------|-------------|
| `--user <user>` | `-u` | TikTok username(s), comma-separated for multiple |
| `--url <url>` | | TikTok live URL |
| `--room-id <roomId>` | `-r` | TikTok room ID |
| `--mode <mode>` | `-m` | Recording mode: manual, automatic, followers (default: "manual") |
| `--automatic-interval <interval>` | `-a` | Check interval in minutes for automatic mode (default: "5") |
| `--cookies <path>` | `-c` | Path to cookies.json file |
| `--telegram <path>` | `-t` | Path to telegram.json file |
| `--proxy <proxy>` | `-p` | HTTP proxy to bypass restrictions |
| `--output <output>` | `-o` | Output directory for recordings |
| `--duration <duration>` | `-d` | Recording duration in seconds |
| `--no-update-check` | | Skip update check |

## ⚙️ Configuration

### Setting up Configuration Files

1. Copy the example files:

   ```bash
   cp cookies.json.example cookies.json
   cp telegram.json.example telegram.json
   ```

2. Edit the files with your actual credentials

### Cookies File (cookies.json)

```json
{
  "sessionid_ss": "your_tiktok_session_id",
  "tt-target-idc": "useast2a"
}
```

### Telegram Config (telegram.json)

```json
{
  "api_id": "your_telegram_api_id",
  "api_hash": "your_telegram_api_hash",
  "bot_token": "your_bot_token",
  "chat_id": 1234567890
}
```

### Environment Variables (.env)

```env
TIKTOK_SESSION_ID=your_session_id
TIKTOK_OUTPUT_DIR=./recordings/
TELEGRAM_BOT_TOKEN=your_bot_token
TELEGRAM_CHAT_ID=1234567890
```

## 📚 Library Usage

### Basic Usage

```typescript
import { TstokRecorder } from 'tstok';

// Quick record a user
await TstokRecorder.recordUser('username');

// Record from URL
await TstokRecorder.recordFromUrl('https://www.tiktok.com/@username/live');

// Automatic mode
await TstokRecorder.recordAutomatic('username', {
  automaticInterval: 5
});
```

### Advanced Usage

```typescript
import { TstokRecorder, Mode } from 'tstok';

const recorder = new TstokRecorder({
  user: 'username',
  mode: Mode.MANUAL,
  cookies: {
    sessionid_ss: 'your_session_id',
    'tt-target-idc': 'useast2a'
  },
  output: './recordings/',
  duration: 3600,
  telegramConfig: {
    api_id: 'your_api_id',
    api_hash: 'your_api_hash',
    bot_token: 'your_bot_token',
    chat_id: 1234567890
  }
});

await recorder.start();
```

### Library API Reference

#### TstokRecorder Class

| Method | Description |
|--------|-------------|
| `constructor(config)` | Create a new recorder instance |
| `start()` | Start recording based on configuration |
| `stop()` | Request graceful shutdown |
| `getConfig()` | Get current configuration |
| `updateConfig(newConfig)` | Update configuration |
| `static fromEnv()` | Create recorder with environment variables |
| `static recordUser(username, options)` | Quick user recording |
| `static recordFromUrl(url, options)` | Quick URL recording |
| `static recordAutomatic(username, options)` | Quick automatic mode |

#### Configuration Options

| Option | Type | Description |
|--------|------|-------------|
| `user` | string/string[] | TikTok username(s) |
| `url` | string | TikTok live URL |
| `roomId` | string | TikTok room ID |
| `mode` | Mode | Recording mode (MANUAL, AUTOMATIC, FOLLOWERS) |
| `automaticInterval` | number | Interval for automatic mode (minutes) |
| `cookies` | CookiesConfig | TikTok session cookies |
| `proxy` | string | HTTP proxy |
| `output` | string | Output directory |
| `duration` | number | Recording duration (seconds) |
| `telegramConfig` | TelegramConfig | Telegram upload configuration |

## 🛠️ Development

### Setup

```bash
git clone https://github.com/Yoganataa/tiktok-live-recorder-ts.git
cd tiktok-live-recorder-ts
npm install
```

### Building

```bash
# Clean previous builds
npm run clean

# Build the project
npm run build
```

### Running in Development

```bash
npm run dev -- -u username
```

### Available Scripts

| Script | Description |
|--------|-------------|
| `build` | Compile TypeScript to JavaScript |
| `start` | Run the compiled CLI |
| `dev` | Run in development mode |
| `clean` | Remove compiled files |
| `watch` | Watch and rebuild on changes |

## 🔧 Troubleshooting

### Common Issues

1. **"User not currently live"**: The user is not currently streaming
2. **"Invalid TikTok live URL"**: Check that the URL is correct
3. **"Room ID error"**: The user may have ended their stream
4. **"Account is private"**: Cannot record private accounts

### Getting Help

- Check the console output for error messages
- Verify your cookies are valid and not expired
- Ensure FFmpeg is properly installed and accessible
- Check that your network connection is stable

## 🔄 Updates

The tool automatically checks for updates on each run. When an update is available:

1. You'll see a notification message
2. Run `npm install -g tstok` to update
3. Run the tool again

To skip update checking, use the `--no-update-check` flag.

## 🙏 Acknowledgments

- Based on [tiktok-live-recorder](https://github.com/Michele0303/tiktok-live-recorder) by [Michele0303](https://github.com/Michele0303)
- Thanks to all contributors who have helped improve this project

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
