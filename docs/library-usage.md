# TSTOK Library Usage Guide

```
████████╗███████╗████████╗ ██████╗ ██╗  ██╗
╚══██╔══╝██╔════╝╚══██╔══╝██╔═══██╗██║ ██╔╝
   ██║   ███████╗   ██║   ██║   ██║█████╔╝ 
   ██║   ╚════██║   ██║   ██║   ██║██╔═██╗ 
   ██║   ███████║   ██║   ╚██████╔╝██║  ██╗
   ╚═╝   ╚══════╝   ╚═╝    ╚═════╝ ╚═╝  ╚═╝
   
TypeScript Library for TikTok Live Recording
```

## 📦 Installation

### From npm (when published)

```bash
# Install globally
npm install -g tstok

# Install locally
npm install tstok
```

### From GitHub

```bash
# Install from GitHub
npm install git+https://github.com/Yoganataa/tiktok-live-recorder-ts.git

# Install globally from GitHub
npm install -g git+https://github.com/Yoganataa/tiktok-live-recorder-ts.git
```

### Local Development

```bash
git clone https://github.com/Yoganataa/tiktok-live-recorder-ts.git
cd tstok
npm install
npm run build
npm link
```

## 🚀 Quick Start

### JavaScript/CommonJS

```javascript
const { TstokRecorder, Mode } = require('tstok');

// Quick record a user
await TstokRecorder.recordUser('febri_fey');
```

### TypeScript/ES Modules

```typescript
import { TstokRecorder, Mode, TstokRecorderConfig } from 'tstok';

// Quick record a user
await TstokRecorder.recordUser('febri_fey');
```

## 📚 API Reference

### TstokRecorder Class

#### Constructor

```typescript
new TstokRecorder(config: TstokRecorderConfig)
```

**Parameters:**

- `config` - Configuration object for the recorder

#### Configuration Interface

```typescript
interface TstokRecorderConfig {
  user?: string | string[];        // TikTok username(s)
  url?: string;                    // Direct TikTok live URL
  roomId?: string;                 // TikTok room ID
  mode?: Mode;                     // Recording mode
  automaticInterval?: number;      // Check interval (minutes)
  cookies?: CookiesConfig;         // Session cookies
  proxy?: string;                  // HTTP proxy
  output?: string;                 // Output directory
  duration?: number;               // Max duration (seconds)
  telegramConfig?: TelegramConfig; // Telegram bot config
}
```

#### Methods

##### `start(): Promise<void>`

Starts the recording process based on configuration.

```typescript
const recorder = new TstokRecorder({
  user: 'febri_fey',
  mode: Mode.MANUAL
});

await recorder.start();
```

##### `getConfig(): TstokRecorderConfig`

Returns the current configuration.

```typescript
const config = recorder.getConfig();
console.log('Current user:', config.user);
```

##### `updateConfig(newConfig: Partial<TstokRecorderConfig>): void`

Updates the configuration and recreates the recorder.

```typescript
recorder.updateConfig({
  output: './new-recordings/',
  duration: 3600
});
```

### Static Methods

##### `TstokRecorder.recordUser(username, options?): Promise<void>`

Quick method to record a specific user.

```typescript
// Basic usage
await TstokRecorder.recordUser('febri_fey');

// With options
await TstokRecorder.recordUser('febri_fey', {
  output: './recordings/',
  duration: 7200
});
```

##### `TstokRecorder.recordFromUrl(url, options?): Promise<void>`

Record from a direct TikTok live URL.

```typescript
await TstokRecorder.recordFromUrl(
  'https://www.tiktok.com/@febri_fey/live',
  { output: './recordings/' }
);
```

##### `TstokRecorder.recordAutomatic(username, options?): Promise<void>`

Start automatic mode recording.

```typescript
await TstokRecorder.recordAutomatic('febri_fey', {
  automaticInterval: 5, // Check every 5 minutes
  duration: 7200        // 2 hours max
});
```

##### `TstokRecorder.fromEnv(): TstokRecorder`

Create recorder using environment variables.

```typescript
const recorder = TstokRecorder.fromEnv();
recorder.updateConfig({ user: 'febri_fey' });
await recorder.start();
```

## 🔧 Configuration Examples

### Basic Configuration

```typescript
const recorder = new TstokRecorder({
  user: 'febri_fey',
  mode: Mode.MANUAL,
  output: './recordings/'
});
```

### Advanced Configuration

