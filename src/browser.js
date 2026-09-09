/**
 * 24/7 Cloud LinkedIn Bot - Playwright Headless Browser Launcher
 */

const { chromium } = require('playwright');
const config = require('./config');
const DB = require('./db');

async function launchBrowser() {
  if (!config.liAtCookie) {
    DB.addLog('error', 'LINKEDIN_LI_AT_COOKIE missing in .env! Please set your session cookie.');
    throw new Error('Missing LINKEDIN_LI_AT_COOKIE in .env file.');
  }

  const browser = await chromium.launch({
    headless: true,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-blink-features=AutomationControlled'
    ]
  });

  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
    viewport: { width: 1280, height: 800 },
    locale: 'en-US'
  });

  // Inject LinkedIn session cookie
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

  const page = await context.newPage();
  return { browser, context, page };
}

module.exports = {
  launchBrowser
};
