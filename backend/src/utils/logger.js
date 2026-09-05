/**
 * Structured Winston logger.
 * Never logs passwords, tokens, secrets, or sensitive payment data.
 */
'use strict';

const winston = require('winston');
const DailyRotateFile = require('winston-daily-rotate-file');
const path = require('path');
const env = require('../config/env');

const { combine, timestamp, printf, colorize, errors, json } = winston.format;

// ── Sensitive key scrubber ───────────────────────────────────────────────────
const SENSITIVE_KEYS = [
  'password', 'token', 'secret', 'jwt', 'authorization',
  'bot_token', 'api_key', 'apikey', 'credit_card', 'cvv',
];

const scrubSensitive = winston.format((info) => {
  const scrub = (obj) => {
    if (!obj || typeof obj !== 'object') return obj;
    const result = Array.isArray(obj) ? [] : {};
    for (const [k, v] of Object.entries(obj)) {
      const lk = k.toLowerCase();
      if (SENSITIVE_KEYS.some((s) => lk.includes(s))) {
        result[k] = '[REDACTED]';
      } else if (typeof v === 'object') {
        result[k] = scrub(v);
      } else {
        result[k] = v;
      }
    }
    return result;
  };

  if (info.meta) info.meta = scrub(info.meta);
  if (info.data) info.data = scrub(info.data);
  return info;
});

// ── Console format (development) ────────────────────────────────────────────
const devFormat = combine(
  colorize(),
  timestamp({ format: 'HH:mm:ss' }),
  errors({ stack: true }),
  printf(({ level, message, timestamp: ts, ...meta }) => {
    const extra = Object.keys(meta).length ? ` ${JSON.stringify(meta)}` : '';
    return `${ts} [${level}] ${message}${extra}`;
  }),
);

// ── JSON format (production) ─────────────────────────────────────────────────
const prodFormat = combine(
  timestamp(),
  errors({ stack: true }),
  scrubSensitive(),
  json(),
);

const logsDir = path.resolve(__dirname, '../../logs');

const transports = [
  new winston.transports.Console({
    format: env.isDevelopment() ? devFormat : prodFormat,
    silent: env.NODE_ENV === 'test',
  }),
];

if (!env.isDevelopment()) {
  transports.push(
    new DailyRotateFile({
      filename: path.join(logsDir, 'error-%DATE%.log'),
      datePattern: 'YYYY-MM-DD',
      level: 'error',
      maxFiles: '30d',
      zippedArchive: true,
      format: prodFormat,
    }),
    new DailyRotateFile({
      filename: path.join(logsDir, 'combined-%DATE%.log'),
      datePattern: 'YYYY-MM-DD',
      maxFiles: '14d',
      zippedArchive: true,
      format: prodFormat,
    }),
  );
}

const logger = winston.createLogger({
  level: env.LOG_LEVEL,
  transports,
  exitOnError: false,
});

module.exports = logger;
