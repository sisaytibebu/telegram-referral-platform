'use strict';

const { findOrCreateUser } = require('../../services/referral/ReferralService');
const { Requirement } = require('../../models');
const { startKeyboard, mainMenuKeyboard } = require('../keyboards');
const { welcomeNew, welcomeBack } = require('../messages');
const env = require('../../config/env');
const logger = require('../../utils/logger');

// Fallback requirements if DB is empty (ensures buttons always show)
const FALLBACK_REQUIREMENTS = [
  {
    id: 1, name: 'Join Telegram Community', type: 'TELEGRAM',
    url: 'https://t.me/+gq4chv77usE1OWZk',
    telegram_chat_id: env.TELEGRAM_CHAT_ID_1 || '-1004418005232',
    is_enabled: true, order_index: 1,
  },
  {
    id: 2, name: 'Join Telegram Group', type: 'TELEGRAM',
    url: 'https://t.me/+cvl2ct83eeRiNTI0',
    telegram_chat_id: env.TELEGRAM_CHAT_ID_2 || '-1003920921797',
    is_enabled: true, order_index: 2,
  },
  {
    id: 3, name: 'Subscribe YouTube Channel', type: 'YOUTUBE',
    url: 'https://www.youtube.com/channel/UCkaUxs6oOUGHD8eG2VGrRgw',
    telegram_chat_id: null, is_enabled: true, order_index: 3,
  },
];

const getRequirements = async () => {
  try {
    const reqs = await Requirement.findAll({
      where: { is_enabled: true },
      order: [['order_index', 'ASC']],
    });
    // If DB has requirements, use them. Otherwise use fallback.
    return reqs.length > 0 ? reqs : FALLBACK_REQUIREMENTS;
  } catch (e) {
    logger.warn('Could not load requirements from DB, using fallback', { error: e.message });
    return FALLBACK_REQUIREMENTS;
  }
};

const handleStart = async (bot, msg, referralCode = null) => {
  const { chat, from } = msg;

  try {
    const { user, isNew } = await findOrCreateUser(from, referralCode);

    if (user.is_banned) {
      return bot.sendMessage(chat.id, '🚫 Your account has been suspended.');
    }

    const requirements = await getRequirements();

    if (isNew) {
      await bot.sendMessage(
        chat.id,
        welcomeNew(user, requirements),
        { parse_mode: 'HTML', ...startKeyboard(requirements) }
      );
    } else {
      await user.reload();
      await bot.sendMessage(
        chat.id,
        welcomeBack(user),
        { parse_mode: 'HTML', ...mainMenuKeyboard() }
      );
    }
  } catch (err) {
    logger.error('/start error', { error: err.message, telegram_id: from?.id });
    await bot.sendMessage(chat.id, '❌ Something went wrong. Please try /start again.');
  }
};

module.exports = { handleStart, getRequirements, FALLBACK_REQUIREMENTS };
