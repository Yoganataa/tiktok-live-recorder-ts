# TstokRecorder - TikTok Live Recorder (TS)

A modern TypeScript library and CLI tool for recording live TikTok sessions.

[![Release](https://github.com/Yoganataa/tiktok-live-recorder-ts/actions/workflows/release.yml/badge.svg)](https://github.com/Yoganataa/tiktok-live-recorder-ts/actions/workflows/release.yml)
[![Test](https://github.com/Yoganataa/tiktok-live-recorder-ts/actions/workflows/test.yml/badge.svg)](https://github.com/Yoganataa/tiktok-live-recorder-ts/actions/workflows/test.yml)
[![CodeQL](https://github.com/Yoganataa/tiktok-live-recorder-ts/actions/workflows/codeql.yml/badge.svg)](https://github.com/Yoganataa/tiktok-live-recorder-ts/actions/workflows/codeql.yml)

> **📍 Version Info:** This project is currently at version **v1.0.3**.  
> It fully implements the core recording logic from **TikTok Live Recorder (Python) v7.5**, including Anti-WAF measures and concurrent recording.

## 🚀 Features

- 🛡️ **Anti-WAF System**: Uses signed requests (via TikRec API) to bypass TikTok's Room ID blocking/captcha.
- 🎯 **Multiple Recording Modes**: Manual, Automatic, and Followers modes.
- 👥 **Multi-User Concurrency**: Record multiple users simultaneously using a single command or instance.
- 🔄 **Smart Fallback**: Automatically switches to legacy stream URLs if SDK data is missing (higher success rate).
- 📺 **High Quality**: Records in the best available quality (FLV/MP4).
- 🤖 **Telegram Integration**: 
  - Automatically uploads recordings to Telegram.
  - **Premium Support**: Detects Telegram Premium accounts to allow uploads up to **4GB** (vs 2GB for free users).
  - **No Compression**: Sends videos as documents to preserve original quality.
- 🔧 **Flexible Config**: Support for cookies, proxies, and environment variables.
- 🌐 **Cross-Platform**: Works on Windows, macOS, Linux, and Termux.

## 📦 Installation

This package is designed to be installed directly from GitHub.

### Prerequisites

- **Node.js** 16 or higher
- **FFmpeg** installed on your system (required for video conversion)

### Install via NPM

```bash
# Install globally to use as CLI tool 'tstok'
npm install -g github:Yoganataa/tiktok-live-recorder-ts

# Or install locally in your project
npm install github:Yoganataa/tiktok-live-recorder-ts
````

### Install from Source

```bash
git clone [https://github.com/Yoganataa/tiktok-live-recorder-ts.git](https://github.com/Yoganataa/tiktok-live-recorder-ts.git)
cd tiktok-live-recorder-ts
npm install
npm run build
npm link # Optional: makes 'tstok' command available globally
```

## 🖥️ CLI Usage

After installation, you can use the `tstok` command.

### Basic Commands

```bash
# Record a specific user
tstok -u username

# Record multiple users concurrently (NEW in v1.0.3)
tstok -u "user1,user2,user3"

# Record from a specific Live URL
tstok --url "[https://www.tiktok.com/@username/live](https://www.tiktok.com/@username/live)"

# Record using Room ID
tstok -r 1234567890
```

### Recording Modes

```bash
# Manual mode (default) - Check once and record if live
tstok -u username -m manual

# Automatic mode - Continuously monitor and record when user goes live
tstok -u username -m automatic -a 5

# Followers mode - Monitor and record all following users
# Requires cookies.json with valid session
tstok -m followers -c ./cookies.json
```

### Advanced Options

```bash
# Custom output directory
tstok -u username -o "./recordings/"

# Limit recording duration (e.g., 1 hour)
tstok -u username -d 3600

# Use HTTP Proxy (bypasses geo-restrictions)
tstok -u username -p "[http://127.0.0.1:8080](http://127.0.0.1:8080)"

# Enable Telegram Upload
tstok -u username -t ./telegram.json

# Skip automatic update check
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
| `--no-update-check` | | Skip automatic update check |

## ⚙️ Configuration

To use advanced features like Followers mode or Telegram upload, you need to configure credential files.

### 1\. Cookies (`cookies.json`)

Required for **Followers Mode** or to record age-restricted lives.

```json
{
  "sessionid_ss": "your_session_id_from_browser_cookies",
  "tt-target-idc": "useast2a"
}
```

### 2\. Telegram (`telegram.json`)

Required for automatic uploading.

```json
{
  "api_id": "your_telegram_api_id",
  "api_hash": "your_telegram_api_hash",
  "bot_token": "your_bot_token",
  "chat_id": 1234567890
}
```

### 3\. Environment Variables

You can also use a `.env` file instead of JSON configs:

```env
TIKTOK_SESSION_ID=your_session_id
TIKTOK_OUTPUT_DIR=./recordings/
TELEGRAM_BOT_TOKEN=your_bot_token
TELEGRAM_CHAT_ID=1234567890
```

## 📚 Library Usage

You can import `TstokRecorder` in your own TypeScript/Node.js projects.

### Example: Concurrent Recording

```typescript
import { TstokRecorder, Mode } from 'tiktok-live-recorder-ts';

// Configure recorder
const recorder = new TstokRecorder({
  // Array support added in v1.0.3 for multi-user recording
  user: ['user1', 'user2', 'user3'], 
  mode: Mode.AUTOMATIC,
  automaticInterval: 5,
  output: './my_recordings/',
  cookies: {
    sessionid_ss: 'your_session_id',
    'tt-target-idc': 'useast2a'
  }
});

// Start all recordings concurrently
await recorder.start();

// To stop gracefully at any point:
// await recorder.stop();
```

### Library API Methods

| Method | Description |
|--------|-------------|
| `constructor(config)` | Create a new recorder instance (supports single or array of users) |
| `start()` | Start recording process (runs concurrently for multiple users) |
| `stop()` | Request graceful shutdown for all active recordings |
| `getConfig()` | Get current configuration object |
| `updateConfig(newConfig)` | Update configuration on the fly |
| `static fromEnv()` | Create recorder using environment variables only |
| `static recordUser(username, options)` | Helper for quick single-user recording |
| `static recordFromUrl(url, options)` | Helper for quick URL recording |

## 🛠️ Development

If you want to contribute or modify the source code:

1.  **Clone and Install:**

    ```bash
    git clone [https://github.com/Yoganataa/tiktok-live-recorder-ts.git](https://github.com/Yoganataa/tiktok-live-recorder-ts.git)
    cd tiktok-live-recorder-ts
    npm install
    ```

2.  **Build the Project:**
    Compiles TypeScript to JavaScript in the `dist` folder.

    ```bash
    npm run build
    ```

3.  **Run in Development Mode:**
    Runs the CLI directly from source using `ts-node`.

    ```bash
    # Example: Record a user
    npm run dev -- -u username
    ```

4.  **Lint & Clean:**

    ```bash
    # Clean dist folder
    npm run clean
    ```

## 🔧 Troubleshooting

  * **`WAF_BLOCKED` / "Access Denied"**:
      * This means your IP is temporarily flagged by TikTok.
      * **Solution**: Change your IP (VPN/Proxy) or wait a few hours. The new Anti-WAF system (TikRec) minimizes this, but it can still happen on heavy usage.
  * **"User not currently live"**:
      * The user is offline, or the Room ID could not be fetched.
  * **"Missing script: install"**:
      * Do not run `npm run install`. Just run `npm install`.

## 🔄 Updates

The tool automatically checks for updates on each run. To update manually:

```bash
npm install -g github:Yoganataa/tiktok-live-recorder-ts
```

To skip update checking, use the `--no-update-check` flag.

## 🙏 Acknowledgments

  - Based on the original work [tiktok-live-recorder](https://github.com/Michele0303/tiktok-live-recorder) by [Michele0303](https://github.com/Michele0303).
  - Thanks to all contributors who have helped improve this project.

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](https://www.google.com/search?q=LICENSE) file for details.