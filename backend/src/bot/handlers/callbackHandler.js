'use strict';

const { User, Referral } = require('../../models');
const { getReferralStats } = require('../../services/referral/ReferralService');
const { qualifyReferralIfEligible } = require('../../services/verification/VerificationService');
const { getRequirements } = require('./startHandler');
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
    // ── YouTube subscription confirm ──────────────────────────────────────────
    // User pressed "✅ I Subscribed to YouTube" — record silently, no new message
    if (data && data.startsWith('yt_confirm_')) {
      const reqId = parseInt(data.replace('yt_confirm_', ''));
      try {
        const { RequirementVerification } = require('../../models');
        const ytUser = await User.findOne({ where: { telegram_id: from.id } });
        if (ytUser) {
          await RequirementVerification.upsert({
            user_id:           ytUser.id,
            requirement_id:    reqId,
            status:            'PENDING',
            verification_data: JSON.stringify({ confirmed_at: new Date(), method: 'USER_CONFIRM' }),
          });
        }
      } catch (e) {
        logger.warn('Could not record YouTube confirmation', { error: e.message });
      }
      await bot.answerCallbackQuery(callbackQuery.id, { text: '✅ YouTube recorded! Now press Check Requirements.' });
      return;
    }

    // ── All other callbacks ───────────────────────────────────────────────────
    await bot.answerCallbackQuery(callbackQuery.id);

    const user = await User.findOne({ where: { telegram_id: from.id } });
    if (!user) return bot.sendMessage(chatId, '❌ Please send /start first.');
    if (user.is_banned) return bot.sendMessage(chatId, '🚫 Your account has been suspended.');

    switch (data) {

      case 'main_menu': {
        await user.reload();
        await bot.sendMessage(chatId, welcomeBack(user), {
          parse_mode: 'HTML', ...mainMenuKeyboard(),
        });
        break;
      }

      case 'balance': {
        await user.reload();
        const stats = await getReferralStats(user.id);
        await bot.sendMessage(chatId, balanceMessage(user, stats), {
          parse_mode: 'HTML', ...backToMenuKeyboard(),
        });
        break;
      }

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
          parse_mode: 'HTML', ...backToMenuKeyboard(),
        });
        break;
      }

      case 'referral_link': {
        const link = getReferralLink(user.referral_code);
        const stats = await getReferralStats(user.id);
        await bot.sendMessage(chatId,
          `👥 <b>Refer &amp; Earn Program</b>\n\n` +
          `🚀 Invite your friends and earn limitless crypto!\n\n` +
          `🎁 You will receive <b>$0.75 USDT</b> for every valid user who joins through your link.\n\n` +
          `🔗 <b>Your Exclusive Referral Link:</b>\n` +
          `${link}\n\n` +
          `📢 Share this link with your network and start earning!\n\n` +
          `━━━━━━━━━━━━━━━━━━━\n` +
          `👥 Referrals: <b>${stats.total}</b> | ✅ Rewarded: <b>${stats.rewarded}</b>\n` +
          `💵 Total Earned: <b>$${parseFloat(user.total_earned).toFixed(2)}</b>`,
          { parse_mode: 'HTML', ...backToMenuKeyboard() }
        );
        break;
      }

      case 'verify': {
        const reqs = await getRequirements();
        await bot.sendMessage(chatId,
          `📋 <b>Requirements</b>\n\n` +
          `Complete all 3 steps to earn your $0.75 reward:\n\n` +
          `1️⃣ Join Telegram Community\n` +
          `2️⃣ Join Telegram Group\n` +
          `3️⃣ Subscribe YouTube Channel — then press <b>✅ I Subscribed to YouTube</b>\n\n` +
          `👇 Click each button below, then press <b>✅ Check Requirements</b>`,
          { parse_mode: 'HTML', ...verifyKeyboard(reqs) }
        );
        break;
      }

      case 'check_requirements': {
        await bot.sendMessage(chatId, '⏳ Verifying your memberships...');

        const { results, userRewarded, referral, referrerRewarded } = await qualifyReferralIfEligible(user);
        await user.reload();

        const allDone = results.every((r) => r.verified);
        const resultText = verificationResult(results);

        if (allDone) {
          await bot.sendMessage(chatId, resultText, {
            parse_mode: 'HTML', ...mainMenuKeyboard(),
          });
        } else {
          const reqs = await getRequirements();
          await bot.sendMessage(chatId, resultText, {
            parse_mode: 'HTML', ...verifyKeyboard(reqs),
          });
        }

        if (referrerRewarded && referral) {
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

      case 'withdraw': {
        await user.reload();
        const balance = parseFloat(user.balance);
        const minWithdrawal = parseFloat(process.env.MIN_WITHDRAWAL || '10.00');
        if (balance < minWithdrawal) {
          await bot.sendMessage(chatId,
            `❌ <b>Insufficient Balance</b>\n\n` +
            `Minimum: <b>$${minWithdrawal.toFixed(2)}</b>\n` +
            `Your balance: <b>$${balance.toFixed(2)}</b>\n\n` +
            `Need <b>$${(minWithdrawal - balance).toFixed(2)}</b> more. Keep sharing! 🚀`,
            { parse_mode: 'HTML', ...backToMenuKeyboard() }
          );
        } else {
          await bot.sendMessage(chatId,
            `💸 <b>Withdrawal Request</b>\n\n` +
            `Available: <b>$${balance.toFixed(2)}</b>\n\n` +
            `Use command:\n<code>/withdraw USDT TYourWalletAddress</code>\n\n` +
            `Minimum: <b>$${minWithdrawal.toFixed(2)}</b>`,
            { parse_mode: 'HTML', ...backToMenuKeyboard() }
          );
        }
        break;
      }

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

      case 'help': {
        await bot.sendMessage(chatId, helpMessage(user), {
          parse_mode: 'HTML', ...backToMenuKeyboard(),
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
