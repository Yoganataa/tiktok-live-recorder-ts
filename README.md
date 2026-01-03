# @yoganataa/tstok

TypeScript-first TikTok Live Recorder library for Node.js.

[![Release](https://github.com/Yoganataa/tiktok-live-recorder-ts/actions/workflows/release.yml/badge.svg)](https://github.com/Yoganataa/tiktok-live-recorder-ts/actions/workflows/release.yml)
[![Test](https://github.com/Yoganataa/tiktok-live-recorder-ts/actions/workflows/test.yml/badge.svg)](https://github.com/Yoganataa/tiktok-live-recorder-ts/actions/workflows/test.yml)
[![CodeQL](https://github.com/Yoganataa/tiktok-live-recorder-ts/actions/workflows/codeql.yml/badge.svg)](https://github.com/Yoganataa/tiktok-live-recorder-ts/actions/workflows/codeql.yml)

This project is a **clean TypeScript port and architectural refactor** of  
https://github.com/Michele0303/tiktok-live-recorder

> ⚠️ This repository is intended for **GitHub usage only**.  
> It is **not published to npm/pnpm** and is meant to be consumed via source import or private builds.

---

## ✨ Features

- Resolve TikTok Live room IDs using multiple strategies
  - TikRec
  - EulerStream
  - TikTok Webcast
- Automatic live status detection
- Record live streams directly from FLV endpoints
- Lossless FLV → MP4 conversion via FFmpeg
- Multiple operation modes:
  - Manual
  - Automatic polling
  - Followers-based monitoring
- Optional Telegram upload (non-blocking)
- Fully typed, ESM-first, Node.js ≥ 18
- No CLI — designed as an **embeddable library**

---

## 🧱 Project Architecture

```txt
src/
├── client/            # TikTok HTTP & API layer
├── recorder/          # Recording lifecycle & orchestration
├── upload/            # Optional Telegram uploader
├── utils/             # Logger, FFmpeg helpers
├── enums/             # Shared enums
├── errors/            # Typed domain errors
└── index.ts           # Public entry point
````

---

## 📦 Installation (GitHub Only)

### Using a tagged release (recommended)

```bash
pnpm add github:Yoganataa/tstok#v2.0.0
```

or with npm:

```bash
npm install github:Yoganataa/tstok#v2.0.0
```

or yarn:

```bash
yarn add github:Yoganataa/tstok#v2.0.0
```

### Using a branch (development)

```bash
pnpm add github:Yoganataa/tstok#main
```

> ⚠️ Installing from a branch may introduce breaking changes.
> Prefer tagged releases for production usage.

---

## 📦 Requirements

* **Node.js ≥ 18**
* **FFmpeg** available in `PATH`
* Valid TikTok session cookies
* (Optional) Telegram API credentials

---

## 🔐 Environment Variables

Create a `.env` file:

```env
# TikTok
TIKTOK_SESSIONID_SS=your_sessionid_ss
TIKTOK_IDC=useast2a
TIKTOK_PROXY=http://user:pass@host:port

# Telegram (optional)
TELEGRAM_API_ID=123456
TELEGRAM_API_HASH=your_api_hash
TELEGRAM_CHAT_ID=me
TELEGRAM_SESSION=your_string_session
```

> `TIKTOK_SESSIONID_SS` is **mandatory**.

---

## 🚀 Usage Example

```ts
import { TikTokRecorder, Mode } from '@yoganataa/tstok';

const recorder = new TikTokRecorder({
  user: 'username',
  mode: Mode.AUTOMATIC,
  outputDir: './recordings',
  uploadToTelegram: true,
  intervalMinutes: 5,
  events: {
    onStart: ({ user, roomId }) => {
      console.log(`Recording started: ${user} (${roomId})`);
    },
    onError: (err) => {
      console.error('Recorder error:', err);
    },
  },
});

await recorder.start();
```

To stop recording:

```ts
recorder.stop();
```

---

## 🧠 Recording Modes

| Mode        | Description                            |
| ----------- | -------------------------------------- |
| `MANUAL`    | Record immediately if user is live     |
| `AUTOMATIC` | Poll user live status periodically     |
| `FOLLOWERS` | Monitor followers and record live ones |

---

## ⚠️ Disclaimer

This project:

* Uses **undocumented / internal TikTok endpoints**
* May break at any time due to platform changes
* Is intended **for educational and research purposes**
* Must comply with TikTok Terms of Service and local laws

The author is **not responsible for misuse**.

---

## 🧾 License

MIT License

This project is derived from
[https://github.com/Michele0303/tiktok-live-recorder](https://github.com/Michele0303/tiktok-live-recorder)
and remains MIT-licensed, with significant architectural and language changes.

See [LICENSE](./LICENSE) for details.