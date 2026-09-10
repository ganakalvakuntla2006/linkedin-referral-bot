# 24/7 Real-Time Cloud LinkedIn Auto-Referral Bot

Automated Node.js & Playwright service that continuously checks LinkedIn for accepted connection requests 24/7 in real-time, filters for Software Engineering professionals, and dispatches personalized referral messages—even when your laptop is turned off.

---

## 🛠️ Local Setup & Configuration

### 1. Extract Your LinkedIn Session Cookie (`li_at`)
1. Open [LinkedIn](https://www.linkedin.com) in Google Chrome.
2. Press `F12` to open Developer Tools.
3. Click **Application** tab -> **Cookies** -> `https://www.linkedin.com`.
4. Locate the cookie named **`li_at`** and copy its string value.

### 2. Configure Environment Variables
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```
Edit `.env` with your values:
```env
LINKEDIN_LI_AT_COOKIE=your_copied_li_at_cookie_value
POLL_INTERVAL_MINUTES=2
DAILY_MESSAGE_LIMIT=15
SAFETY_DELAY_MIN_SEC=45
SAFETY_DELAY_MAX_SEC=90

# Optional Telegram phone alert setup
TELEGRAM_BOT_TOKEN=
TELEGRAM_CHAT_ID=

MESSAGE_TEMPLATE="Hi {firstName},\n\nThanks for connecting! I noticed you work as {title} at {company}. I am actively looking for Software Engineering roles and was wondering if you would be open to referring me for open positions at {company}?\n\nI'd be happy to share my resume. Thanks a lot!"
```

---

## 🏃 Running the Bot

### Run Once (Testing Mode)
```bash
npm run scan
```

### Run 24/7 Background Loop (Local / Server)
```bash
npm start
```

---

## ☁️ Free Cloud Deployment Options (No Laptop Required!)

### Option A: Deploy to Render.com (Free Background Worker)
1. Push this project folder to your GitHub repository.
2. Go to [Render.com](https://render.com) and create a **Background Worker**.
3. Connect your GitHub repository.
4. Set Build Command: `npm install && npx playwright install-deps && npx playwright install chromium`
5. Set Start Command: `npm start`
6. Add Environment Variables (`LINKEDIN_LI_AT_COOKIE`, `MESSAGE_TEMPLATE`, etc.) under Render dashboard.

### Option B: Deploy to GitHub Actions (Free Scheduled Cron)
Create `.github/workflows/referral-bot.yml`:
```yaml
name: LinkedIn 24/7 Auto-Referral Bot

on:
  schedule:
    - cron: '*/5 * * * *' # Runs every 5 minutes
  workflow_dispatch:

jobs:
  run-bot:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '20'
      - name: Install Dependencies
        run: |
          npm install
          npx playwright install --with-deps chromium
      - name: Run Referral Bot Scan
        env:
          LINKEDIN_LI_AT_COOKIE: ${{ secrets.LINKEDIN_LI_AT_COOKIE }}
          TELEGRAM_BOT_TOKEN: ${{ secrets.TELEGRAM_BOT_TOKEN }}
          TELEGRAM_CHAT_ID: ${{ secrets.TELEGRAM_CHAT_ID }}
        run: npm run scan
```
Add `LINKEDIN_LI_AT_COOKIE` in your GitHub Repository Settings -> Secrets -> Actions.

---

## 📱 Telegram Phone Alerts Setup (Optional)
To receive an instant alert on your phone whenever a referral message is sent:
1. Open Telegram app and search for `@BotFather`.
2. Send `/newbot` and follow prompts to get your `TELEGRAM_BOT_TOKEN`.
3. Start a chat with your bot or `@userinfobot` to get your numeric `TELEGRAM_CHAT_ID`.
4. Add both keys to your `.env` file!
