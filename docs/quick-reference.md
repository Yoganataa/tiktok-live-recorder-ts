# TSTOK Quick Reference

## 🚀 Installation

```bash
npm install -g tstok                    # Global CLI
npm install tstok                       # Local library
npm install git+https://github.com/Yoganataa/tiktok-live-recorder-ts.git
```

## 📋 CLI Commands

### Basic Usage

```bash
tstok -user febri_fey                   # Record user (manual)
tstok -url "https://tiktok.com/@febri_fey/live"  # Record from URL
tstok -room_id "123456789"              # Record by room ID
```

### Modes

```bash
tstok -user febri_fey -mode manual      # Manual mode (default)
tstok -user febri_fey -mode automatic   # Automatic monitoring
tstok -user febri_fey -mode followers   # Record followers
```

### Configuration

```bash
tstok -user febri_fey -output "./recordings/"     # Custom output
tstok -user febri_fey -duration 3600              # 1 hour limit
tstok -user febri_fey -automatic_interval 5       # Check every 5 min
tstok -user febri_fey -cookies "./cookies.json"   # Custom cookies
tstok -user febri_fey -proxy "http://127.0.0.1:8080"  # Use proxy
tstok -user febri_fey -telegram "./telegram.json" # Telegram alerts
```

### Multiple Users

```bash
tstok -user "febri_fey,user2,user3"     # Multiple users
```

### Utility

```bash
tstok --help                            # Show help
tstok --version                         # Show version
tstok -user febri_fey --no-update-check # Skip update check
```

## 💻 Library Usage

### Import

```typescript
// TypeScript/ES6
import { TstokRecorder, Mode } from 'tstok';

// CommonJS
const { TstokRecorder, Mode } = require('tstok');
```

### Quick Methods

```typescript
// Record user immediately
await TstokRecorder.recordUser('febri_fey');

// Record from URL
await TstokRecorder.recordFromUrl('https://tiktok.com/@febri_fey/live');

// Automatic monitoring
await TstokRecorder.recordAutomatic('febri_fey', { automaticInterval: 5 });

// Environment-based
const recorder = TstokRecorder.fromEnv();
```

### Constructor

```typescript
const recorder = new TstokRecorder({
  user: 'febri_fey',
  mode: Mode.MANUAL,
  output: './recordings/',
  duration: 3600,
  cookies: { sessionid_ss: 'xxx', 'tt-target-idc': 'useast2a' },
  proxy: 'http://127.0.0.1:8080',
  telegramConfig: { /* telegram config */ }
});

await recorder.start();
```

### Methods

```typescript
recorder.start()                        // Start recording
recorder.getConfig()                     // Get configuration
recorder.updateConfig({ user: 'new' })  // Update config
```

## ⚙️ Configuration Files

### cookies.json

```json
{
  "sessionid_ss": "your_session_id",
  "tt-target-idc": "useast2a"
}
```

### telegram.json

```json
{
  "api_id": "your_api_id",
  "api_hash": "your_api_hash",
  "bot_token": "your_bot_token",
  "chat_id": 123456789
}
```

### .env

```env
TIKTOK_SESSION_ID=your_session_id
TIKTOK_TARGET_IDC=useast2a
TIKTOK_OUTPUT_DIR=./recordings/
TIKTOK_PROXY=http://127.0.0.1:8080
TELEGRAM_BOT_TOKEN=your_bot_token
TELEGRAM_CHAT_ID=123456789
```

## 🔧 Alternative Execution

```bash
npm start -- -user febri_fey            # npm script
npm run dev -- -user febri_fey          # Development
node dist/lib/cli.js -user febri_fey     # Direct node
node dist/main.js -user febri_fey        # Legacy support
npx ts-node src/lib/cli.ts -user febri_fey  # TypeScript direct
```

## ⚠️ Common Errors

| Error | Solution |
|-------|----------|
| `User is not hosting a live stream` | Wait for user to go live or use automatic mode |
| `Session cookies required` | Provide valid cookies.json file |
| `Network connection failed` | Check internet or use proxy |
| `User not found` | Verify username spelling |

## 🌍 Regions

| Region | tt-target-idc |
|--------|---------------|
| US East | `useast2a` |
| Singapore | `alisg` |
| US (General) | `maliva` |

## 📊 Mode Comparison

| Mode | When to Use | Interval |
|------|-------------|----------|
| `manual` | One-time recording | N/A |
| `automatic` | Continuous monitoring | 5+ minutes |
| `followers` | Content discovery | 10+ minutes |

## 🎯 Best Practices

- Use automatic mode for monitoring: `tstok -user febri_fey -mode automatic -automatic_interval 5`
- Always provide cookies: `tstok -user febri_fey -cookies ./cookies.json`
- Set reasonable duration: `tstok -user febri_fey -duration 7200`
- Use proxy if needed: `tstok -user febri_fey -proxy "http://127.0.0.1:8080"`
- Monitor with Telegram: `tstok -user febri_fey -telegram ./telegram.json`

## 🔗 Links

- **[Full Library Guide](./library-usage.md)**
- **[Full CLI Guide](./cli-usage.md)**
- **[Examples](../examples/)**
- **[GitHub](https://github.com/Yoganataa/tiktok-live-recorder-ts)**