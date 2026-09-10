/**
 * 24/7 Cloud LinkedIn Bot - Real-Time Acceptance Detector
 */

const { isTechRole, compileTemplate } = require('./matcher');
const DB = require('./db');
const config = require('./config');
const { sendReferralMessage } = require('./messenger');

async function checkAcceptancesAndProcess(page) {
  DB.addLog('info', 'Checking LinkedIn for new connection request acceptances...');

  const dailyCount = DB.getDailySentCount();
  if (dailyCount >= config.dailyLimit) {
    DB.addLog('warning', `Daily limit cap (${config.dailyLimit}) reached for today. Skipping scan.`);
    return;
  }

  // Warm up session
  try {
    await page.goto('https://www.linkedin.com/feed/', { waitUntil: 'domcontentloaded', timeout: 45000 }).catch(() => {});
    await sleep(3000);
  } catch (e) {}

  // Step 1: Scan Notifications page
  try {
    DB.addLog('info', 'Scanning LinkedIn notifications stream...');
    await page.goto('https://www.linkedin.com/notifications/', { waitUntil: 'domcontentloaded', timeout: 45000 });
    await sleep(3000);

    const notificationItems = await page.$$('.nt-card, article.nt-card, div.notification-item, .nt-card__content');
    for (const card of notificationItems) {
      const textContent = await card.innerText().catch(() => '');

      if (textContent.toLowerCase().includes('accepted your invitation') || textContent.toLowerCase().includes('is now a connection')) {
        const linkEl = await card.$('a[href*="/in/"]');
        if (linkEl) {
          const profileUrl = await linkEl.getAttribute('href');
          if (profileUrl && !DB.isProfileProcessed(profileUrl)) {
            DB.addLog('info', `New connection notification detected: ${profileUrl}`);
            await processCandidateProfile(page, profileUrl);
          }
        }
      }
    }
  } catch (err) {
    DB.addLog('warning', `Notifications scan note: ${err.message}`);
  }

  // Step 2: Scan Connections page (List of all recent 1st degree connections)
  try {
    DB.addLog('info', 'Scanning LinkedIn connections list...');
    await page.goto('https://www.linkedin.com/mynetwork/invite-connect/connections/', { waitUntil: 'domcontentloaded', timeout: 45000 });
    await sleep(3000);

    // Scroll down slightly to trigger dynamic render
    await page.evaluate(() => window.scrollBy(0, 500));
    await sleep(2000);

    const connectionCards = await page.$$('.mn-connection-card, li.mn-connection-card, div.entity-result__item, li.mn-connection-card__details, .mn-connections__list li');
    DB.addLog('info', `Found ${connectionCards.length} connections on LinkedIn connections page.`);

    for (const card of connectionCards) {
      const linkEl = await card.$('a.mn-connection-card__link, a.app-aware-link[href*="/in/"], a[href*="/in/"]');
      if (!linkEl) continue;

      const rawUrl = await linkEl.getAttribute('href');
      if (!rawUrl) continue;

      const profileUrl = cleanProfileUrl(rawUrl);
      if (!profileUrl || DB.isProfileProcessed(profileUrl)) continue;

      const nameEl = await card.$('.mn-connection-card__name, .entity-result__title-text a, span.mn-connection-card__name');
      const name = nameEl ? (await nameEl.innerText()).trim() : '';

      const headlineEl = await card.$('.mn-connection-card__occupation, .entity-result__primary-subtitle, span.mn-connection-card__occupation');
      const headline = headlineEl ? (await headlineEl.innerText()).trim() : '';

      const companyEl = await card.$('.entity-result__secondary-subtitle');
      const company = companyEl ? (await companyEl.innerText()).trim() : parseCompanyFromHeadline(headline);

      if (isTechRole(headline, config.targetKeywords)) {
        DB.addLog('info', `Accepted connection matched Tech Role: ${name} (${headline})`);

        const candidate = { name, title: headline, company, profileUrl };
        const compiledMsg = compileTemplate(config.messageTemplate, candidate);

        const delaySec = getRandomInt(config.delayMinSec, config.delayMaxSec);
        DB.addLog('info', `Applying safety reaction delay of ${delaySec}s before sending to ${name}...`);
        await sleep(delaySec * 1000);

        await sendReferralMessage(page, candidate, compiledMsg);
      } else {
        DB.addLog('info', `Connection ${name} (${headline}) is not a tech role match. Marking skipped.`);
        DB.markProfileProcessed(profileUrl, { name, status: 'SKIPPED_NOT_TECH' });
      }
    }
  } catch (err) {
    DB.addLog('warning', `Connections list scan note: ${err.message}`);
  }
}

async function processCandidateProfile(page, profileUrl) {
  try {
    const cleanUrl = cleanProfileUrl(profileUrl);
    if (DB.isProfileProcessed(cleanUrl)) return;

    await page.goto(cleanUrl, { waitUntil: 'domcontentloaded', timeout: 45000 });
    await sleep(3000);

    const nameEl = await page.$('h1.text-heading-xlarge, h1');
    const name = nameEl ? (await nameEl.innerText()).trim() : 'Candidate';

    const headlineEl = await page.$('div.text-body-medium');
    const headline = headlineEl ? (await headlineEl.innerText()).trim() : '';
    const company = parseCompanyFromHeadline(headline);

    if (isTechRole(headline, config.targetKeywords)) {
      const candidate = { name, title: headline, company, profileUrl: cleanUrl };
      const compiledMsg = compileTemplate(config.messageTemplate, candidate);

      const delaySec = getRandomInt(config.delayMinSec, config.delayMaxSec);
      DB.addLog('info', `Applying safety reaction delay of ${delaySec}s before sending to ${name}...`);
      await sleep(delaySec * 1000);

      await sendReferralMessage(page, candidate, compiledMsg);
    } else {
      DB.addLog('info', `Profile ${name} (${headline}) is not a tech role match.`);
      DB.markProfileProcessed(cleanUrl, { name, status: 'SKIPPED_NOT_TECH' });
    }
  } catch (err) {
    DB.addLog('error', `Error processing candidate profile ${profileUrl}: ${err.message}`);
  }
}

function cleanProfileUrl(url) {
  if (!url) return '';
  try {
    const parsed = new URL(url, 'https://www.linkedin.com');
    return parsed.origin + parsed.pathname.replace(/\/$/, '');
  } catch (e) {
    return url.split('?')[0];
  }
}

function parseCompanyFromHeadline(headline) {
  if (!headline) return '';
  const patterns = [/@\s*([^,|]+)/, /at\s+([^,|]+)/i, /\|\s*([^,|]+)$/];
  for (const pat of patterns) {
    const match = headline.match(pat);
    if (match && match[1]) return match[1].trim();
  }
  return '';
}

function getRandomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

module.exports = {
  checkAcceptancesAndProcess
};
