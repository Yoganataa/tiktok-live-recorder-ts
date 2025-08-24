// Basic usage examples for TstokRecorder
// This file demonstrates various ways to use the tstok library

// For local testing, use relative import:
const { TstokRecorder, Mode } = require('../dist/lib/index.js');

// For installed package, use:
// const { TstokRecorder, Mode } = require('tstok');

async function examples() {
  try {
    console.log('🎬 TstokRecorder Usage Examples\n');

    // Example 1: Quick record a user
    console.log('📺 Example 1: Recording user...');
    await TstokRecorder.recordUser('febri_fey');
    console.log('✅ User recording completed\n');
    
    // Example 2: Record from URL
    console.log('🔗 Example 2: Recording from URL...');
    await TstokRecorder.recordFromUrl('https://www.tiktok.com/@febri_fey/live');
    console.log('✅ URL recording completed\n');
    
    // Example 3: Automatic mode with custom config
    console.log('🤖 Example 3: Automatic mode...');
    await TstokRecorder.recordAutomatic('febri_fey', {
      automaticInterval: 3, // Check every 3 minutes
      output: './my-recordings/',
      duration: 7200 // 2 hours max
    });
    console.log('✅ Automatic recording completed\n');

    // Example 4: Advanced configuration
    console.log('⚙️ Example 4: Advanced configuration...');
    const recorder = new TstokRecorder({
      user: 'febri_fey',
      mode: Mode.MANUAL,
      cookies: {
        sessionid_ss: 'your_session_id',
        'tt-target-idc': 'useast2a'
      },
      telegramConfig: {
        api_id: 'your_api_id',
        api_hash: 'your_api_hash',
        bot_token: 'your_bot_token',
        chat_id: 1234567890
      },
      output: './recordings/',
      proxy: 'http://127.0.0.1:8080'
    });
    
    await recorder.start();
    console.log('✅ Advanced configuration recording completed\n');

    // Example 5: Multiple users
    console.log('👥 Example 5: Recording multiple users...');
    const multiRecorder = new TstokRecorder({
      user: ['febri_fey'],
      mode: Mode.MANUAL
    });
    
    await multiRecorder.start();
    console.log('✅ Multiple users recording completed\n');

    // Example 6: Using environment variables only
    console.log('🌍 Example 6: Using environment variables...');
    const envRecorder = TstokRecorder.fromEnv();
    envRecorder.updateConfig({
      user: 'febri_fey',
      mode: Mode.AUTOMATIC
    });
    
    await envRecorder.start();
    console.log('✅ Environment-based recording completed\n');

    // Example 7: Configuration management
    console.log('🔧 Example 7: Configuration management...');
    const configRecorder = new TstokRecorder({
      user: 'febri_fey',
      mode: Mode.MANUAL
    });
    
    // Get current configuration
    const currentConfig = configRecorder.getConfig();
    console.log('Current config:', currentConfig);
    
    // Update configuration
    configRecorder.updateConfig({
      output: './new-output-dir/',
      duration: 3600 // 1 hour
    });
    
    console.log('Configuration updated successfully\n');

    console.log('🎉 All examples completed successfully!');

  } catch (error) {
    console.error('❌ Recording failed:', error.message);
    console.error('Stack trace:', error.stack);
  }
}

// Handle process events
process.on('SIGINT', () => {
  console.log('\n⚠️ Recording interrupted by user');
  process.exit(0);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// Run examples if this file is executed directly
if (require.main === module) {
  console.log('Starting TstokRecorder examples...\n');
  examples().catch(error => {
    console.error('❌ Failed to run examples:', error);
    process.exit(1);
  });
}

module.exports = { examples };