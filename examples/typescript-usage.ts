// TypeScript usage examples for TstokRecorder
// This file demonstrates various ways to use the tstok library with TypeScript

// For local testing, use relative import:
import { TstokRecorder, Mode, TstokRecorderConfig } from '../src/lib/index';

// For installed package, use:
// import { TstokRecorder, Mode, TstokRecorderConfig } from 'tstok';

async function examples(): Promise<void> {
  try {
    console.log('🎬 TstokRecorder TypeScript Usage Examples\n');

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

    // Example 4: Advanced configuration with proper typing
    console.log('⚙️ Example 4: Advanced configuration...');
    const config: TstokRecorderConfig = {
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
    };
    
    const recorder = new TstokRecorder(config);
    await recorder.start();
    console.log('✅ Advanced configuration recording completed\n');

    // Example 5: Multiple users with type safety
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

    // Example 7: Configuration management with types
    console.log('🔧 Example 7: Configuration management...');
    const configRecorder = new TstokRecorder({
      user: 'febri_fey',
      mode: Mode.MANUAL
    });
    
    // Get current configuration (fully typed)
    const currentConfig: TstokRecorderConfig = configRecorder.getConfig();
    console.log('Current config:', currentConfig);
    
    // Update configuration with partial config
    const updateConfig: Partial<TstokRecorderConfig> = {
      output: './new-output-dir/',
      duration: 3600 // 1 hour
    };
    
    configRecorder.updateConfig(updateConfig);
    console.log('Configuration updated successfully\n');

    // Example 8: Error handling with custom error types
    console.log('⚠️ Example 8: Error handling...');
    try {
      const invalidRecorder = new TstokRecorder({
        user: '', // Invalid empty user
        mode: Mode.MANUAL
      });
      await invalidRecorder.start();
    } catch (error) {
      console.log('Caught expected error:', error.message);
    }

    console.log('🎉 All TypeScript examples completed successfully!');

  } catch (error) {
    console.error('❌ Recording failed:', (error as Error).message);
    console.error('Stack trace:', (error as Error).stack);
  }
}

// Handle process events with proper typing
process.on('SIGINT', (): void => {
  console.log('\n⚠️ Recording interrupted by user');
  process.exit(0);
});

process.on('unhandledRejection', (reason: unknown, promise: Promise<unknown>): void => {
  console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// Run examples if this file is executed directly
if (require.main === module) {
  console.log('Starting TstokRecorder TypeScript examples...\n');
  examples().catch((error: Error) => {
    console.error('❌ Failed to run examples:', error);
    process.exit(1);
  });
}

export { examples };