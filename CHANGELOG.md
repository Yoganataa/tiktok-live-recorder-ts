# Changelog

All notable changes to this project will be documented in this file.

This project follows **Semantic Versioning (SemVer)** and the guidelines from **Keep a Changelog**: https://keepachangelog.com/en/1.1.0/

---

## [2.1.1] - 2026-01-03

### 🚀 Major Enhancements (Resilience)

- **Adaptive Quality Streaming**: Implemented a bi-directional quality switching mechanism.
  - **Downgrade**: Automatically switches to a lower resolution (e.g., 1080p -> 720p) when a network stall is detected.
  - **Upgrade**: Automatically attempts to restore highest quality after a configurable number of stable segments (`RECORDER_QUALITY_UPGRADE_COUNT`).
- **Segmented Recording System**:
  - Replaced single-file appending with a segmented approach (`part_0.flv`, `part_1.flv`) to prevent total data corruption if the process crashes.
  - Added `max_segments_reached` safety stop to prevent file system overflow.
- **Smart Merge Pipeline**:
  - **Compatibility Check**: Automatically detects if segments have different resolutions or codecs (due to adaptive switching).
  - **Dual Strategy**: Uses fast stream copying (`-c copy`) for compatible segments, and falls back to safe re-encoding (`libx264`) for mixed-resolution segments.

### ✨ Added

- **Disk Space Guard**: Pre-flight and pre-merge checks to ensure sufficient disk space (`MIN_DISK_SPACE_BYTES`), preventing 0-byte corrupt outputs.
- **FFprobe Integration**: Added `ensureFFprobeAvailable()` to strictly validate environment dependencies before starting.
- **New Environment Variables**:
  - `RECORDER_STALL_TIMEOUT`: Configurable timeout for network stalls.
  - `RECORDER_QUALITY_UPGRADE_COUNT`: Threshold for quality recovery.
  - `USE_SEGMENTATION`: Toggle for the new segmentation logic.
- **HTTP Referer Header**: Added `referer: https://www.tiktok.com/` to requests for better legitimacy.

### 🛡️ Changed

- **Intelligent Networking (HttpClient)**:
  - Refactored retry logic to be status-code aware.
  - **Rate Limiting**: Implemented aggressive linear backoff for `429 Too Many Requests`.
  - **Fast Fail**: Fatal errors (4xx, except 429) now throw immediately instead of wasting retries.
- **Stream Recorder Logic**: Now strictly separates "Stall" errors from generic network errors to drive the adaptive quality logic.
- **Merge Process**: Moved from simple concatenation to a demuxer-based approach via `ffmpeg` file lists.

### 🐛 Fixed

- Fixed potential data loss where a crash during a long recording would result in a corrupt/unreadable FLV file (solved via Segmentation).
- Fixed "blind retries" on 404/403 errors which could flag the IP as suspicious.

---

## [2.0.0] - 2026-01-03

### 🎉 Initial Public Release

This is the first public release of **@yoganataa/tstok**, a TypeScript-first TikTok Live Recorder library designed for **GitHub-based consumption** (not published to npm).

### ✨ Added

- TypeScript-first architecture with full type declarations (`.d.ts`)
- Multi-strategy TikTok Live room ID resolution:
  - TikRec resolver
  - EulerStream resolver
  - TikTok Webcast resolver
- Automatic fallback resolution chain with WAF detection
- Live status polling and verification
- FLV live stream recording with graceful abort support
- Lossless FLV → MP4 conversion using FFmpeg
- Three recording modes:
  - `MANUAL`
  - `AUTOMATIC`
  - `FOLLOWERS`
- Followers-based live monitoring with concurrency limits
- Optional, non-blocking Telegram upload integration
- Event hooks (`onStart`, `onStop`, `onError`) for embedding in other systems
- Fully ESM-compatible output with CommonJS fallback
- Centralized structured logging via `pino`
- Environment-based configuration via `.env`

### 🧱 Architecture

- Clean separation between:
  - HTTP & API layer
  - Room resolution logic
  - Recording lifecycle
  - Upload integrations
- Explicit public API surface via `src/index.ts`
- Internal modules are not exposed unintentionally

### ⚠️ Known Limitations

- Relies on undocumented / internal TikTok endpoints
- Subject to breakage due to TikTok platform changes
- Requires valid TikTok session cookies
- No CLI interface by design

### 📄 Legal & Attribution

- MIT License
- Derived from: https://github.com/Michele0303/tiktok-live-recorder
- Significant architectural and language refactor applied
