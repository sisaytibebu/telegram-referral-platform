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
      return bot.sendMessage(chat.id, '🚫 Your account has been suspended.');
    }

    if (isNew) {
      // Show requirements for new users
      const requirements = await Requirement.findAll({
        where: { is_enabled: true },
        order: [['order_index', 'ASC']],
      });

      await bot.sendMessage(
        chat.id,
        welcomeNew(user, requirements),
        { parse_mode: 'HTML', ...requirementsKeyboard(requirements) }
      );
    } else {
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
