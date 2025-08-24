# TSTOK CLI Usage Guide

``` txt
████████╗███████╗████████╗ ██████╗ ██╗  ██╗
╚══██╔══╝██╔════╝╚══██╔══╝██╔═══██╗██║ ██╔╝
   ██║   ███████╗   ██║   ██║   ██║█████╔╝ 
   ██║   ╚════██║   ██║   ██║   ██║██╔═██╗ 
   ██║   ███████║   ██║   ╚██████╔╝██║  ██╗
   ╚═╝   ╚══════╝   ╚═╝    ╚═════╝ ╚═╝  ╚═╝
   
Command Line Interface for TikTok Live Recording
```

## 🚀 Quick Start

After installation, you can use TSTOK via command line:

```bash
# Record a user (manual mode)
tstok -user febri_fey

# Record with automatic checking
tstok -user febri_fey -mode automatic

# Record from URL
tstok -url "https://www.tiktok.com/@febri_fey/live"
```

## 📋 Command Syntax

```bash
tstok [options]
```

## 🔧 Available Options

### User Selection

```bash
# Single user
tstok -user febri_fey

# Multiple users (comma-separated)
tstok -user "febri_fey,user2,user3"

# Direct URL
tstok -url "https://www.tiktok.com/@febri_fey/live"

# Room ID
tstok -room_id "7541840011407444756"
```

### Recording Modes

```bash
# Manual mode (default) - record if user is live now
tstok -user febri_fey -mode manual

# Automatic mode - continuously check if user goes live
tstok -user febri_fey -mode automatic

# Followers mode - record followers' live streams
tstok -user febri_fey -mode followers
```

### Automatic Mode Configuration

```bash
# Set check interval (in minutes)
tstok -user febri_fey -mode automatic -automatic_interval 5

# Check every 10 minutes
tstok -user febri_fey -mode automatic -automatic_interval 10
```

### Authentication & Network

```bash
# Custom cookies file
tstok -user febri_fey -cookies ./my-cookies.json

# Use proxy for restricted regions
tstok -user febri_fey -proxy "http://127.0.0.1:8080"

# SOCKS proxy
tstok -user febri_fey -proxy "socks5://127.0.0.1:1080"
```

### Output Configuration

```bash
# Custom output directory
tstok -user febri_fey -output "./my-recordings/"

# Limit recording duration (in seconds)
tstok -user febri_fey -duration 3600  # 1 hour

# Duration in different formats
tstok -user febri_fey -duration 7200  # 2 hours
```

### Telegram Integration

```bash
# Enable Telegram notifications
tstok -user febri_fey -telegram ./telegram.json
```

### Utility Options

```bash
# Show help
tstok -h
tstok --help

# Show version
tstok -V
tstok --version

# Skip update check
tstok -user febri_fey --no-update-check
```

## 📁 Configuration Files

### Cookies File (`cookies.json`)

```json
{
  "sessionid_ss": "your_tiktok_session_id",
  "tt-target-idc": "useast2a"
}
```

### Telegram Config (`telegram.json`)

```json
{
  "api_id": "your_telegram_api_id",
  "api_hash": "your_telegram_api_hash",
  "bot_token": "your_bot_token",
  "chat_id": 123456789
}
```

### Environment Variables (`.env`)

```env
TIKTOK_SESSION_ID=your_session_id
TIKTOK_TARGET_IDC=useast2a
TIKTOK_PROXY=http://127.0.0.1:8080
TIKTOK_OUTPUT_DIR=./recordings/
TELEGRAM_API_ID=your_api_id
TELEGRAM_API_HASH=your_api_hash
TELEGRAM_BOT_TOKEN=your_bot_token
TELEGRAM_CHAT_ID=123456789
```

## 💡 Usage Examples

### Basic Recording

```bash
# Record febri_fey if they're live now
tstok -user febri_fey
```

### Automatic Monitoring

```bash
# Check every 5 minutes if febri_fey goes live
tstok -user febri_fey -mode automatic -automatic_interval 5
```

### Multiple Users

```bash
# Monitor multiple users
tstok -user "febri_fey,user2,user3" -mode automatic
```

### Custom Output & Duration

```bash
# Save to custom directory, max 2 hours
tstok -user febri_fey -output "./febri-recordings/" -duration 7200
```

### With Proxy & Cookies

```bash
# Use proxy and custom cookies
tstok -user febri_fey \
      -proxy "http://127.0.0.1:8080" \
      -cookies "./my-cookies.json"
```

### Complete Setup

```bash
# Full configuration example
tstok -user febri_fey \
      -mode automatic \
      -automatic_interval 3 \
      -output "./recordings/" \
      -duration 3600 \
      -cookies "./cookies.json" \
      -telegram "./telegram.json" \
      -proxy "http://127.0.0.1:8080"
```

## 🔄 Alternative Execution Methods

### Using npm scripts

```bash
# If installed locally
npm start -- -user febri_fey

# Development mode
npm run dev -- -user febri_fey
```

### Using node directly

