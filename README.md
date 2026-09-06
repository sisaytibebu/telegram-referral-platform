# 🤖 Telegram Referral Reward Platform

A production-ready Telegram referral/reward platform.

## Stack

| Layer      | Technology                          |
|------------|-------------------------------------|
| Frontend   | React 18 + Vite + TypeScript        |
| Backend    | Node.js + Express                   |
| Database   | MySQL 8 + Sequelize ORM             |
| Bot        | Telegram Bot API (node-telegram-bot-api) |
| Auth       | JWT + Argon2                        |
| Deployment | Docker + Docker Compose             |

---

## Requirements

| Requirement | Version  |
|-------------|----------|
| Node.js     | ≥ 18.0.0 |
| npm         | ≥ 9.0.0  |
| MySQL       | ≥ 8.0    |
| Docker      | ≥ 24 (optional) |

---

## Project Structure

```
telegram-referral-platform/
├── backend/                  # Express API + Telegram bot
│   ├── src/
│   │   ├── config/           # env, database, sequelize config
│   │   ├── controllers/      # Route handlers (added in later phases)
│   │   ├── middleware/       # errorHandler, rateLimiter, auth
│   │   ├── models/           # Sequelize models (Phase 2+)
│   │   ├── routes/           # Express routers
│   │   ├── services/         # Business logic services
│   │   │   ├── telegram/
│   │   │   ├── referral/
│   │   │   ├── wallet/
│   │   │   ├── withdrawal/
│   │   │   └── youtube/
│   │   ├── bot/              # Telegram bot handler (Phase 3+)
│   │   ├── jobs/             # Scheduled jobs (Phase 6+)
│   │   ├── utils/            # logger, apiResponse helpers
│   │   ├── __tests__/        # Jest tests
│   │   ├── app.js            # Express app factory
│   │   └── server.js         # HTTP server entry point
│   ├── database/
│   │   ├── migrations/       # Sequelize migrations
│   │   └── seeders/          # Sequelize seeders
│   ├── .sequelizerc
│   ├── jest.config.js
│   └── package.json
│
├── frontend/                 # React + Vite admin dashboard
│   ├── src/
│   │   ├── pages/            # Page components
│   │   ├── services/         # API service (axios)
│   │   ├── App.tsx
│   │   └── main.tsx
│   ├── index.html
│   ├── tsconfig.json
│   └── package.json
│
├── database/
│   ├── init.sql              # Database + user creation script
│   └── schema.sql            # Full schema reference (Phase 2+)
│
├── docker/
│   ├── Dockerfile.backend
│   ├── Dockerfile.frontend
│   ├── docker-compose.yml
│   └── nginx.conf
│
├── .env.example              # Environment variable template
├── .gitignore
└── README.md
```

---

## Installation

### 1. Clone the repository

```bash
git clone <your-repo-url>
cd telegram-referral-platform
```

### 2. Configure environment variables

```bash
cp .env.example .env
```

Edit `.env` and fill in your values. At minimum for Phase 1:

```env
NODE_ENV=development
PORT=5000
DB_HOST=localhost
DB_PORT=3306
DB_NAME=telegram_referral
DB_USER=root
DB_PASSWORD=your_mysql_password
JWT_SECRET=any-long-random-string
FRONTEND_URL=http://localhost:5173
```

### 3. Create the MySQL database

Connect to MySQL as root and run:

```bash
mysql -u root -p < database/init.sql
```

Or manually:

```sql
CREATE DATABASE telegram_referral CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE DATABASE telegram_referral_test CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

### 4. Install backend dependencies

```bash
cd backend
npm install
```

### 5. Install frontend dependencies

```bash
cd frontend
npm install
```

---

## Development

### Start the backend

```bash
cd backend
npm run dev
```

The API runs at: **http://localhost:5000**

### Start the frontend

```bash
cd frontend
npm run dev
```

The app runs at: **http://localhost:5173**

> The Vite dev server proxies all `/api` requests to `http://localhost:5000` automatically.

---

## Verify Phase 1 is Working

### 1. Backend health check

```bash
curl http://localhost:5000/api/health
```

Expected response (DB connected):

```json
{
  "success": true,
  "message": "API is running",
  "data": {
    "status": "healthy",
    "services": { "database": "connected", "api": "running" },
    "environment": "development"
  }
}
```

### 2. Frontend health check page

Open **http://localhost:5173** in your browser.

The page shows:
- API status: `running`
- Database status: `connected` or `disconnected`

### 3. Run backend tests

```bash
cd backend
npm test
```

---

## Docker (Production)

```bash
# From the root directory
docker compose -f docker/docker-compose.yml up --build
```

This starts:
- MySQL on port 3306
- Backend API on port 5000
- Frontend (nginx) on port 80

---

## Environment Variables Reference

| Variable              | Required | Description                              |
|-----------------------|----------|------------------------------------------|
| NODE_ENV              | Yes      | development / production / test          |
| PORT                  | No       | API port (default: 5000)                 |
| DB_HOST               | Yes      | MySQL host                               |
| DB_PORT               | No       | MySQL port (default: 3306)               |
| DB_NAME               | Yes      | Database name                            |
| DB_USER               | Yes      | Database user                            |
| DB_PASSWORD           | Yes      | Database password                        |
| TELEGRAM_BOT_TOKEN    | Phase 3  | From @BotFather                          |
| TELEGRAM_BOT_USERNAME | Phase 3  | Your bot's username                      |
| JWT_SECRET            | Yes      | Long random string for signing JWTs      |
| YOUTUBE_API_KEY       | Phase 10 | YouTube Data API v3 key                  |
| YOUTUBE_CHANNEL_ID    | Phase 10 | Target channel ID                        |
| REFERRAL_REWARD       | No       | Reward per referral USD (default: 0.75)  |
| MIN_WITHDRAWAL        | No       | Min withdrawal USD (default: 10.00)      |
| FRONTEND_URL          | Yes      | Allowed CORS origin                      |

---

## Development Phases

| Phase | Description                          | Status      |
|-------|--------------------------------------|-------------|
| 1     | Project structure, health endpoint   | ✅ Complete  |
| 2     | Database schema & migrations         | ✅ Complete  |
| 3     | Telegram bot registration            | ✅ Complete  |
| 4     | Referral links & attribution         | ✅ Complete  |
| 5     | Telegram membership verification     | ✅ Complete  |
| 6     | Verification/qualification engine    | ✅ Complete  |
| 7     | Wallet ledger & $0.75 rewards        | ✅ Complete  |
| 8     | $10 withdrawals & admin approval     | ✅ Complete  |
| 9     | React admin dashboard                | ✅ Complete  |
| 10    | YouTube verification                 | ✅ Complete  |
| 11    | Anti-fraud protections               | ✅ Complete  |
| 12    | Automated tests                      | ✅ Complete  |
| 13    | Docker & production deployment       | ✅ Complete  |

## Live URLs

| Service | URL |
|---------|-----|
| Frontend (Vercel) | https://telegram-referral-platform-five.vercel.app |
| Backend API (Railway) | https://telegram-referral-platform-production.up.railway.app |
| Health Check | https://telegram-referral-platform-production.up.railway.app/api/health |
| Telegram Bot | https://t.me/cryptogive_awayBOT |
| Admin Dashboard | https://telegram-referral-platform-five.vercel.app/login |

## Admin Credentials (Change Immediately)

```
Username: admin
Password: Admin@1234
```
