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
- 📺 **Multi-Format Support**: Convert recordings to MP4, MKV, AVI, MOV, or WebM formats.
- 🎬 **Flexible Encoding**: Stream copy (fast) or re-encode with custom codecs.
- 📦 **Keep Raw Files**: Option to preserve original FLV files for archiving.
- 🤖 **Telegram Integration**: 
  - Automatically uploads recordings to Telegram.
  - **Premium Support**: Detects Telegram Premium accounts to allow uploads up to **4GB** (vs 2GB for free users).
  - **No Compression**: Sends videos as documents to preserve original quality.
  - **Dual Upload**: Uploads both converted and raw FLV files (if enabled).
- ⚙️ **Simple Configuration**: All settings in one `.env` file - no separate JSON configs needed.
- 🔧 **Flexible Override**: CLI arguments can override `.env` settings when needed.
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
```

### Install from Source

```bash
git clone https://github.com/Yoganataa/tiktok-live-recorder-ts.git
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
tstok --url "https://www.tiktok.com/@username/live"

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
# Requires valid TIKTOK_SESSION_ID in .env file
tstok -m followers
```

### Advanced Options

```bash
# Custom output directory (overrides .env)
tstok -u username -o "./recordings/"

# Limit recording duration (e.g., 1 hour)
tstok -u username -d 3600

# Use HTTP Proxy (overrides .env)
tstok -u username -p "http://127.0.0.1:8080"

# Skip automatic update check
tstok -u username --no-update-check
```

**Note:** CLI arguments override `.env` settings for `--proxy` and `--output` options.

### CLI Options Reference

| Option | Alias | Description |
|--------|-------|-------------|
| `--user <user>` | `-u` | TikTok username(s), comma-separated for multiple |
| `--url <url>` |  | TikTok live URL |
| `--room-id <roomId>` | `-r` | TikTok room ID |
| `--mode <mode>` | `-m` | Recording mode: manual, automatic, followers (default: "manual") |
| `--automatic-interval <interval>` | `-a` | Check interval in minutes for automatic mode (default: "5") |
| `--cookies <path>` | `-c` | Path to cookies.json file |
| `--telegram <path>` | `-t` | Path to telegram.json file |
| `--proxy <proxy>` | `-p` | HTTP proxy to bypass restrictions |
| `--output <output>` | `-o` | Output directory for recordings |
| `--duration <duration>` | `-d` | Recording duration in seconds |
| `--no-update-check` |  | Skip automatic update check |

## ⚙️ Configuration

All configuration is now done through a single `.env` file for simplicity.

### Quick Setup

1. **Copy the example file:**
   ```bash
   cp .env.example .env
   ```

2. **Edit `.env` with your settings:**
   ```bash
   nano .env  # or use any text editor
   ```

3. **Configure required settings:**

```bash
# Minimum required for basic recording
TIKTOK_SESSION_ID=your_session_id_from_browser

# Optional but recommended
VIDEO_OUTPUT_FORMAT=mp4
TIKTOK_OUTPUT_DIR=./recordings/
```

### Configuration Sections

#### 🔐 TikTok Authentication

```bash
# Get from browser cookies when logged into TikTok
TIKTOK_SESSION_ID=your_session_id_here

# Data center selection (usually leave as default)
TIKTOK_TARGET_IDC=useast2a
```

**How to get your session ID:**
1. Open TikTok in your browser and log in
2. Open Developer Tools (F12)
3. Go to Application/Storage → Cookies
4. Find `sessionid_ss` cookie and copy its value

#### 📹 Recording Configuration

```bash
# Where to save recordings
TIKTOK_OUTPUT_DIR=./recordings/

# Use proxy to bypass geo-restrictions (optional)
TIKTOK_PROXY=http://127.0.0.1:8080
```

#### 🎬 Video Output Settings

```bash
# Output format: mp4, mkv, avi, mov, webm
VIDEO_OUTPUT_FORMAT=mp4

# Re-encoding (false = faster, true = more compatible)
VIDEO_REENCODE=false

# Keep original FLV file after conversion
KEEP_RAW_FILE=false

# Custom codecs (only if VIDEO_REENCODE=true)
VIDEO_CODEC=libx264
AUDIO_CODEC=aac
```

#### 📱 Telegram Integration (Optional)

```bash
# Get from https://my.telegram.org/apps
TELEGRAM_API_ID=12345678
TELEGRAM_API_HASH=abcdef1234567890

# Get from @BotFather
TELEGRAM_BOT_TOKEN=123456:ABC-DEF1234ghIkl-zyx57W2v1u123ew11

