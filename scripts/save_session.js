/**
 * Session Authenticator & StorageState Generator
 * Creates a persistent browser fingerprint (cookies + local storage + session storage)
 */

const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');
const config = require('../src/config');

async function generateStorageState() {
  console.log('Generating persistent storage state...');

  const dataDir = path.join(__dirname, '../data');
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }

  const storagePath = path.join(dataDir, 'storageState.json');

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36'
  });

  if (config.liAtCookie) {
    await context.addCookies([
      {
        name: 'li_at',
        value: config.liAtCookie,
        domain: '.www.linkedin.com',
        path: '/',
        httpOnly: true,
        secure: true,
        sameSite: 'None'
      }
    ]);
  }

  const page = await context.newPage();
  await page.goto('https://www.linkedin.com/feed/', { waitUntil: 'domcontentloaded', timeout: 45000 });
  await page.waitForTimeout(3000);

  // Save complete state fingerprint
  await context.storageState({ path: storagePath });
  console.log(`Saved persistent browser session state to ${storagePath}`);

  await browser.close();
}

generateStorageState().catch(err => console.error('Error generating storage state:', err.message));
