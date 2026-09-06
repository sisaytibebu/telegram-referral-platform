'use strict';

const { User, Requirement, Referral } = require('../../models');
const { getReferralStats } = require('../../services/referral/ReferralService');
const { qualifyReferralIfEligible } = require('../../services/verification/VerificationService');
const {
  mainMenuKeyboard,
  backToMenuKeyboard,
  verifyKeyboard,
  getReferralLink,
} = require('../keyboards');
const {
  welcomeBack,
  balanceMessage,
  myReferralsMessage,
  verificationResult,
  referrerRewardNotification,
  helpMessage,
} = require('../messages');
const logger = require('../../utils/logger');

const handleCallback = async (bot, callbackQuery) => {
  const { data, message, from } = callbackQuery;
  const chatId = message.chat.id;

  try {
    await bot.answerCallbackQuery(callbackQuery.id);

    const user = await User.findOne({ where: { telegram_id: from.id } });
    if (!user) {
      return bot.sendMessage(chatId, '❌ Please send /start first.');
    }
    if (user.is_banned) {
      return bot.sendMessage(chatId, '🚫 Your account has been suspended.');
    }

    switch (data) {

      // ── Main Menu ─────────────────────────────────────────────────────────────
      case 'main_menu': {
        await user.reload();
        await bot.sendMessage(chatId, welcomeBack(user), {
          parse_mode: 'HTML',
          ...mainMenuKeyboard(),
        });
        break;
      }

      // ── Balance ───────────────────────────────────────────────────────────────
      case 'balance': {
        await user.reload();
        const stats = await getReferralStats(user.id);
        await bot.sendMessage(chatId, balanceMessage(user, stats), {
          parse_mode: 'HTML',
          ...backToMenuKeyboard(),
        });
        break;
      }

      // ── My Referrals ──────────────────────────────────────────────────────────
      case 'my_referrals': {
        await user.reload();
        const stats = await getReferralStats(user.id);
        const referralList = await Referral.findAll({
          where: { referrer_id: user.id },
          include: [{ model: User, as: 'referred_user', attributes: ['first_name', 'username'] }],
          order: [['created_at', 'DESC']],
          limit: 10,
        });
        await bot.sendMessage(chatId, myReferralsMessage(user, stats, referralList), {
          parse_mode: 'HTML',
          ...backToMenuKeyboard(),
        });
        break;
      }

      // ── My Referral Link ──────────────────────────────────────────────────────
      case 'referral_link': {
        const link = getReferralLink(user.referral_code);
        const stats = await getReferralStats(user.id);
        await bot.sendMessage(chatId,
          `🔗 <b>Your Referral Link</b>\n\n` +
          `<code>${link}</code>\n\n` +
          `👆 Tap link above to copy it!\n\n` +
          `━━━━━━━━━━━━━━━━━━━\n` +
          `📢 <b>Refer &amp; Earn Program</b>\n\n` +
          `💰 Earn <b>$0.75 USDT</b> for every friend who:\n` +
          `✅ Joins both Telegram channels\n` +
          `✅ Subscribes to YouTube\n\n` +
          `👥 Your referrals so far: <b>${stats.total}</b>\n` +
          `✅ Successful: <b>${stats.rewarded}</b>\n` +
          `💵 Earned: <b>$${parseFloat(user.total_earned).toFixed(2)}</b>`,
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
          `📋 <b>Requirements</b>\n\n` +
          `Complete all 3 steps to earn your $0.75 reward:\n\n` +
          `1️⃣ Join Telegram Community\n` +
          `2️⃣ Join Telegram Group\n` +
          `3️⃣ Subscribe YouTube Channel\n\n` +
          `👇 Click each button then press <b>✅ Check Requirements</b>`,
          { parse_mode: 'HTML', ...verifyKeyboard(requirements) }
        );
        break;
      }

      // ── Check Requirements ────────────────────────────────────────────────────
      case 'check_requirements': {
        const checking = await bot.sendMessage(chatId, '⏳ Verifying your memberships...');

        const { results, rewarded, referral } = await qualifyReferralIfEligible(user);
        await user.reload();

        const allDone = results.every((r) => r.verified);
        const resultText = verificationResult(results);

        if (allDone) {
          // All done — show main menu
          await bot.sendMessage(chatId, resultText, {
            parse_mode: 'HTML',
            ...mainMenuKeyboard(),
          });
        } else {
          // Not done — show join buttons again
          const requirements = await Requirement.findAll({
            where: { is_enabled: true },
            order: [['order_index', 'ASC']],
          });
          await bot.sendMessage(chatId, resultText, {
            parse_mode: 'HTML',
            ...verifyKeyboard(requirements),
          });
        }

        // Auto-notify referrer — no admin needed
        if (rewarded && referral) {
          try {
            const referrer = await User.findByPk(referral.referrer_id);
            if (referrer) {
              await referrer.reload();
              await bot.sendMessage(
                referrer.telegram_id,
                referrerRewardNotification(user, referrer.balance),
                { parse_mode: 'HTML' }
              );
            }
          } catch (e) {
            logger.warn('Could not notify referrer', { error: e.message });
          }
        }
        break;
      }

      // ── Withdraw ──────────────────────────────────────────────────────────────
      case 'withdraw': {
        await user.reload();
        const balance = parseFloat(user.balance);
        const minWithdrawal = parseFloat(process.env.MIN_WITHDRAWAL || '10.00');

        if (balance < minWithdrawal) {
          await bot.sendMessage(chatId,
            `❌ <b>Insufficient Balance</b>\n\n` +
            `Minimum withdrawal: <b>$${minWithdrawal.toFixed(2)}</b>\n` +
            `Your balance: <b>$${balance.toFixed(2)}</b>\n\n` +
            `You need <b>$${(minWithdrawal - balance).toFixed(2)}</b> more.\n` +
            `Keep sharing to earn more! 🚀`,
            { parse_mode: 'HTML', ...backToMenuKeyboard() }
          );
        } else {
          await bot.sendMessage(chatId,
            `💸 <b>Withdrawal Request</b>\n\n` +
            `Available balance: <b>$${balance.toFixed(2)}</b>\n\n` +
            `To withdraw, send this command with your payment details:\n` +
            `/withdraw [payment_method] [account_details]\n\n` +
            `Example:\n` +
            `/withdraw USDT TRC20 TYourWalletAddressHere\n\n` +
            `Minimum: <b>$${minWithdrawal.toFixed(2)}</b>`,
            { parse_mode: 'HTML', ...backToMenuKeyboard() }
          );
        }
        break;
      }

      // ── Statistics ────────────────────────────────────────────────────────────
      case 'stats': {
        await user.reload();
        const stats = await getReferralStats(user.id);
        await bot.sendMessage(chatId,
          `📊 <b>Statistics</b>\n\n` +
          `👤 Joined: <b>${new Date(user.created_at).toLocaleDateString()}</b>\n` +
          `🔑 Code: <code>${user.referral_code}</code>\n\n` +
          `👥 Total Referrals: <b>${stats.total}</b>\n` +
          `✅ Rewarded: <b>${stats.rewarded}</b>\n` +
          `⏳ Pending: <b>${stats.pending}</b>\n\n` +
          `💵 Balance: <b>$${parseFloat(user.balance).toFixed(2)}</b>\n` +
          `📈 Total Earned: <b>$${parseFloat(user.total_earned).toFixed(2)}</b>\n` +
          `💸 Withdrawn: <b>$${parseFloat(user.total_withdrawn).toFixed(2)}</b>`,
          { parse_mode: 'HTML', ...backToMenuKeyboard() }
        );
        break;
      }

      // ── Help ──────────────────────────────────────────────────────────────────
      case 'help': {
        await bot.sendMessage(chatId, helpMessage(user), {
          parse_mode: 'HTML',
          ...backToMenuKeyboard(),
        });
        break;
      }

      default:
        logger.warn('Unknown callback', { data });
    }
  } catch (err) {
    logger.error('Callback error', { data, error: err.message });
    try {
      await bot.sendMessage(chatId, '❌ An error occurred. Please try again.');
    } catch (e) { /* ignore */ }
  }
};

module.exports = { handleCallback };
