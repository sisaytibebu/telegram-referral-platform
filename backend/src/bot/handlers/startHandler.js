'use strict';

const { findOrCreateUser } = require('../../services/referral/ReferralService');
const { Requirement } = require('../../models');
const { startKeyboard, mainMenuKeyboard } = require('../keyboards');
const { welcomeNew, welcomeBack } = require('../messages');
const logger = require('../../utils/logger');

const handleStart = async (bot, msg, referralCode = null) => {
  const { chat, from } = msg;

  try {
    const { user, isNew } = await findOrCreateUser(from, referralCode);

    if (user.is_banned) {
      return bot.sendMessage(chat.id, '🚫 Your account has been suspended.');
    }

    const requirements = await Requirement.findAll({
      where: { is_enabled: true },
      order: [['order_index', 'ASC']],
    });

    if (isNew) {
      // New user — welcome message + join buttons + main menu + help
      await bot.sendMessage(
        chat.id,
        welcomeNew(user, requirements),
        { parse_mode: 'HTML', ...startKeyboard(requirements) }
      );
    } else {
      // Returning user — brief welcome + main menu
      await bot.sendMessage(
        chat.id,
        welcomeBack(user),
        { parse_mode: 'HTML', ...mainMenuKeyboard() }
      );
    }
  } catch (err) {
    logger.error('/start error', { error: err.message, telegram_id: from?.id });
    bot.sendMessage(chat.id, '❌ Something went wrong. Please try again.');
  }
};

module.exports = { handleStart };
