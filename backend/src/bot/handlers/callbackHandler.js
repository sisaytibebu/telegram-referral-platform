'use strict';

const { User, Requirement } = require('../../models');
const { getReferralStats } = require('../../services/referral/ReferralService');
const { qualifyReferralIfEligible } = require('../../services/verification/VerificationService');
const {
  mainMenuKeyboard,
  requirementsKeyboard,
  backToMenuKeyboard,
  getReferralLink,
} = require('../keyboards');
const {
  balanceMessage,
  verificationResult,
  referrerRewardNotification,
  helpMessage,
} = require('../messages');
const logger = require('../../utils/logger');

const handleCallback = async (bot, callbackQuery) => {
  const { data, message, from } = callbackQuery;
  const chatId = message.chat.id;

  try {
    // Acknowledge the button press (removes loading spinner)
    await bot.answerCallbackQuery(callbackQuery.id);

    const user = await User.findOne({ where: { telegram_id: from.id } });
    if (!user) {
      return bot.sendMessage(chatId, '❌ Please send /start first.');
    }
    if (user.is_banned) {
      return bot.sendMessage(chatId, '🚫 Your account has been suspended.');
    }

    switch (data) {

      // ── Main Menu ───────────────────────────────────────────────────────────
      case 'main_menu': {
        const { welcomeBack } = require('../messages');
        await bot.sendMessage(
          chatId,
          welcomeBack(user),
          { parse_mode: 'HTML', ...mainMenuKeyboard() }
        );
        break;
      }

      // ── Balance ─────────────────────────────────────────────────────────────
      case 'balance': {
        const stats = await getReferralStats(user.id);
        // Reload user to get fresh balance
        await user.reload();
        await bot.sendMessage(chatId, balanceMessage(user, stats), {
          parse_mode: 'HTML',
          ...backToMenuKeyboard(),
        });
        break;
      }

      // ── Referral Link ────────────────────────────────────────────────────────
      case 'referral_link': {
        const link = getReferralLink(user.referral_code);
        await bot.sendMessage(chatId,
          `👥 <b>Refer &amp; Earn Program</b>\n\n` +
          `🚀 Invite friends and earn limitless crypto!\n\n` +
          `🎁 You will receive <b>$0.75 USDT</b> for every valid user who joins through your link.\n\n` +
          `🔗 <b>Your Exclusive Referral Link:</b>\n<code>${link}</code>\n\n` +
          `📢 Share this link with your network and start earning!`,
          { parse_mode: 'HTML', ...backToMenuKeyboard() }
        );
        break;
      }

      // ── My Referrals ─────────────────────────────────────────────────────────
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

      // ── Verify — show join buttons ────────────────────────────────────────────
      case 'verify': {
        const requirements = await Requirement.findAll({
          where: { is_enabled: true },
          order: [['order_index', 'ASC']],
        });
        await bot.sendMessage(chatId,
          `📋 <b>Complete all 3 requirements to qualify:</b>\n\n` +
          `👇 Click each button to join, then press <b>✅ Check Requirements</b>`,
          { parse_mode: 'HTML', ...requirementsKeyboard(requirements) }
        );
        break;
      }

      // ── Check Requirements ───────────────────────────────────────────────────
      case 'check_requirements': {
        await bot.sendMessage(chatId, '⏳ Checking your requirements...');

        const { results, rewarded, referral } = await qualifyReferralIfEligible(user);

        const resultText = verificationResult(results);

        // If not all verified — show join buttons again below the result
        const allDone = results.every((r) => r.verified);
        if (allDone) {
          await bot.sendMessage(chatId, resultText, {
            parse_mode: 'HTML',
            ...mainMenuKeyboard(),
          });
        } else {
          const requirements = await Requirement.findAll({
            where: { is_enabled: true },
            order: [['order_index', 'ASC']],
          });
          await bot.sendMessage(chatId, resultText, {
            parse_mode: 'HTML',
            ...requirementsKeyboard(requirements),
          });
        }

        // Notify referrer if they just got rewarded
        if (rewarded && referral) {
          const referrer = await User.findByPk(referral.referrer_id);
          if (referrer) {
            await referrer.reload();
            try {
              await bot.sendMessage(
                referrer.telegram_id,
                referrerRewardNotification(user, referrer.balance),
                { parse_mode: 'HTML' }
              );
            } catch (e) {
              // User may have blocked the bot — not fatal
              logger.warn('Could not notify referrer', { referrer_id: referrer.id });
            }
          }
        }
        break;
      }

      // ── Withdraw ─────────────────────────────────────────────────────────────
      case 'withdraw': {
        await user.reload();
        const balance = parseFloat(user.balance);
        const minWithdrawal = parseFloat(process.env.MIN_WITHDRAWAL || '10.00');

        if (balance < minWithdrawal) {
          await bot.sendMessage(chatId,
            `❌ <b>Insufficient Balance</b>\n\n` +
            `Minimum withdrawal: <b>$${minWithdrawal.toFixed(2)}</b>\n` +
            `Your balance: <b>$${balance.toFixed(2)}</b>\n\n` +
            `Keep sharing your referral link to earn more! 🚀`,
            { parse_mode: 'HTML', ...backToMenuKeyboard() }
          );
        } else {
          await bot.sendMessage(chatId,
            `💸 <b>Withdrawal Request</b>\n\n` +
            `Your available balance: <b>$${balance.toFixed(2)}</b>\n\n` +
            `To request a withdrawal, please contact admin or use /withdraw command with your payment details.\n\n` +
            `Minimum withdrawal: <b>$${minWithdrawal.toFixed(2)}</b>`,
            { parse_mode: 'HTML', ...backToMenuKeyboard() }
          );
        }
        break;
      }

      // ── Statistics ───────────────────────────────────────────────────────────
      case 'stats': {
        const stats = await getReferralStats(user.id);
        await user.reload();
        await bot.sendMessage(chatId,
          `📊 <b>Your Statistics</b>\n\n` +
          `👤 Member since: <b>${new Date(user.created_at).toLocaleDateString()}</b>\n` +
          `🔑 Referral code: <code>${user.referral_code}</code>\n\n` +
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

      // ── Help ─────────────────────────────────────────────────────────────────
      case 'help': {
        await bot.sendMessage(chatId, helpMessage(), {
          parse_mode: 'HTML',
          ...backToMenuKeyboard(),
        });
        break;
      }

      default:
        logger.warn('Unknown callback data', { data, user_id: user.id });
    }
  } catch (err) {
    logger.error('Callback handler error', { data, error: err.message, stack: err.stack });
    try {
      await bot.sendMessage(chatId, '❌ Something went wrong. Please try again.');
    } catch (e) { /* ignore */ }
  }
};

module.exports = { handleCallback };
