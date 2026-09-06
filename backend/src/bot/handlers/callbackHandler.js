'use strict';

const { User, Requirement } = require('../../models');
const { getReferralStats } = require('../../services/referral/ReferralService');
const { checkAllRequirements, qualifyReferralIfEligible } = require('../../services/verification/VerificationService');
const { mainMenuKeyboard, requirementsKeyboard, backToMenuKeyboard, getReferralLink } = require('../keyboards');
const { balanceMessage, verificationResult, helpMessage } = require('../messages');
const logger = require('../../utils/logger');

const handleCallback = async (bot, callbackQuery) => {
  const { data, message, from } = callbackQuery;
  const chatId = message.chat.id;

  try {
    await bot.answerCallbackQuery(callbackQuery.id);

    const user = await User.findOne({ where: { telegram_id: from.id } });
    if (!user) {
      return bot.sendMessage(chatId, '❌ Please start the bot first with /start');
    }
    if (user.is_banned) {
      return bot.sendMessage(chatId, '🚫 Your account has been suspended.');
    }

    switch (data) {
      case 'main_menu': {
        await bot.sendMessage(chatId, `👋 Welcome back, <b>${user.first_name || 'Friend'}!</b>\n\nWhat would you like to do?`, {
          parse_mode: 'HTML',
          ...mainMenuKeyboard(),
        });
        break;
      }

      case 'balance': {
        const stats = await getReferralStats(user.id);
        await bot.sendMessage(chatId, balanceMessage(user, stats), {
          parse_mode: 'HTML',
          ...backToMenuKeyboard(),
        });
        break;
      }

      case 'referral_link': {
        const link = getReferralLink(user.referral_code);
        await bot.sendMessage(chatId,
          `🔗 <b>Your Referral Link</b>\n\n<code>${link}</code>\n\nShare this link and earn <b>$0.75</b> for every verified referral!`,
          { parse_mode: 'HTML', ...backToMenuKeyboard() }
        );
        break;
      }

      case 'my_referrals': {
        const stats = await getReferralStats(user.id);
        await bot.sendMessage(chatId,
          `👥 <b>My Referrals</b>\n\n` +
          `Total: <b>${stats.total}</b>\n` +
          `✅ Rewarded: <b>${stats.rewarded}</b>\n` +
          `🎯 Qualified: <b>${stats.qualified}</b>\n` +
          `⏳ Pending: <b>${stats.pending}</b>\n\n` +
          `💰 Total Earned: <b>$${parseFloat(user.total_earned).toFixed(2)}</b>`,
          { parse_mode: 'HTML', ...backToMenuKeyboard() }
        );
        break;
      }

      case 'verify': {
        const requirements = await Requirement.findAll({
          where: { is_enabled: true },
          order: [['order_index', 'ASC']],
        });
        await bot.sendMessage(chatId,
          '📋 <b>Complete all requirements to qualify for referral rewards:</b>',
          { parse_mode: 'HTML', ...requirementsKeyboard(requirements) }
        );
        break;
      }

      case 'check_requirements': {
        await bot.sendMessage(chatId, '⏳ Checking your requirements...');
        const { results, rewarded, referral } = await qualifyReferralIfEligible(user);
        await bot.sendMessage(chatId, verificationResult(results), {
          parse_mode: 'HTML',
          ...backToMenuKeyboard(),
        });

        // Notify referrer if they just got rewarded
        if (rewarded && referral) {
          const referrer = await User.findByPk(referral.referrer_id);
          if (referrer) {
            await bot.sendMessage(referrer.telegram_id,
              `🎉 <b>Referral Reward!</b>\n\nYour referral <b>${user.first_name || 'a user'}</b> has completed all requirements!\n💰 <b>$0.75</b> has been added to your balance.\n\n💵 New balance: <b>$${parseFloat(referrer.balance).toFixed(2)}</b>`,
              { parse_mode: 'HTML' }
            );
          }
        }
        break;
      }

      case 'withdraw': {
        const balance = parseFloat(user.balance);
        const minWithdrawal = parseFloat(process.env.MIN_WITHDRAWAL || '10.00');

        if (balance < minWithdrawal) {
          await bot.sendMessage(chatId,
            `❌ <b>Insufficient Balance</b>\n\nMinimum withdrawal is <b>$${minWithdrawal.toFixed(2)}</b>\nYour balance: <b>$${balance.toFixed(2)}</b>`,
            { parse_mode: 'HTML', ...backToMenuKeyboard() }
          );
        } else {
          await bot.sendMessage(chatId,
            `💸 <b>Withdrawal</b>\n\nYour available balance: <b>$${balance.toFixed(2)}</b>\n\nTo request a withdrawal, please contact admin.\n\n<i>Automated withdrawals coming soon!</i>`,
            { parse_mode: 'HTML', ...backToMenuKeyboard() }
          );
        }
        break;
      }

      case 'stats': {
        const stats = await getReferralStats(user.id);
        await bot.sendMessage(chatId,
          `📊 <b>Your Statistics</b>\n\n` +
          `👤 Member since: <b>${user.created_at.toLocaleDateString()}</b>\n` +
          `🔗 Referral code: <code>${user.referral_code}</code>\n\n` +
          `👥 Total referrals: <b>${stats.total}</b>\n` +
          `✅ Rewarded: <b>${stats.rewarded}</b>\n` +
          `⏳ Pending: <b>${stats.pending}</b>\n\n` +
          `💰 Balance: <b>$${parseFloat(user.balance).toFixed(2)}</b>\n` +
          `📈 Total Earned: <b>$${parseFloat(user.total_earned).toFixed(2)}</b>\n` +
          `💸 Total Withdrawn: <b>$${parseFloat(user.total_withdrawn).toFixed(2)}</b>`,
          { parse_mode: 'HTML', ...backToMenuKeyboard() }
        );
        break;
      }

      case 'help': {
        await bot.sendMessage(chatId, helpMessage(), {
          parse_mode: 'HTML',
          ...backToMenuKeyboard(),
        });
        break;
      }

      default:
        logger.warn('Unknown callback data', { data });
    }
  } catch (err) {
    logger.error('Callback handler error', { data, error: err.message });
    bot.sendMessage(chatId, '❌ Something went wrong. Please try again.');
  }
};

module.exports = { handleCallback };
