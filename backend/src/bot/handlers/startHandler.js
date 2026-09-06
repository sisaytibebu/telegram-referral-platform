'use strict';

const { findOrCreateUser } = require('../../services/referral/ReferralService');
const { Requirement } = require('../../models');
const { mainMenuKeyboard, requirementsKeyboard } = require('../keyboards');
const { welcomeNew, welcomeBack } = require('../messages');
const logger = require('../../utils/logger');

const handleStart = async (bot, msg, referralCode = null) => {
  const { chat, from } = msg;

  try {
    const { user, isNew } = await findOrCreateUser(from, referralCode);

    if (user.is_banned) {
      return bot.sendMessage(chat.id, '🚫 Your account has been suspended. Contact support.');
    }

    // Load active requirements for the join buttons
    const requirements = await Requirement.findAll({
      where: { is_enabled: true },
      order: [['order_index', 'ASC']],
    });

    if (isNew) {
      // New user — show welcome + join buttons
      await bot.sendMessage(
        chat.id,
        welcomeNew(user, requirements),
        { parse_mode: 'HTML', ...requirementsKeyboard(requirements) }
      );
    } else {
      // Returning user — show main menu but also show requirements if not completed
      await bot.sendMessage(
        chat.id,
        welcomeBack(user),
        { parse_mode: 'HTML', ...mainMenuKeyboard() }
      );
    }
  } catch (err) {
    logger.error('Error in /start handler', { error: err.message, telegram_id: from?.id });
    bot.sendMessage(chat.id, '❌ Something went wrong. Please try again.');
  }
};

module.exports = { handleStart };
