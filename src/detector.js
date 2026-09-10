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

  // Step 1: Scan Notifications page for instant "accepted your invitation to connect"
  try {
    DB.addLog('info', 'Scanning LinkedIn notifications stream...');
    await page.goto('https://www.linkedin.com/notifications/', { waitUntil: 'domcontentloaded', timeout: 45000 });
    await sleep(3000);

    const notificationItems = await page.$$('.nt-card, article.nt-card, div.notification-item');
    for (const card of notificationItems) {
      const textContent = await card.innerText().catch(() => '');

      if (textContent.toLowerCase().includes('accepted your invitation to connect')) {
        const linkEl = await card.$('a[href*="/in/"]');
        if (linkEl) {
          const profileUrl = await linkEl.getAttribute('href');
          if (profileUrl && !DB.isProfileProcessed(profileUrl)) {
            DB.addLog('info', `Real-time acceptance notification detected: ${profileUrl}`);
            await processCandidateProfile(page, profileUrl);
          }
        }
      }
    }
  } catch (err) {
    DB.addLog('warning', `Notifications scan note: ${err.message}`);
  }

  // Step 2: Scan Connections page as fallback
  try {
    DB.addLog('info', 'Scanning LinkedIn connections list...');
    await page.goto('https://www.linkedin.com/mynetwork/invite-connect/connections/', { waitUntil: 'domcontentloaded', timeout: 45000 });
    await sleep(3000);

    const connectionCards = await page.$$('.mn-connection-card, li.mn-connection-card, div.entity-result__item');
    DB.addLog('info', `Found ${connectionCards.length} connections on LinkedIn connections page.`);

    for (const card of connectionCards) {
      const linkEl = await card.$('a.mn-connection-card__link, a.app-aware-link[href*="/in/"]');
      if (!linkEl) continue;

      const profileUrl = await linkEl.getAttribute('href');
      if (!profileUrl || DB.isProfileProcessed(profileUrl)) continue;

      const nameEl = await card.$('.mn-connection-card__name, .entity-result__title-text a');
      const name = nameEl ? (await nameEl.innerText()).trim() : '';

      const headlineEl = await card.$('.mn-connection-card__occupation, .entity-result__primary-subtitle');
      const headline = headlineEl ? (await headlineEl.innerText()).trim() : '';

      const companyEl = await card.$('.entity-result__secondary-subtitle');
      const company = companyEl ? (await companyEl.innerText()).trim() : parseCompanyFromHeadline(headline);

      if (isTechRole(headline, config.targetKeywords)) {
        DB.addLog('info', `Accepted connection matched Tech Role: ${name} (${headline})`);

        const candidate = { name, title: headline, company, profileUrl };
        const compiledMsg = compileTemplate(config.messageTemplate, candidate);

        // Safety Delay before sending
        const delaySec = getRandomInt(config.delayMinSec, config.delayMaxSec);
        DB.addLog('info', `Applying safety reaction delay of ${delaySec}s before sending to ${name}...`);
        await sleep(delaySec * 1000);

        await sendReferralMessage(page, candidate, compiledMsg);
      } else {
        DB.addLog('info', `Connection ${name} (${headline}) accepted request, but is not a tech role match. Marking skipped.`);
        DB.markProfileProcessed(profileUrl, { name, status: 'SKIPPED_NOT_TECH' });
      }
    }
  } catch (err) {
    DB.addLog('warning', `Connections list scan note: ${err.message}`);
  }
}

async function processCandidateProfile(page, profileUrl) {
  try {
    await page.goto(profileUrl, { waitUntil: 'domcontentloaded', timeout: 45000 });
    await sleep(3000);

    const nameEl = await page.$('h1.text-heading-xlarge, h1');
    const name = nameEl ? (await nameEl.innerText()).trim() : 'Candidate';

    const headlineEl = await page.$('div.text-body-medium');
    const headline = headlineEl ? (await headlineEl.innerText()).trim() : '';
    const company = parseCompanyFromHeadline(headline);

    if (isTechRole(headline, config.targetKeywords)) {
      const candidate = { name, title: headline, company, profileUrl };
      const compiledMsg = compileTemplate(config.messageTemplate, candidate);

      const delaySec = getRandomInt(config.delayMinSec, config.delayMaxSec);
      DB.addLog('info', `Applying safety reaction delay of ${delaySec}s before sending to ${name}...`);
      await sleep(delaySec * 1000);

      await sendReferralMessage(page, candidate, compiledMsg);
    } else {
      DB.addLog('info', `Profile ${name} (${headline}) is not a tech role match.`);
      DB.markProfileProcessed(profileUrl, { name, status: 'SKIPPED_NOT_TECH' });
    }
  } catch (err) {
    DB.addLog('error', `Error processing candidate profile ${profileUrl}: ${err.message}`);
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
