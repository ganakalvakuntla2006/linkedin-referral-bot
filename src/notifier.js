/**
 * 24/7 Cloud LinkedIn Bot - Telegram / Webhook Phone Notifier
 */

const https = require('https');
const config = require('./config');

async function sendTelegramNotification(message) {
  if (!config.telegramToken || !config.telegramChatId) {
    return false;
  }

  const url = `https://api.telegram.org/bot${config.telegramToken}/sendMessage`;
  const data = JSON.stringify({
    chat_id: config.telegramChatId,
    text: message,
    parse_mode: 'HTML'
  });

  return new Promise((resolve) => {
    try {
      const parsedUrl = new URL(url);
      const options = {
        hostname: parsedUrl.hostname,
        path: parsedUrl.pathname + parsedUrl.search,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(data)
        }
      };

      const req = https.request(options, (res) => {
        resolve(res.statusCode === 200);
      });

      req.on('error', (e) => {
        console.error('Telegram notification error:', e.message);
        resolve(false);
      });

      req.write(data);
      req.end();
    } catch (e) {
      console.error('Telegram URL error:', e.message);
      resolve(false);
    }
  });
}

module.exports = {
  sendTelegramNotification
};
