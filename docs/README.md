# TSTOK Documentation

```
████████╗███████╗████████╗ ██████╗ ██╗  ██╗
╚══██╔══╝██╔════╝╚══██╔══╝██╔═══██╗██║ ██╔╝
   ██║   ███████╗   ██║   ██║   ██║█████╔╝ 
   ██║   ╚════██║   ██║   ██║   ██║██╔═██╗ 
   ██║   ███████║   ██║   ╚██████╔╝██║  ██╗
   ╚═╝   ╚══════╝   ╚═╝    ╚═════╝ ╚═╝  ╚═╝
   
TypeScript Library & CLI Tool for TikTok Live Recording
```

Welcome to the TSTOK documentation! This guide will help you get started with both the library and command-line interface.

## 📚 Documentation Structure

### 📖 **[Library Usage Guide](./library-usage.md)**

Complete guide for using TSTOK as a library in your applications:

- Installation methods
- API reference and TypeScript definitions
- Configuration examples
- Error handling
- Best practices

### 🖥️ **[CLI Usage Guide](./cli-usage.md)**

Comprehensive command-line interface documentation:

- Command syntax and options
- Configuration files
- Usage examples
- Troubleshooting
- Advanced integrations

## 🚀 Quick Start

### As a Library

```typescript
import { TstokRecorder } from 'tstok';

// Quick record
await TstokRecorder.recordUser('febri_fey');
```

### As a CLI Tool

```bash
# Install and use
npm install -g tstok
tstok -user febri_fey
```

## 🎯 Choose Your Path

| I want to... | Go to |
|--------------|-------|
| **Use TSTOK in my Node.js/TypeScript project** | [Library Usage Guide](./library-usage.md) |
| **Use TSTOK from command line** | [CLI Usage Guide](./cli-usage.md) |
| **See examples and demos** | [Examples Directory](../examples/) |
| **Contribute to the project** | [Main README](../README.md) |

## 🔧 Core Features

- ✅ **Dual Interface**: Library + CLI
- ✅ **TypeScript Support**: Full type definitions
- ✅ **Multiple Modes**: Manual & Automatic recording
- ✅ **Telegram Integration**: Get notified of recordings
- ✅ **Proxy Support**: Bypass regional restrictions
- ✅ **Multiple Users**: Monitor several users at once
- ✅ **Environment Config**: Use .env files
- ✅ **Error Handling**: Comprehensive error types

## 🎬 Usage Examples

### Library Quick Examples

```typescript
// Basic usage
const recorder = new TstokRecorder({
  user: 'febri_fey',
  mode: Mode.MANUAL
});
await recorder.start();

// Automatic monitoring
await TstokRecorder.recordAutomatic('febri_fey', {
  automaticInterval: 5,
  duration: 7200
});
```

### CLI Quick Examples

```bash
# Basic recording
tstok -user febri_fey

# Automatic mode with notifications
tstok -user febri_fey -mode automatic -telegram ./telegram.json

# Multiple users with proxy
tstok -user "febri_fey,user2" -proxy "http://127.0.0.1:8080"
```

## 🔐 Configuration

### Authentication

Both library and CLI require TikTok session cookies:

```json
{
  "sessionid_ss": "your_session_id",
  "tt-target-idc": "useast2a"
}
```

### Environment Variables

```env
TIKTOK_SESSION_ID=your_session_id
TIKTOK_OUTPUT_DIR=./recordings/
TELEGRAM_BOT_TOKEN=your_bot_token
```

## 📊 Recording Modes

| Mode | Description | Use Case |
|------|-------------|----------|
| **Manual** | Record if user is live now | One-time recordings |
| **Automatic** | Continuously monitor | Long-term monitoring |
| **Followers** | Record followers' streams | Content discovery |

## 🌍 Global Support

- **Multi-region**: Works with different TikTok regions
- **Proxy Support**: Bypass geographic restrictions
- **Multiple Formats**: Output in various video formats
- **Internationalization**: Support for global usernames

## ⚠️ Important Notes

1. **Respect Terms of Service**: Only record content you have permission to record
2. **Session Cookies**: Required for accessing TikTok live streams
3. **Rate Limiting**: Don't check too frequently to avoid being blocked
4. **Storage Space**: Live recordings can be large files
5. **Network**: Stable internet connection required

## 🛟 Getting Help

### Documentation

- **[Library Guide](./library-usage.md)** - For developers
- **[CLI Guide](./cli-usage.md)** - For command-line users
- **[Examples](../examples/)** - Working code examples

### Support

- **GitHub Issues**: [Report bugs or request features](https://github.com/Yoganataa/tiktok-live-recorder-ts/issues)
- **Discussions**: Community support and questions
- **Wiki**: Additional guides and tutorials

### Common Issues

| Problem | Solution |
|---------|----------|
| User not found | Check username spelling |
| Not live | Wait or use automatic mode |
| Network error | Check connection or use proxy |
| Auth error | Update session cookies |

## 🔄 Migration Guide

### From CLI to Library

```bash
# CLI command
tstok -user febri_fey -mode automatic

# Equivalent library code
const recorder = new TstokRecorder({
  user: 'febri_fey',
  mode: Mode.AUTOMATIC
});
await recorder.start();
```

### From Library to CLI

```typescript
// Library code
await TstokRecorder.recordUser('febri_fey');

// Equivalent CLI command
tstok -user febri_fey
```

## 📈 Advanced Topics

- **Performance Optimization**: Tips for efficient recording
- **Batch Processing**: Recording multiple users
- **Integration Patterns**: Using with other tools
- **Deployment**: Production considerations
- **Monitoring**: Logging and error tracking

## 🚀 What's Next?

1. **[Install TSTOK](./library-usage.md#installation)** using your preferred method
2. **[Try Examples](../examples/)** to see it in action
3. **[Read Full Documentation](./library-usage.md)** for your use case
4. **[Join Community](https://github.com/Yoganataa/tiktok-live-recorder-ts)** for support and updates

---

**Ready to start recording?** Choose your preferred interface and dive into the detailed guides!

📖 **[Library Usage →](./library-usage.md)** | 🖥️ **[CLI Usage →](./cli-usage.md)**
