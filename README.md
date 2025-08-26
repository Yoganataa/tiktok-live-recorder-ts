# TstokRecorder - TikTok Live Recorder

A modern TypeScript library and CLI tool for recording live TikTok sessions.

> **📍 Based on:** This project is a TypeScript rewrite and enhancement of the original [tiktok-live-recorder](https://github.com/Michele0303/tiktok-live-recorder) by [Michele0303](https://github.com/Michele0303).

## 🚀 Installation

```bash
git clone https://github.com/Yoganataa/tiktok-live-recorder-ts.git
cd tiktok-live-recorder-ts
```

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

## 📋 CLI Usage

### Basic Commands

```bash
# Record a specific user
tstok -user username

# Record from URL
tstok -url "https://www.tiktok.com/@username/live"

# Record with room ID
tstok -room_id 1234567890

# Multiple users
tstok -user "user1,user2,user3"
```

### Recording Modes

```bash
# Manual mode (default) - record if user is live now
tstok -user username -mode manual

# Automatic mode - continuously check if user goes live
tstok -user username -mode automatic -automatic_interval 5

# Followers mode - record followers' live streams
tstok -mode followers -cookies ./cookies.json
```

### Configuration

```bash
# Custom output directory
tstok -user username -output "./recordings/"

# Limit recording duration (in seconds)
tstok -user username -duration 3600

# Use proxy
tstok -user username -proxy "http://127.0.0.1:8080"

# Enable Telegram notifications
tstok -user username -telegram ./telegram.json
```

## ⚙️ Configuration Files

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

## 🛠️ Development

### Setup

```bash
git clone https://github.com/Yoganataa/tiktok-live-recorder-ts.git
cd tstok
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
npm run dev -- -user username
```

## 🙏 Acknowledgments

- Based on [tiktok-live-recorder](https://github.com/Michele0303/tiktok-live-recorder) by [Michele0303](https://github.com/Michele0303)
- Thanks to all contributors who have helped improve this project

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
