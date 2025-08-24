# TstokRecorder Examples

This directory contains usage examples for the TstokRecorder library.

## 📁 Files

- **`basic-usage.js`** - JavaScript/CommonJS examples (attempts actual recording)
- **`typescript-usage.ts`** - TypeScript examples with full type support
- **`demo-usage.js`** - Configuration examples without actual recording (safe for testing)
- **`.env.example`** - Environment variables template

## 🚀 Running Examples

### Prerequisites

1. Install the library (choose one method):
   ```bash
   # Method 1: Install from npm (when published)
   npm install tstok
   
   # Method 2: Install from GitHub
   npm install git+https://github.com/Yoganataa/tstok.git
   
   # Method 3: Local development
   npm link  # From the tstok project root
   ```

2. Set up environment variables (optional):
   ```bash
   cp .env.example .env
   # Edit .env with your actual values
   ```

### Running JavaScript Examples

```bash
# Run the demo examples (configuration only, safe for testing)
node examples/demo-usage.js

# Run the full examples (attempts actual recording)
node examples/basic-usage.js
```

### Running TypeScript Examples

```bash
# Install ts-node if not already installed
npm install -g ts-node

# Run the TypeScript examples
ts-node examples/typescript-usage.ts
```

## 📖 Example Types

### 1. Quick Usage
```javascript
const { TstokRecorder } = require('tstok');

// Record a user immediately
await TstokRecorder.recordUser('febri_fey');
```

### 2. Advanced Configuration
```javascript
const recorder = new TstokRecorder({
  user: 'febri_fey',
  mode: Mode.AUTOMATIC,
  cookies: { /* your cookies */ },
  telegramConfig: { /* telegram config */ },
  output: './recordings/',
  proxy: 'http://proxy:8080'
});

await recorder.start();
```

### 3. Environment-Based Setup
```javascript
// Uses environment variables from .env
const recorder = TstokRecorder.fromEnv();
recorder.updateConfig({ user: 'febri_fey' });
await recorder.start();
```

## 🔧 Configuration Options

| Option | Type | Description |
|--------|------|-------------|
| `user` | `string \| string[]` | TikTok username(s) to record |
| `url` | `string` | Direct TikTok live URL |
| `roomId` | `string` | TikTok room ID |
| `mode` | `Mode` | Recording mode: `MANUAL`, `AUTOMATIC` |
| `automaticInterval` | `number` | Check interval in minutes (automatic mode) |
| `cookies` | `CookiesConfig` | TikTok session cookies |
| `proxy` | `string` | HTTP proxy URL |
| `output` | `string` | Output directory path |
| `duration` | `number` | Maximum recording duration in seconds |
| `telegramConfig` | `TelegramConfig` | Telegram bot configuration |

## 🚨 Important Notes

1. **Session Cookies**: Required for accessing TikTok live streams
2. **Proxy**: May be needed in some regions due to TikTok restrictions
3. **Rate Limiting**: Be respectful of TikTok's servers
4. **Legal Compliance**: Ensure you have permission to record content

## 🛠️ Troubleshooting

### Common Issues

1. **404 Error**: User not found or not live
2. **Network Errors**: Check proxy settings or network connection
3. **Permission Errors**: Ensure output directory is writable
4. **Session Expired**: Update your TikTok session cookies

### Getting Help

- Check the main project README
- Open an issue on GitHub: https://github.com/Yoganataa/tstok/issues
- Review error messages and logs for debugging information