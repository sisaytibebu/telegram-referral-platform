'use strict';

const { Router } = require('express');
const { getBot } = require('../services/telegram/TelegramService');
const { webhookLimiter } = require('../middleware/rateLimiter');
const env = require('../config/env');
const logger = require('../utils/logger');

const router = Router();

/**
 * POST /api/telegram/webhook
 * Receives updates from Telegram in production (webhook mode).
 */
router.post('/webhook', webhookLimiter, (req, res) => {
  // Validate webhook secret
  const secret = req.headers['x-telegram-bot-api-secret-token'];
  if (env.TELEGRAM_WEBHOOK_SECRET && secret !== env.TELEGRAM_WEBHOOK_SECRET) {
    logger.warn('Invalid webhook secret', { ip: req.ip });
    return res.sendStatus(401);
  }

  const bot = getBot();
  if (!bot) return res.sendStatus(200);

  try {
    // node-telegram-bot-api processes the update
    const body = Buffer.isBuffer(req.body) ? JSON.parse(req.body.toString()) : req.body;
    bot.processUpdate(body);
    return res.sendStatus(200);
  } catch (err) {
    logger.error('Webhook processing error', { message: err.message });
    return res.sendStatus(200); // Always 200 to Telegram
  }
});

module.exports = router;