```bash
# Built version
node dist/lib/cli.js -user febri_fey

# Legacy support
node dist/main.js -user febri_fey

# Development (TypeScript)
npx ts-node src/lib/cli.ts -user febri_fey
```

## 🌍 Regional Considerations

### For Restricted Regions

```bash
# Use proxy to bypass restrictions
tstok -user febri_fey -proxy "http://proxy-server:8080"

# Different region cookies
tstok -user febri_fey -cookies "./regional-cookies.json"
```

### Cookie Region Settings

In your `cookies.json`:

```json
{
  "sessionid_ss": "your_session_id",
  "tt-target-idc": "useast2a"    // US East
  // "tt-target-idc": "alisg"     // Singapore  
  // "tt-target-idc": "maliva"    // US
}
```

## 📊 Output Information

### Console Output

``` txt
[*] 2025-08-23 19:30:15 - USERNAME: febri_fey
[*] 2025-08-23 19:30:16 - ROOM_ID: 7541840011407444756
[*] 2025-08-23 19:30:17 - Recording started...
[*] 2025-08-23 19:35:42 - Recording completed
```

### File Output

``` txt
recordings/
├── febri_fey_2025-08-23_19-30-15.flv
├── febri_fey_2025-08-23_19-30-15.mp4
└── logs/
    └── recording-2025-08-23.log
```

## ⚠️ Error Messages & Troubleshooting

### Common Errors

#### User Not Live

``` txt
[!] UserLiveError: @febri_fey: The user is not hosting a live stream at the moment.
```

**Solution:** Wait for user to go live or use automatic mode

#### Network Connection

``` txt
[!] NetworkError: Failed to connect to TikTok servers
```

**Solution:** Check internet connection or use proxy

#### Authentication Required

``` txt
[!] TikTokRecorderError: Session cookies required
```

**Solution:** Provide valid cookies file

#### Invalid User

``` txt
[!] UserLiveError: @invalid_user: User not found
```

**Solution:** Check username spelling

### Troubleshooting Steps

1. **Check if user exists and is live**

   ```bash
   tstok -user febri_fey -mode manual
   ```

2. **Verify cookies**

   ```bash
   tstok -user febri_fey -cookies ./cookies.json
   ```

3. **Test with proxy**

   ```bash
   tstok -user febri_fey -proxy "http://127.0.0.1:8080"
   ```

4. **Use automatic mode**

   ```bash
   tstok -user febri_fey -mode automatic -automatic_interval 5
   ```

## 🔧 Advanced Usage

### Batch Processing

Create a script to record multiple users:

```bash
#!/bin/bash
# record-multiple.sh

users=("febri_fey" "user2" "user3")

for user in "${users[@]}"; do
    echo "Starting recording for $user"
    tstok -user "$user" -mode automatic -automatic_interval 5 &
done

wait
```

### Scheduled Recording

Use cron for scheduled recording:

```bash
# Add to crontab (crontab -e)
# Check every hour if febri_fey is live
0 * * * * /usr/local/bin/tstok -user febri_fey -mode manual --no-update-check
```

### Docker Usage

```dockerfile
FROM node:18-alpine
RUN npm install -g tstok
ENTRYPOINT ["tstok"]
```

```bash
# Run in Docker
docker run --rm -v $(pwd)/recordings:/recordings \
  tstok-container -user febri_fey -output /recordings
```

## 🛡️ Security Considerations

1. **Protect cookies.json** - Contains sensitive session data
2. **Use environment variables** for sensitive information
3. **Avoid hardcoding credentials** in scripts
4. **Keep session cookies updated** - They expire periodically
5. **Use HTTPS proxies** when possible

## 📱 Integration Examples

### Shell Scripts

```bash
#!/bin/bash
# auto-record-febri.sh

echo "Starting automatic recording for febri_fey"
tstok -user febri_fey \
     -mode automatic \
     -automatic_interval 10 \
     -output "./recordings/febri/" \
     -telegram "./telegram.json"
```

### Python Integration

```python
import subprocess
import os

def record_user(username, duration=3600):
    cmd = [
        'tstok',
        '-user', username,
        '-duration', str(duration),
        '-output', f'./recordings/{username}/'
    ]
    
    result = subprocess.run(cmd, capture_output=True, text=True)
    return result.returncode == 0

# Usage
record_user('febri_fey', 7200)  # 2 hours
```

## 📖 Help & Support

### Get Help

```bash
tstok --help
```

### Version Information

```bash
tstok --version
```

### Debug Mode

```bash
DEBUG=tstok:* tstok -user febri_fey
```

### Report Issues

- GitHub: <https://github.com/Yoganataa/tiktok-live-recorder-ts/issues>
- Include command used and error output

## 🚀 Performance Tips

1. **Use appropriate intervals** for automatic mode (5+ minutes)
2. **Limit concurrent recordings** to avoid rate limiting
3. **Use SSD storage** for better I/O performance
4. **Monitor disk space** for long recordings
5. **Close unnecessary applications** during recording

## 📄 License

MIT License - see LICENSE file for details.
