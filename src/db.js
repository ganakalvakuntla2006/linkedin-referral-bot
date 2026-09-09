/**
 * 24/7 Cloud LinkedIn Bot - JSON Database Storage
 */

const fs = require('fs');
const path = require('path');

const dataDir = path.join(__dirname, '../data');
const dbPath = path.join(dataDir, 'bot_data.json');

// Ensure data folder exists
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

function loadData() {
  if (!fs.existsSync(dbPath)) {
    const initial = {
      processedProfiles: {},
      dailyTracker: { date: getTodayStr(), count: 0 },
      logs: []
    };
    fs.writeFileSync(dbPath, JSON.stringify(initial, null, 2));
    return initial;
  }
  try {
    const raw = fs.readFileSync(dbPath, 'utf8');
    return JSON.parse(raw);
  } catch (e) {
    return { processedProfiles: {}, dailyTracker: { date: getTodayStr(), count: 0 }, logs: [] };
  }
}

function saveData(data) {
  fs.writeFileSync(dbPath, JSON.stringify(data, null, 2));
}

function getTodayStr() {
  return new Date().toISOString().split('T')[0];
}

const DB = {
  isProfileProcessed(profileUrl) {
    const data = loadData();
    const cleanUrl = cleanProfileUrl(profileUrl);
    return !!data.processedProfiles[cleanUrl];
  },

  markProfileProcessed(profileUrl, details = {}) {
    const data = loadData();
    const cleanUrl = cleanProfileUrl(profileUrl);
    data.processedProfiles[cleanUrl] = {
      timestamp: new Date().toISOString(),
      ...details
    };
    saveData(data);
  },

  getDailySentCount() {
    const data = loadData();
    const today = getTodayStr();
    if (data.dailyTracker.date !== today) {
      data.dailyTracker = { date: today, count: 0 };
      saveData(data);
      return 0;
    }
    return data.dailyTracker.count;
  },

  incrementDailySentCount() {
    const data = loadData();
    const today = getTodayStr();
    if (data.dailyTracker.date !== today) {
      data.dailyTracker = { date: today, count: 1 };
    } else {
      data.dailyTracker.count += 1;
    }
    saveData(data);
    return data.dailyTracker.count;
  },

  addLog(level, message) {
    const data = loadData();
    data.logs = data.logs || [];
    data.logs.unshift({
      timestamp: new Date().toISOString(),
      level,
      message
    });
    // Keep last 200 logs
    data.logs = data.logs.slice(0, 200);
    saveData(data);
    console.log(`[${new Date().toLocaleTimeString()}] [${level.toUpperCase()}] ${message}`);
  }
};

function cleanProfileUrl(url) {
  if (!url) return '';
  try {
    const parsed = new URL(url, 'https://www.linkedin.com');
    return parsed.origin + parsed.pathname.replace(/\/$/, '');
  } catch (e) {
    return url.split('?')[0];
  }
}

module.exports = DB;
