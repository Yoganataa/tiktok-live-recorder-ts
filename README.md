# TikTok Live Recorder

Resilient TikTok Live Recorder library for Node.js written in TypeScript.

[![Release](https://github.com/Yoganataa/tiktok-live-recorder-ts/actions/workflows/release.yml/badge.svg)](https://github.com/Yoganataa/tiktok-live-recorder-ts/actions/workflows/release.yml)
[![Test](https://github.com/Yoganataa/tiktok-live-recorder-ts/actions/workflows/test.yml/badge.svg)](https://github.com/Yoganataa/tiktok-live-recorder-ts/actions/workflows/test.yml)
[![CodeQL](https://github.com/Yoganataa/tiktok-live-recorder-ts/actions/workflows/codeql.yml/badge.svg)](https://github.com/Yoganataa/tiktok-live-recorder-ts/actions/workflows/codeql.yml)

This project is a **robust architectural refactor** of
https://github.com/Michele0303/tiktok-live-recorder, designed for high availability and network resilience.

> ⚠️ This repository is intended for **GitHub usage only**.  
> It is **not published to npm/pnpm** and is meant to be consumed via source import or private builds.

---

## ✨ Key Features

### 🛡️ Resilience & Stability (New)

- **Adaptive Quality Streaming:** Automatically downgrades video quality (e.g., 1080p → 720p) during network congestion/stalls and attempts to upgrade back when the connection stabilizes.
- **Segmented Recording:** Writes stream to disk in chunks (`part_0`, `part_1`) to prevent data corruption. If the process crashes, previous segments remain safe.
- **Smart Merge Pipeline:**
  - **Fast Mode:** Uses `ffmpeg -c copy` for compatible segments (instant merge).
  - **Safe Mode:** Automatically falls back to re-encoding if resolution changes are detected (e.g., due to adaptive quality switching).
- **Disk Space Guard:** Prevents recording if disk space is critically low.

### 🛡️ Features

- **Advanced Room Resolution:** Uses 3 strategies (TikRec, EulerStream, Webcast) to bypass basic API protections.
- **Modes:** Manual, Automatic Polling, and Followers Monitoring.
- **Telegram Integration:** Non-blocking upload to Telegram chat upon completion.
- **Zero-Dependency Core:** Only requires `ffmpeg` and `ffprobe` installed on the system.

---

## 🧱 Project Architecture

```txt
src/
├── client/            # Smart HTTP Layer with Adaptive Retry & Rate Limit Handling
├── recorder/          # Stream logic, Stall detection, Quality Switching
├── upload/            # Telegram MTProto Uploader
├── utils/             # FFmpeg orchestration & Compatibility checks
├── config/            # Strict Environment Validation (Zod)
└── index.ts           # Public entry point

```

## 📦 Installation

### Using a tagged release (recommended)

```bash
pnpm add github:Yoganataa/tstok#v2.1.1

```

or with npm:

```bash
npm install github:Yoganataa/tstok#v2.1.1

```

## 📦 Requirements

- **Node.js ≥ 18**
- **FFmpeg** AND **FFprobe** available in system `PATH`
- Valid TikTok session cookies (essential for high-quality streams)

## 🔐 Configuration

Create a `.env` file in your project root:

```env
# --- TikTok Authentication (Required) ---
TIKTOK_SESSIONID_SS=your_session_id_here
TIKTOK_IDC=useast2a
TIKTOK_PROXY=http://user:pass@host:port

# --- Recorder Settings ---
# Format: 'mp4' (Compatible) or 'mkv' (Robust)
RECORDER_FORMAT=mkv
# Keep raw .flv segments after merging?
KEEP_FLV=false

# --- Advanced Stability (New) ---
# Split file into parts to prevent corruption? (Recommended: true)
USE_SEGMENTATION=true
# Milliseconds of silence before declaring a stream stalled (Default: 15000)
RECORDER_STALL_TIMEOUT=15000
# How many clean segments needed before trying to upgrade quality back?
RECORDER_QUALITY_UPGRADE_COUNT=5

# --- Telegram (Optional) ---
TELEGRAM_API_ID=123456
TELEGRAM_API_HASH=your_api_hash
TELEGRAM_CHAT_ID=me
TELEGRAM_SESSION=your_string_session

```

## 🚀 Usage Example

```ts
import { TikTokRecorder, Mode } from '@yoganataa/tstok';

const recorder = new TikTokRecorder({
  user: 'username',
  mode: Mode.AUTOMATIC,
  outputDir: './recordings',
  uploadToTelegram: true,
  intervalMinutes: 5, // Check interval for automatic mode
  maxParallelRecordings: 3, // Limit concurrent recordings
  events: {
    onStart: ({ user, roomId }) => {
      console.log(`🔴 Recording started: ${user} (${roomId})`);
    },
    onStop: () => {
      console.log(`🏁 Recorder service stopped`);
    },
    onError: (err) => {
      console.error('❌ Recorder error:', err);
    },
  },
});

// Start the recorder
await recorder.start();

// Graceful shutdown example
process.on('SIGINT', () => {
  recorder.stop();
  process.exit(0);
});
```

## 🧠 Recording Modes

| Mode        | Description                                                                   | Use Case             |
| ----------- | ----------------------------------------------------------------------------- | -------------------- |
| `MANUAL`    | Checks once. Records if live, errors if not.                                  | CLI tools, cron jobs |
| `AUTOMATIC` | Loops forever. Sleeps for `intervalMinutes` between checks.                   | Dedicated servers    |
| `FOLLOWERS` | Monitors ALL following list. Records new lives up to `maxParallelRecordings`. | Archival bots        |

## ⚠️ Disclaimer

This project:

- Uses **undocumented / internal TikTok endpoints**.
- May break at any time due to platform changes.
- Is intended **for educational and research purposes only**.
- Must comply with TikTok Terms of Service.

The author is **not responsible** for any misuse or bans resulting from the use of this tool.

## 🧾 License

MIT License

Derived from [tiktok-live-recorder](https://github.com/Michele0303/tiktok-live-recorder).
Architectural refactor and TypeScript port by Yoganataa.
