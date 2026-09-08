const path = require('path');
try {
  require('dotenv').config({ path: path.join(__dirname, '../.env') });
} catch (e) {
  // dotenv package not installed locally yet
}

const DEFAULT_KEYWORDS = [
  "software engineer", "software development engineer", "sde", "swe",
  "engineering", "software", "developer", "mts", "member of technical staff",
  "frontend", "backend", "full stack", "fullstack", "devops",
  "data engineer", "tech lead", "engineering manager", "sre", "cse"
];

function parseKeywords(envStr) {
  if (!envStr) return DEFAULT_KEYWORDS;
  return envStr.split(',').map(k => k.trim().toLowerCase()).filter(Boolean);
}

module.exports = {
  liAtCookie: process.env.LINKEDIN_LI_AT_COOKIE || '',
  pollIntervalMinutes: parseInt(process.env.POLL_INTERVAL_MINUTES, 10) || 2,
  dailyLimit: parseInt(process.env.DAILY_MESSAGE_LIMIT, 10) || 15,
  delayMinSec: parseInt(process.env.SAFETY_DELAY_MIN_SEC, 10) || 45,
  delayMaxSec: parseInt(process.env.SAFETY_DELAY_MAX_SEC, 10) || 90,
  telegramToken: process.env.TELEGRAM_BOT_TOKEN || '',
  telegramChatId: process.env.TELEGRAM_CHAT_ID || '',
  targetKeywords: parseKeywords(process.env.TARGET_KEYWORDS),
  messageTemplate: process.env.MESSAGE_TEMPLATE || `Hi {firstName}, I’m Gana, a fourth-year student at IIITL. I recently completed my internship at Google.

I wanted to ask if you could refer me internally at {company} for any suitable Software Engineering opportunities. I’d really appreciate your help. Thank you!`
};
