# TikTok Live Recorder - TypeScript Version

A modern TypeScript implementation of TikTok Live Recorder with enhanced error handling and professional architecture.

## 🔧 Installation

### Prerequisites
- Node.js 16 or higher
- FFmpeg installed on your system

### Install FFmpeg

**Windows:**
```bash
# Using Chocolatey
choco install ffmpeg

# Or download from https://ffmpeg.org/download.html
```

**macOS:**
```bash
brew install ffmpeg
```

**Ubuntu/Debian:**
```bash
sudo apt update
sudo apt install ffmpeg
```

### Install Dependencies

1. Clone or download the project
2. Install Node.js dependencies:

```bash
npm install
```

3. Build the TypeScript project:

```bash
npm run build
```

## 🚀 Usage

### Basic Usage

```bash
# Record a specific user
node dist/main.js -user username

# Record from URL
node dist/main.js -url "https://www.tiktok.com/@username/live"

# Record with room ID
node dist/main.js -room_id 1234567890
```

### Advanced Options

```bash
# Automatic mode (keeps checking if user goes live)
node dist/main.js -user username -mode automatic

# Set custom check interval (minutes)
node dist/main.js -user username -mode automatic -automatic_interval 3

# Record with duration limit (seconds)
node dist/main.js -user username -duration 3600

# Custom output directory
node dist/main.js -user username -output "./recordings/"

# Use proxy
node dist/main.js -user username -proxy "http://127.0.0.1:8080"

# Upload to Telegram after recording
node dist/main.js -user username -telegram

# Record multiple users simultaneously
node dist/main.js -user "user1,user2,user3" -mode manual

# Followers mode (record all your followed users when they go live)
node dist/main.js -mode followers
```

## 📁 Configuration Files

### Cookies Configuration (`src/cookies.json`)
```json
{
  "sessionid_ss": "your_session_id_here",
  "tt-target-idc": "useast2a"
}
```

### Telegram Configuration (`src/telegram.json`)
```json
{
  "api_id": "your_api_id",
  "api_hash": "your_api_hash", 
  "bot_token": "your_bot_token",
  "chat_id": 1234567890
}
```

## 🛠 Development

### Build and Watch
```bash
# Build once
npm run build

# Build and watch for changes
npm run watch

# Run in development mode
npm run dev
```

### Available Scripts
- `npm run build` - Compile TypeScript to JavaScript
- `npm run start` - Run the compiled application
- `npm run dev` - Run with ts-node for development
- `npm run watch` - Watch for changes and rebuild
- `npm run clean` - Remove dist folder

## 🔍 Major Fixes and Improvements

### Fixed Issues:
1. **Stream URL Parsing**: Enhanced SDK data parsing with proper fallbacks
2. **Error Handling**: Comprehensive error handling throughout the application
3. **Async/Await**: Proper async/await implementation instead of callback hell
4. **Type Safety**: Full TypeScript types with proper interfaces
5. **HTTP Client**: Modern Axios-based HTTP client with retry logic
6. **Process Management**: Proper signal handling for graceful shutdown
7. **Argument Parsing**: Robust CLI argument validation
8. **Memory Management**: Better buffer handling for streaming
9. **Logging**: Enhanced logging with proper timestamps
10. **Configuration**: Improved config file handling with error recovery

### Performance Improvements:
- Optimized streaming with configurable buffer sizes
- Better resource management
- Reduced memory usage
- Enhanced error recovery

### Code Quality:
- Modern TypeScript with strict typing
- Professional error handling patterns
- Comprehensive validation
- Clean architecture with separation of concerns

## 📊 Troubleshooting

### Common Issues:

1. **"Unable to retrieve live streaming url"**
   - User might not be live
   - Try adding cookies to `cookies.json`
   - Check if you need a proxy due to geo-restrictions

2. **FFmpeg not found**
   - Install FFmpeg and ensure it's in your PATH
   - On Windows, you might need to restart your terminal

3. **Network errors**
   - Try using a proxy if you're in a restricted country
   - Check your internet connection
   - Some regions require authentication cookies

4. **Permission errors**
   - Ensure you have write permissions to the output directory
   - On Linux/Mac, check file permissions

## 📝 Version History

### v1.0.1-alpha (TypeScript Rewrite)
- Complete rewrite in TypeScript
- Enhanced error handling and logging
- Modern async/await patterns
- Improved type safety
- Better resource management
- Professional code architecture

## 📄 License

This project is licensed under the MIT License.

## ⚠️ Disclaimer

This tool is for educational purposes only. Please respect TikTok's Terms of Service and content creators' rights. Use responsibly and ensure you have permission to record content.