# Deployment Guide

**Stack:** Railway (Backend + MySQL) + Netlify (Frontend)

---

## Architecture

```
Netlify (React frontend)
        │
        │  HTTPS API calls
        ▼
Railway (Node.js backend)  ←──→  Railway (MySQL database)
        │
        │  Telegram Webhook
        ▼
  Telegram Bot API
```

---

## Step 1 — Railway (Backend + MySQL)

### 1.1 Create a Railway account
Go to [railway.app](https://railway.app) and sign up.

### 1.2 Create a new project
- Click **New Project**
- Choose **Deploy from GitHub repo**
- Select this repository

Railway will auto-detect `railway.toml` in the root and configure the build.

### 1.3 Add MySQL database
- Inside your Railway project, click **+ New**
- Select **Database → MySQL**
- Railway will provision MySQL and inject these variables automatically:
  - `MYSQLHOST`
  - `MYSQLPORT`
  - `MYSQLDATABASE`
  - `MYSQLUSER`
  - `MYSQLPASSWORD`
  - `DATABASE_URL`

### 1.4 Set backend environment variables
In Railway → your backend service → **Variables**, add:

| Variable | Value |
|---|---|
| `NODE_ENV` | `production` |
| `DB_HOST` | `${{MySQL.MYSQLHOST}}` |
| `DB_PORT` | `${{MySQL.MYSQLPORT}}` |
| `DB_NAME` | `${{MySQL.MYSQLDATABASE}}` |
| `DB_USER` | `${{MySQL.MYSQLUSER}}` |
| `DB_PASSWORD` | `${{MySQL.MYSQLPASSWORD}}` |
| `DATABASE_URL` | `${{MySQL.DATABASE_URL}}` |
| `JWT_SECRET` | *(generate a long random string)* |
| `TELEGRAM_BOT_TOKEN` | *(from @BotFather)* |
| `TELEGRAM_BOT_USERNAME` | *(your bot username)* |
| `TELEGRAM_WEBHOOK_SECRET` | *(any random string)* |
| `NETLIFY_URL` | *(your Netlify URL — fill after Step 2)* |
| `REFERRAL_REWARD` | `0.75` |
| `MIN_WITHDRAWAL` | `10.00` |

> Tip: Railway supports reference variables like `${{MySQL.MYSQLHOST}}` — use them so credentials stay linked automatically.

### 1.5 Get your Railway backend URL
After deploy, go to **Settings → Networking → Generate Domain**.
Your URL will be: `https://your-app-name.up.railway.app`

---

## Step 2 — Netlify (Frontend)

### 2.1 Create a Netlify account
Go to [netlify.com](https://netlify.com) and sign up (free, no card).

### 2.2 Deploy from GitHub
- Click **Add new site → Import an existing project**
- Connect GitHub → select this repo
- Set these build settings:
  - **Base directory:** `frontend`
  - **Build command:** `npm run build`
  - **Publish directory:** `frontend/dist`

Netlify will auto-detect `frontend/netlify.toml` — but explicit settings override it safely.

### 2.3 Set frontend environment variables
In Netlify → **Site Settings → Environment Variables**, add:

| Variable | Value |
|---|---|
| `VITE_API_URL` | `https://your-app-name.up.railway.app/api` |

### 2.4 Update Railway CORS
Go back to Railway → backend Variables and set:

| Variable | Value |
|---|---|
| `NETLIFY_URL` | `https://your-site-name.netlify.app` |

### 2.5 Update netlify.toml API proxy
Open `frontend/netlify.toml` and replace the placeholder:

```toml
[[redirects]]
  from   = "/api/*"
  to     = "https://YOUR_RAILWAY_BACKEND_URL/api/:splat"  # ← replace this
```

With your actual Railway URL:

```toml
[[redirects]]
  from   = "/api/*"
  to     = "https://your-app-name.up.railway.app/api/:splat"
  status = 200
  force  = true
```

Commit and push — Netlify redeploys automatically.

---

## Step 3 — Set Telegram Webhook

Once Railway is live, register the webhook with Telegram.
Run this in your browser or with curl (replace the values):

```
https://api.telegram.org/bot<TELEGRAM_BOT_TOKEN>/setWebhook?url=https://your-app-name.up.railway.app/api/telegram/webhook&secret_token=<TELEGRAM_WEBHOOK_SECRET>
```

Verify it worked:
```
https://api.telegram.org/bot<TELEGRAM_BOT_TOKEN>/getWebhookInfo
```

Expected response:
```json
{
  "ok": true,
  "result": {
    "url": "https://your-app-name.up.railway.app/api/telegram/webhook",
    "has_custom_certificate": false,
    "pending_update_count": 0
  }
}
```

---

## Step 4 — Run Migrations

After Railway deploys, open a Railway shell or run via the CLI:

```bash
npm install -g @railway/cli
railway login
railway run --service your-backend-service npx sequelize-cli db:migrate
```

---

## Verify Everything Works

| Check | How |
|---|---|
| Backend health | `https://your-app-name.up.railway.app/api/health` |
| Frontend loads | Open your Netlify URL |
| DB connected | Health response shows `"database": "connected"` |
| Bot responds | Send `/start` to your Telegram bot |

---

## Local Development (unchanged)

```bash
# Terminal 1 — backend
cd backend
npm run dev

# Terminal 2 — frontend
cd frontend
npm run dev
```

Frontend at `http://localhost:5173`, backend at `http://localhost:5000`.
Vite proxy handles `/api` automatically — no env var needed locally.
