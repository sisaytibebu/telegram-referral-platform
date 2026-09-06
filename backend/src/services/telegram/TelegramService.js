'use strict';

const TelegramBot = require('node-telegram-bot-api');
const env = require('../../config/env');
const logger = require('../../utils/logger');

let botInstance = null;

/**
 * Get or create the singleton bot instance.
 */
const getBot = () => {
  if (!botInstance) {
    if (!env.TELEGRAM_BOT_TOKEN) {
      logger.warn('TELEGRAM_BOT_TOKEN not set — bot disabled');
      return null;
    }

    const options = env.isProduction()
      ? { webHook: { port: env.PORT } }
      : { polling: true };

    botInstance = new TelegramBot(env.TELEGRAM_BOT_TOKEN, options);
    logger.info('Telegram bot initialised', { mode: env.isProduction() ? 'webhook' : 'polling' });
  }
  return botInstance;
};

/**
 * Check if a Telegram user is a member of a chat.
 * Returns true if member/admin/creator, false otherwise.
 */
const checkMembership = async (chatId, telegramUserId) => {
  const bot = getBot();
  if (!bot) return false;
  if (!chatId || chatId === 'REPLACE_WITH_CHAT_ID_1' || chatId === 'REPLACE_WITH_CHAT_ID_2') {
    logger.warn('Chat ID not configured', { chatId });
    return false;
  }

  try {
    const member = await bot.getChatMember(chatId, telegramUserId);
    const validStatuses = ['creator', 'administrator', 'member'];
    return validStatuses.includes(member.status);
  } catch (err) {
    logger.warn('Membership check failed', { chatId, telegramUserId, error: err.message });
    return false;
  }
};

/**
 * Send a message to a user.
 */
const sendMessage = async (chatId, text, options = {}) => {
  const bot = getBot();
  if (!bot) return;
  try {
    return await bot.sendMessage(chatId, text, { parse_mode: 'HTML', ...options });
  } catch (err) {
    logger.error('Failed to send message', { chatId, error: err.message });
  }
};

module.exports = { getBot, checkMembership, sendMessage };
