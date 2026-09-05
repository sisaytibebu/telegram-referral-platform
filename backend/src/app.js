/**
 * Express application factory.
 * Separated from server.js so the app can be imported in tests.
 */
'use strict';

const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const morgan = require('morgan');

const env = require('./config/env');
const logger = require('./utils/logger');
const apiRouter = require('./routes/index');
const { errorHandler, notFoundHandler } = require('./middleware/errorHandler');
const { apiLimiter } = require('./middleware/rateLimiter');

const app = express();

// ── Security headers ─────────────────────────────────────────────────────────
app.use(helmet());

// ── CORS ─────────────────────────────────────────────────────────────────────
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (e.g. curl, Postman, Telegram webhook)
      if (!origin) return callback(null, true);

      const allowed = new Set([
        env.FRONTEND_URL,
        process.env.NETLIFY_URL,
        'http://localhost:5173',
        'http://localhost:3000',
      ].filter(Boolean));

      // Also allow any *.netlify.app subdomain (preview deploys)
      const isNetlifyPreview = /^https:\/\/[a-z0-9-]+\.netlify\.app$/.test(origin);

      if (allowed.has(origin) || isNetlifyPreview) return callback(null, true);
      logger.warn('CORS blocked request', { origin });
      return callback(new Error('Not allowed by CORS'));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  }),
);

// ── Body parsing ─────────────────────────────────────────────────────────────
// Telegram webhook needs raw body for signature validation — register before json()
app.use(
  '/api/telegram/webhook',
  express.raw({ type: 'application/json' }),
);
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

// ── HTTP request logging ──────────────────────────────────────────────────────
if (env.NODE_ENV !== 'test') {
  app.use(
    morgan(env.isDevelopment() ? 'dev' : 'combined', {
      stream: { write: (msg) => logger.http(msg.trim()) },
    }),
  );
}

// ── Rate limiting ─────────────────────────────────────────────────────────────
app.use('/api', apiLimiter);

// ── Routes ───────────────────────────────────────────────────────────────────
app.use('/api', apiRouter);

// ── 404 & error handlers ─────────────────────────────────────────────────────
app.use(notFoundHandler);
app.use(errorHandler);

module.exports = app;
