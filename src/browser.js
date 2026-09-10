/**
 * 24/7 Cloud LinkedIn Bot - Playwright Headless Browser Launcher
 */

const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');
const config = require('./config');
const DB = require('./db');

async function launchBrowser() {
  const storagePath = path.join(__dirname, '../data/storageState.json');

  const browser = await chromium.launch({
    headless: true,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-blink-features=AutomationControlled'
    ]
  });

  const contextOptions = {
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
    viewport: { width: 1280, height: 800 },
    locale: 'en-US'
  };

  if (fs.existsSync(storagePath)) {
    contextOptions.storageState = storagePath;
  }

  const context = await browser.newContext(contextOptions);

  if (config.liAtCookie && !fs.existsSync(storagePath)) {
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
  return { browser, context, page };
}

module.exports = {
  launchBrowser
};