# Your chat/channel ID (use @userinfobot)
TELEGRAM_CHAT_ID=1234567890
```

### Configuration Examples

#### Example 1: Basic Recording (Fast Setup)
```bash
TIKTOK_SESSION_ID=your_session_id
VIDEO_OUTPUT_FORMAT=mp4
KEEP_RAW_FILE=false
```

#### Example 2: Archiving Setup
```bash
TIKTOK_SESSION_ID=your_session_id
VIDEO_OUTPUT_FORMAT=mkv
KEEP_RAW_FILE=true
TIKTOK_OUTPUT_DIR=./archive/
```

#### Example 3: With Telegram Upload
```bash
TIKTOK_SESSION_ID=your_session_id
VIDEO_OUTPUT_FORMAT=mp4
TELEGRAM_BOT_TOKEN=your_bot_token
TELEGRAM_CHAT_ID=your_chat_id
```

#### Example 4: Professional Setup
```bash
TIKTOK_SESSION_ID=your_session_id
VIDEO_OUTPUT_FORMAT=mp4
VIDEO_REENCODE=true
VIDEO_CODEC=libx264
AUDIO_CODEC=aac
KEEP_RAW_FILE=true
TELEGRAM_BOT_TOKEN=your_bot_token
TELEGRAM_CHAT_ID=your_chat_id
TIKTOK_OUTPUT_DIR=./professional/
```

### 4. Video Format Configuration

#### Supported Formats

| Format | Extension | Container | Default Behavior |
|--------|-----------|-----------|------------------|
| **MP4** | `.mp4` | MPEG-4 | Stream copy (fast, no re-encoding) |
| **MKV** | `.mkv` | Matroska | Stream copy (supports all codecs) |
| **AVI** | `.avi` | AVI | Stream copy |
| **MOV** | `.mov` | QuickTime | Stream copy |
| **WebM** | `.webm` | WebM | Re-encodes to VP9/Opus |

#### Configuration Examples

**Fast conversion (Stream Copy - Recommended):**
```bash
VIDEO_OUTPUT_FORMAT=mkv
VIDEO_REENCODE=false
KEEP_RAW_FILE=false
```

**Keep original FLV for archiving:**
```bash
VIDEO_OUTPUT_FORMAT=mp4
VIDEO_REENCODE=false
KEEP_RAW_FILE=true  # Preserves original .flv file
```

**High compatibility (Re-encode):**
```bash
VIDEO_OUTPUT_FORMAT=mp4
VIDEO_REENCODE=true
VIDEO_CODEC=libx264
AUDIO_CODEC=aac
KEEP_RAW_FILE=false
```

**Web-optimized (WebM):**
```bash
VIDEO_OUTPUT_FORMAT=webm
VIDEO_REENCODE=true  # WebM always re-encodes
KEEP_RAW_FILE=true   # Optional: keep original for comparison
```

#### Why Keep Raw Files?

Enable `KEEP_RAW_FILE=true` when you need to:

- 🗄️ **Archive original recordings** - Keep unmodified source material
- 🔍 **Quality comparison** - Compare original vs converted quality
- 🔄 **Re-convert later** - Try different formats/codecs without re-recording
- 💾 **Backup strategy** - Maintain multiple versions for safety
- 🎬 **Professional workflows** - Keep raw footage for editing

**Note:** Enabling this will double your storage usage (both .flv and converted file are kept).

#### Why Different Formats?

- **MP4**: Universal compatibility, best for sharing
- **MKV**: Supports all codecs, best for archiving
- **WebM**: Optimized for web streaming, smaller file sizes
- **AVI/MOV**: Legacy format support

## 📚 Library Usage

You can import `TstokRecorder` in your own TypeScript/Node.js projects.

### Example: Concurrent Recording

```typescript
import { TstokRecorder, Mode, VideoFormat } from 'tiktok-live-recorder-ts';

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

### Clone and Install:

```bash
git clone https://github.com/Yoganataa/tiktok-live-recorder-ts.git
cd tiktok-live-recorder-ts
npm install
```

### Build the Project:

Compiles TypeScript to JavaScript in the `dist` folder.

```bash
npm run build
```

### Run in Development Mode:

Runs the CLI directly from source using `ts-node`.

```bash
# Example: Record a user
npm run dev -- -u username
```

### Lint & Clean:

```bash
# Clean dist folder
npm run clean
```

## 🔧 Troubleshooting

**WAF_BLOCKED / "Access Denied":**  
This means your IP is temporarily flagged by TikTok.  
**Solution:** Change your IP (VPN/Proxy) or wait a few hours. The new Anti-WAF system (TikRec) minimizes this, but it can still happen on heavy usage.

**"User not currently live":**  
The user is offline, or the Room ID could not be fetched.

**"Followers mode requires TIKTOK_SESSION_ID":**  
Add your TikTok session ID to `.env` file.  
**Solution:** Get sessionid_ss cookie from your browser and add to `.env`

**"TIKTOK_SESSION_ID not found in .env file":**  
Session ID is required for Followers mode and some restricted content.  
**Solution:** Add `TIKTOK_SESSION_ID=your_session_id` to your `.env` file

**FFmpeg conversion errors:**  
Ensure FFmpeg is properly installed and accessible in your system PATH.  
Test with: `ffmpeg -version`

**Unsupported video format:**  
Check that your FFmpeg installation includes the required codecs.  
For WebM: Ensure `libvpx-vp9` and `libopus` are available.

**Telegram upload not working:**  
Verify all Telegram credentials are set in `.env`:
```bash
TELEGRAM_API_ID=your_id
TELEGRAM_API_HASH=your_hash
TELEGRAM_BOT_TOKEN=your_token
TELEGRAM_CHAT_ID=your_chat_id
```

## 🔄 Updates

The tool automatically checks for updates on each run. To update manually:

```bash
npm install -g github:Yoganataa/tiktok-live-recorder-ts
```

To skip update checking, use the `--no-update-check` flag.

## 🙏 Acknowledgments

- Based on the original work [tiktok-live-recorder](https://github.com/Michele0303/tiktok-live-recorder) by Michele0303.
- Thanks to all contributors who have helped improve this project.

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.