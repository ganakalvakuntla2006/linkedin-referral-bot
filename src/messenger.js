/**
 * 24/7 Cloud LinkedIn Bot - Automated Chat Messenger
 */

const DB = require('./db');
const config = require('./config');
const { sendTelegramNotification } = require('./notifier');

async function sendReferralMessage(page, candidate, compiledMessage) {
  try {
    DB.addLog('info', `Opening profile page for ${candidate.name} (${candidate.profileUrl})`);
    
    await page.goto(candidate.profileUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await sleep(2000);

    // Look for Message button on profile page
    const messageBtnSelector = 'button.entry-point, button[aria-label*="Message"], button.message-anyway-button';
    const messageBtn = await page.$(messageBtnSelector);

    if (!messageBtn) {
      DB.addLog('warning', `Could not find Message button on profile page for ${candidate.name}`);
      return false;
    }

    await messageBtn.click();
    await sleep(2500);

    // Find contenteditable message input container
    const inputSelector = 'div.msg-form__contenteditable[contenteditable="true"], div.msg-selectable-textbox div[contenteditable="true"]';
    await page.waitForSelector(inputSelector, { timeout: 10000 });

    const chatInput = await page.$(inputSelector);
    if (!chatInput) {
      DB.addLog('warning', `Chat input box did not open for ${candidate.name}`);
      return false;
    }

    await chatInput.focus();
    await sleep(500);

    // Fill message naturally
    await page.keyboard.type(compiledMessage, { delay: 30 });
    await sleep(1500);

    // Locate send button
    const sendBtnSelector = 'button.msg-form__send-button, button[type="submit"].msg-form__send-btn';
    const sendBtn = await page.$(sendBtnSelector);

    if (sendBtn) {
      await sendBtn.click();
      await sleep(2000);

      // Record transaction
      DB.markProfileProcessed(candidate.profileUrl, {
        name: candidate.name,
        company: candidate.company,
        title: candidate.title,
        status: 'SENT'
      });
      DB.incrementDailySentCount();

      const successLog = `Referral message sent to ${candidate.name} (${candidate.company || 'Tech Company'}) right after connection acceptance!`;
      DB.addLog('success', successLog);

      // Send Telegram Alert to phone if configured
      await sendTelegramNotification(`🚀 <b>LinkedIn Referral Sent!</b>\n\n<b>Name:</b> ${candidate.name}\n<b>Title:</b> ${candidate.title}\n<b>Company:</b> ${candidate.company || 'N/A'}\n\n<i>Message:</i>\n"${compiledMessage}"`);

      return true;
    } else {
      DB.addLog('warning', `Send button disabled or not found for ${candidate.name}`);
      return false;
    }
  } catch (err) {
    DB.addLog('error', `Failed to send referral message to ${candidate.name}: ${err.message}`);
    return false;
  }
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

module.exports = {
  sendReferralMessage
};
