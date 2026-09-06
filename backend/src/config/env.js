/**
 * Centralised environment configuration.
 * All process.env access should go through this module.
 */
'use strict';

require('dotenv').config({ path: require('path').resolve(__dirname, '../../..', '.env') });

const required = (key) => {
  const value = process.env[key];
  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
};

const optional = (key, defaultValue = '') => process.env[key] || defaultValue;

module.exports = {
  NODE_ENV: optional('NODE_ENV', 'development'),
  PORT: parseInt(optional('PORT', '5000'), 10),

  // Database
  DB_HOST: optional('DB_HOST', 'localhost'),
  DB_PORT: parseInt(optional('DB_PORT', '3306'), 10),
  DB_NAME: optional('DB_NAME', 'telegram_referral'),
  DB_USER: optional('DB_USER', 'root'),
  DB_PASSWORD: optional('DB_PASSWORD', ''),
  DATABASE_URL: optional('DATABASE_URL'),

  // Telegram
  TELEGRAM_BOT_TOKEN: optional('TELEGRAM_BOT_TOKEN'),
  TELEGRAM_BOT_USERNAME: optional('TELEGRAM_BOT_USERNAME', 'cryptogive_awayBOT'),
  TELEGRAM_WEBHOOK_SECRET: optional('TELEGRAM_WEBHOOK_SECRET'),
  TELEGRAM_CHAT_ID_1: optional('TELEGRAM_CHAT_ID_1'),   // Numeric ID of group 1
  TELEGRAM_CHAT_ID_2: optional('TELEGRAM_CHAT_ID_2'),   // Numeric ID of group 2

  // JWT
  JWT_SECRET: optional('JWT_SECRET', 'change-me-in-production'),
  JWT_EXPIRES_IN: optional('JWT_EXPIRES_IN', '7d'),

  // YouTube
  YOUTUBE_API_KEY: optional('YOUTUBE_API_KEY'),
  YOUTUBE_CHANNEL_ID: optional('YOUTUBE_CHANNEL_ID'),

  // Business rules (stored as strings to avoid float issues; parse at usage)
  REFERRAL_REWARD: optional('REFERRAL_REWARD', '0.75'),
  MIN_WITHDRAWAL: optional('MIN_WITHDRAWAL', '10.00'),

  // CORS
  FRONTEND_URL: optional('FRONTEND_URL', 'http://localhost:5173'),
  NETLIFY_URL: optional('NETLIFY_URL', ''),

  // Rate limiting
  RATE_LIMIT_WINDOW_MS: parseInt(optional('RATE_LIMIT_WINDOW_MS', '900000'), 10),
  RATE_LIMIT_MAX: parseInt(optional('RATE_LIMIT_MAX', '100'), 10),

  // Logging
  LOG_LEVEL: optional('LOG_LEVEL', 'info'),

  isProduction() {
    return this.NODE_ENV === 'production';
  },

  isDevelopment() {
    return this.NODE_ENV === 'development';
  },
};
