/**
 * Rate limiting middleware.
 */
'use strict';

const rateLimit = require('express-rate-limit');
const env = require('../config/env');
const { error: apiError } = require('../utils/apiResponse');

const createLimiter = (windowMs, max, message) =>
  rateLimit({
    windowMs,
    max,
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => apiError(res, message, 429),
  });

/** General API limiter */
const apiLimiter = createLimiter(
  env.RATE_LIMIT_WINDOW_MS,
  env.RATE_LIMIT_MAX,
  'Too many requests. Please try again later.',
);

/** Strict limiter for auth routes */
const authLimiter = createLimiter(
  15 * 60 * 1000,   // 15 minutes
  20,
  'Too many authentication attempts. Please try again in 15 minutes.',
);

/** Telegram webhook — higher throughput allowed */
const webhookLimiter = createLimiter(
  60 * 1000,        // 1 minute
  300,
  'Webhook rate limit exceeded.',
);

module.exports = { apiLimiter, authLimiter, webhookLimiter };
