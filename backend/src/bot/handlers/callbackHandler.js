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
    // ── YouTube click — handle BEFORE answerCallbackQuery ──────────────────────
    // answerCallbackQuery with url opens a URL in the browser
    if (data && data.startsWith('yt_click_')) {
      const reqId = parseInt(data.replace('yt_click_', ''));
      const envConfig = require('../../config/env');
      let ytUrl = `https://www.youtube.com/channel/${envConfig.YOUTUBE_CHANNEL_ID}`;

      try {
        const { Requirement, RequirementVerification } = require('../../models');
        const ytUser = await User.findOne({ where: { telegram_id: from.id } });
        const req = await Requirement.findByPk(reqId);
        if (req && req.url) ytUrl = req.url;

        if (ytUser) {
          await RequirementVerification.upsert({
            user_id:           ytUser.id,
            requirement_id:    reqId,
            status:            'PENDING',
            verification_data: JSON.stringify({ clicked_at: new Date(), method: 'BUTTON_CLICK' }),
          });
        }
      } catch (e) {
        logger.warn('Could not record YouTube click', { error: e.message });
      }

      // Open YouTube in browser — answerCallbackQuery with url does this
      await bot.answerCallbackQuery(callbackQuery.id, { url: ytUrl });
      return; // Done — no further processing needed
    }

    // ── All other callbacks ───────────────────────────────────────────────────
    await bot.answerCallbackQuery(callbackQuery.id);

    const user = await User.findOne({ where: { telegram_id: from.id } });
    if (!user) {
      return bot.sendMessage(chatId, '❌ Please send /start first.');
    }
    if (user.is_banned) {
      return bot.sendMessage(chatId, '🚫 Your account has been suspended.');
    }

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
          `3️⃣ Subscribe YouTube Channel\n\n` +
          `👇 Click each button then press <b>✅ Check Requirements</b>`,
          { parse_mode: 'HTML', ...verifyKeyboard(reqs) }
        );
        break;
      }

      case 'check_requirements': {
        await bot.sendMessage(chatId, '⏳ Verifying your memberships...');

        const { results, qualified, userRewarded, referral, referrerRewarded } = await qualifyReferralIfEligible(user);
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

        // Notify referrer if they got rewarded
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
            `Minimum withdrawal: <b>$${minWithdrawal.toFixed(2)}</b>\n` +
            `Your balance: <b>$${balance.toFixed(2)}</b>\n\n` +
            `You need <b>$${(minWithdrawal - balance).toFixed(2)}</b> more.\n` +
            `Keep sharing your referral link to earn more! 🚀`,
            { parse_mode: 'HTML', ...backToMenuKeyboard() }
          );
        } else {
          await bot.sendMessage(chatId,
            `💸 <b>Withdrawal Request</b>\n\n` +
            `Available balance: <b>$${balance.toFixed(2)}</b>\n\n` +
            `Please use the /withdraw command:\n` +
            `/withdraw USDT TYourWalletAddress\n\n` +
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

      default: {
        logger.warn('Unknown callback', { data });
      }
    }
  } catch (err) {
    logger.error('Callback error', { data, error: err.message });
    try {
      await bot.sendMessage(chatId, '❌ An error occurred. Please try again.');
    } catch (e) { /* ignore */ }
  }
};

module.exports = { handleCallback };