```typescript
const recorder = new TstokRecorder({
  user: 'febri_fey',
  mode: Mode.AUTOMATIC,
  automaticInterval: 3,
  cookies: {
    sessionid_ss: 'your_session_id',
    'tt-target-idc': 'useast2a'
  },
  telegramConfig: {
    api_id: 'your_api_id',
    api_hash: 'your_api_hash',
    bot_token: 'your_bot_token',
    chat_id: 123456789
  },
  proxy: 'http://127.0.0.1:8080',
  output: './recordings/',
  duration: 7200
});
```

### Multiple Users

```typescript
const recorder = new TstokRecorder({
  user: ['febri_fey', 'user2', 'user3'],
  mode: Mode.MANUAL
});
```

### Environment-Based Setup

Create a `.env` file:

```env
TIKTOK_SESSION_ID=your_session_id
TIKTOK_TARGET_IDC=useast2a
TIKTOK_OUTPUT_DIR=./recordings/
TELEGRAM_BOT_TOKEN=your_bot_token
TELEGRAM_CHAT_ID=123456789
```

Then use:

```typescript
const recorder = TstokRecorder.fromEnv();
recorder.updateConfig({ user: 'febri_fey' });
```

## 📊 Recording Modes

### Manual Mode

Records when the user is currently live.

```typescript
const recorder = new TstokRecorder({
  user: 'febri_fey',
  mode: Mode.MANUAL
});
```

### Automatic Mode

Continuously checks if the user goes live.

```typescript
const recorder = new TstokRecorder({
  user: 'febri_fey',
  mode: Mode.AUTOMATIC,
  automaticInterval: 5 // Check every 5 minutes
});
```

## 🔐 Authentication

### Session Cookies

TikTok requires session cookies for accessing live streams:

```typescript
const cookies = {
  sessionid_ss: 'your_tiktok_session_id',
  'tt-target-idc': 'useast2a' // or your region
};

const recorder = new TstokRecorder({
  user: 'febri_fey',
  cookies
});
```

### Getting Session Cookies

1. Login to TikTok in your browser
2. Open Developer Tools (F12)
3. Go to Application/Storage → Cookies
4. Copy `sessionid_ss` value

## 🌐 Proxy Support

For regions with TikTok restrictions:

```typescript
const recorder = new TstokRecorder({
  user: 'febri_fey',
  proxy: 'http://proxy-server:8080'
});
```

## 📱 Telegram Integration

Get notified when recordings start/finish:

```typescript
const telegramConfig = {
  api_id: 'your_telegram_api_id',
  api_hash: 'your_telegram_api_hash', 
  bot_token: 'your_bot_token',
  chat_id: 123456789
};

const recorder = new TstokRecorder({
  user: 'febri_fey',
  telegramConfig
});
```

## ⚠️ Error Handling

```typescript
import { 
  TikTokRecorderError, 
  UserLiveError, 
  LiveNotFound,
  NetworkError 
} from 'tstok';

try {
  await recorder.start();
} catch (error) {
  if (error instanceof UserLiveError) {
    console.log('User is not live');
  } else if (error instanceof NetworkError) {
    console.log('Network connection issue');
  } else if (error instanceof TikTokRecorderError) {
    console.log('TikTok API error:', error.message);
  } else {
    console.log('Unknown error:', error);
  }
}
```

## 📁 Output Configuration

### Default Output

By default, recordings are saved to `./recordings/`

### Custom Output

```typescript
const recorder = new TstokRecorder({
  user: 'febri_fey',
  output: '/path/to/my/recordings/'
});
```

### Duration Limiting

```typescript
const recorder = new TstokRecorder({
  user: 'febri_fey',
  duration: 3600 // 1 hour maximum
});
```

## 💡 Best Practices

1. **Always use try-catch** for error handling
2. **Set reasonable intervals** for automatic mode (5+ minutes)
3. **Use environment variables** for sensitive data
4. **Respect rate limits** - don't check too frequently
5. **Handle network errors** gracefully
6. **Clean up resources** properly

## 🔍 Debugging

Enable debug logging:

```typescript
process.env.DEBUG = 'tstok:*';
```

## 📖 Type Definitions

Full TypeScript support with complete type definitions:

```typescript
import type { 
  TstokRecorderConfig,
  CookiesConfig,
  TelegramConfig,
  Mode
} from 'tstok';
```

## 🤝 Contributing

See the main project README for contribution guidelines.

## 📄 License

MIT License - see LICENSE file for details.
