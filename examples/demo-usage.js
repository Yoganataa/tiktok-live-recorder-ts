// Demo usage examples for TstokRecorder (without actual recording)
// This file demonstrates configuration and setup without attempting live recording

// For local testing, use relative import:
const { TstokRecorder, Mode } = require('../dist/lib/index.js');

// For installed package, use:
// const { TstokRecorder, Mode } = require('tstok');

async function demoExamples() {
  console.log('🎬 TstokRecorder Demo Examples (Configuration Only)\n');

  try {
    // Example 1: Basic configuration
    console.log('📺 Example 1: Basic recorder setup...');
    const basicRecorder = new TstokRecorder({
      user: 'demo_user',
      mode: Mode.MANUAL,
      output: './demo-recordings/'
    });
    
    console.log('✅ Basic recorder created');
    console.log('Config:', basicRecorder.getConfig());
    console.log('');

    // Example 2: Advanced configuration
    console.log('⚙️ Example 2: Advanced configuration...');
    const advancedRecorder = new TstokRecorder({
      user: 'demo_user',
      mode: Mode.AUTOMATIC,
      automaticInterval: 5,
      cookies: {
        sessionid_ss: 'demo_session_id',
        'tt-target-idc': 'useast2a'
      },
      telegramConfig: {
        api_id: 'demo_api_id',
        api_hash: 'demo_api_hash',
        bot_token: 'demo_bot_token',
        chat_id: 123456789
      },
      output: './recordings/',
      proxy: 'http://127.0.0.1:8080',
      duration: 3600
    });
    
    console.log('✅ Advanced recorder created');
    console.log('Config keys:', Object.keys(advancedRecorder.getConfig()));
    console.log('');

    // Example 3: Environment-based setup
    console.log('🌍 Example 3: Environment-based setup...');
    const envRecorder = TstokRecorder.fromEnv();
    envRecorder.updateConfig({
      user: 'demo_user',
      mode: Mode.MANUAL
    });
    
    console.log('✅ Environment recorder created and configured');
    console.log('');

    // Example 4: Configuration management
    console.log('🔧 Example 4: Configuration management...');
    const configRecorder = new TstokRecorder({
      user: 'demo_user',
      mode: Mode.MANUAL
    });
    
    // Get current configuration
    const currentConfig = configRecorder.getConfig();
    console.log('Original mode:', currentConfig.mode);
    
    // Update configuration
    configRecorder.updateConfig({
      mode: Mode.AUTOMATIC,
      automaticInterval: 10,
      output: './new-output-dir/'
    });
    
    const updatedConfig = configRecorder.getConfig();
    console.log('Updated mode:', updatedConfig.mode);
    console.log('Updated interval:', updatedConfig.automaticInterval);
    console.log('✅ Configuration updated successfully');
    console.log('');

    // Example 5: Multiple configuration options
    console.log('👥 Example 5: Multiple users configuration...');
    const multiRecorder = new TstokRecorder({
      user: ['user1', 'user2', 'user3'],
      mode: Mode.MANUAL
    });
    
    console.log('✅ Multi-user recorder configured');
    console.log('Users configured:', multiRecorder.getConfig().user);
    console.log('');

    console.log('🎉 All demo examples completed successfully!');
    console.log('\n📝 Note: These examples show configuration only.');
    console.log('To actually record, ensure users are live and you have proper authentication.');

  } catch (error) {
    console.error('❌ Demo failed:', error.message);
  }
}

// Handle process events
process.on('SIGINT', () => {
  console.log('\n⚠️ Demo interrupted by user');
  process.exit(0);
});

// Run demo if this file is executed directly
if (require.main === module) {
  console.log('Starting TstokRecorder demo examples...\n');
  demoExamples().catch(error => {
    console.error('❌ Failed to run demo:', error);
    process.exit(1);
  });
}

module.exports = { demoExamples };