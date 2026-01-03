
# Changelog

All notable changes to this project will be documented in this file.

This project follows **Semantic Versioning (SemVer)**  
and the guidelines from **Keep a Changelog**: https://keepachangelog.com/en/1.1.0/

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
