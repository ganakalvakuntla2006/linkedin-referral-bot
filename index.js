/**
 * 24/7 Real-Time Cloud LinkedIn Auto-Referral Bot
 * Entry Point Script
 */

const cron = require('node-cron');
const config = require('./src/config');
const DB = require('./src/db');
const { launchBrowser } = require('./src/browser');
const { checkAcceptancesAndProcess } = require('./src/detector');

async function runScanCycle() {
  DB.addLog('info', `=== Starting Scan Cycle [${new Date().toLocaleTimeString()}] ===`);
  let browserInstance = null;
  try {
    const { browser, page } = await launchBrowser();
    browserInstance = browser;

    await checkAcceptancesAndProcess(page);
  } catch (err) {
    DB.addLog('error', `Scan cycle error: ${err.message}`);
  } finally {
    if (browserInstance) {
      await browserInstance.close().catch(() => {});
    }
    DB.addLog('info', '=== Completed Scan Cycle ===');
  }
}

// Main Execution Handler
async function main() {
  const args = process.argv.slice(2);
  const runOnce = args.includes('--once');

  DB.addLog('info', '🤖 LinkedIn 24/7 Cloud Referral Bot Initialized.');
  DB.addLog('info', `Target Tech Keywords: ${config.targetKeywords.join(', ')}`);
  DB.addLog('info', `Daily Limit Cap: ${config.dailyLimit} messages/day`);

  if (runOnce) {
    console.log('Running single scan mode (--once)...');
    await runScanCycle();
    process.exit(0);
  } else {
    // 24/7 Cron Schedule
    const cronSchedule = `*/${config.pollIntervalMinutes} * * * *`;
    console.log(`Starting 24/7 real-time background scheduler (Cron: "${cronSchedule}" -> Every ${config.pollIntervalMinutes} mins)...`);

    // Run initial scan immediately
    await runScanCycle();

    // Schedule subsequent scans
    cron.schedule(cronSchedule, () => {
      runScanCycle();
    });
  }
}

main();
