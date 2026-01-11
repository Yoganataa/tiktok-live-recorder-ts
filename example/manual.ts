// example/manual.ts

import 'dotenv/config';
import { config } from 'dotenv';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

/**
 * Standardize path resolution for ES Modules
 */
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables from the example directory
config({ path: resolve(__dirname, '.env') });

/**
 * Manual Recording Example with Graceful Shutdown
 */
async function main() {
  const username = process.env.TIKTOK_USERNAME;
  const sessionId = process.env.TIKTOK_SESSIONID_SS;

  if (!username || !sessionId) {
    console.error('Error: Missing TIKTOK_USERNAME or TIKTOK_SESSIONID_SS in .env file.');
    process.exit(1);
  }

  // Dynamic import allows environment variables to be loaded before the library initializes
  const { TikTokRecorder, Mode } = await import('../src/index');

  console.log(`[CLI] Initializing Manual Recorder for: @${username}`);

  const recorder = new TikTokRecorder({
    mode: Mode.MANUAL,
    user: username,
    outputDir: resolve(__dirname, '../downloads'),
    uploadToTelegram: !!process.env.TELEGRAM_API_ID,
    events: {
      onStart: (meta) => {
        console.log(`[EVENT] Recording started! Room ID: ${meta.roomId}`);
      },
      onStop: () => {
        console.log('[EVENT] Recording stopped. Starting post-processing...');
      },
      onError: (err) => {
        console.error('[EVENT] Error occurred:', err.message);
      },
    },
  });

  // Flag untuk mencegah spam CTRL+C
  let isStopping = false;

  process.on('SIGINT', () => {
    if (isStopping) {
      console.log('\n[CLI] Force killing process (Data might be corrupted!)');
      process.exit(1);
    }

    isStopping = true;
    console.log('\n\n[CLI] SIGINT received. Shutting down gracefully...');
    console.log('=============================================================');
    console.log('⚠️  PLEASE WAIT: Merging segments and converting file...');
    console.log('⚠️  DO NOT CLOSE THIS WINDOW or press CTRL+C again.');
    console.log('=============================================================\n');

    // Memicu penghentian rekaman.
    // Library akan keluar dari loop rekaman -> menggabungkan file -> lalu return.
    recorder.stop();
  });

  try {
    console.log('[CLI] Checking live status...');

    // Script akan diam di baris ini selama rekaman berjalan.
    // Ketika recorder.stop() dipanggil, baris ini akan menunggu proses konversi selesai baru lanjut ke bawah.
    await recorder.start();

    console.log('[CLI] Process finished successfully. File saved.');
  } catch (error) {
    // Abaikan error jika itu disebabkan oleh pembatalan manual (AbortError)
    const msg = error instanceof Error ? error.message : String(error);
    if (!msg.includes('aborted')) {
      console.error(`[CLI] Fatal Error: ${msg}`);
      process.exit(1);
    }
    console.log('[CLI] Process finished.');
  }
}

void main();
