'use strict';

const { getBot } = require('../services/telegram/TelegramService');
const { handleStart } = require('./handlers/startHandler');
const { handleCallback } = require('./handlers/callbackHandler');
const { User, Referral } = require('../models');
const { getReferralStats } = require('../services/referral/ReferralService');
const { balanceMessage, helpMessage, myReferralsMessage } = require('./messages');
const { mainMenuKeyboard, backToMenuKeyboard, getReferralLink } = require('./keyboards');
const logger = require('../utils/logger');

const initBot = () => {
  const bot = getBot();
  if (!bot) {
    logger.warn('Bot not initialised — skipping handler registration');
    return null;
  }

  // ── /start [referral_code] ────────────────────────────────────────────────
  bot.onText(/\/start(?:\s+(.+))?/, async (msg, match) => {
    const referralCode = match[1] ? match[1].trim() : null;
    await handleStart(bot, msg, referralCode);
  });

  // ── /balance ──────────────────────────────────────────────────────────────
  bot.onText(/\/balance/, async (msg) => {
    try {
      const user = await User.findOne({ where: { telegram_id: msg.from.id } });
      if (!user) return bot.sendMessage(msg.chat.id, '❌ Please /start first.');
      await user.reload();
      const stats = await getReferralStats(user.id);
      bot.sendMessage(msg.chat.id, balanceMessage(user, stats), {
        parse_mode: 'HTML', ...backToMenuKeyboard(),
      });
    } catch (e) { logger.error('/balance error', { error: e.message }); }
  });

  // ── /referral ─────────────────────────────────────────────────────────────
  bot.onText(/\/referral/, async (msg) => {
    try {
      const user = await User.findOne({ where: { telegram_id: msg.from.id } });
      if (!user) return bot.sendMessage(msg.chat.id, '❌ Please /start first.');
      const link = getReferralLink(user.referral_code);
      const stats = await getReferralStats(user.id);
      bot.sendMessage(msg.chat.id,
        `🔗 <b>Your Referral Link</b>\n\n` +
        `<code>${link}</code>\n\n` +
        `👆 Tap to copy!\n\n` +
        `📢 <b>Refer &amp; Earn:</b> $0.75 per verified friend\n` +
        `✅ Successful: <b>${stats.rewarded}</b> | 💵 Earned: <b>$${parseFloat(user.total_earned).toFixed(2)}</b>`,
        { parse_mode: 'HTML', ...backToMenuKeyboard() }
      );
    } catch (e) { logger.error('/referral error', { error: e.message }); }
  });

  // ── /referrals ────────────────────────────────────────────────────────────
  bot.onText(/\/referrals/, async (msg) => {
    try {
      const user = await User.findOne({ where: { telegram_id: msg.from.id } });
      if (!user) return bot.sendMessage(msg.chat.id, '❌ Please /start first.');
      await user.reload();
      const stats = await getReferralStats(user.id);
      const list = await Referral.findAll({
        where: { referrer_id: user.id },
        include: [{ model: User, as: 'referred_user', attributes: ['first_name', 'username'] }],
        order: [['created_at', 'DESC']],
        limit: 10,
      });
      bot.sendMessage(msg.chat.id, myReferralsMessage(user, stats, list), {
        parse_mode: 'HTML', ...backToMenuKeyboard(),
      });
    } catch (e) { logger.error('/referrals error', { error: e.message }); }
  });

  // ── /withdraw ─────────────────────────────────────────────────────────────
  bot.onText(/\/withdraw(?:\s+(.+))?/, async (msg, match) => {
    try {
      const user = await User.findOne({ where: { telegram_id: msg.from.id } });
      if (!user) return bot.sendMessage(msg.chat.id, '❌ Please /start first.');
      await user.reload();
      const balance = parseFloat(user.balance);
      const min = parseFloat(process.env.MIN_WITHDRAWAL || '10.00');
      if (balance < min) {
        return bot.sendMessage(msg.chat.id,
          `❌ Minimum withdrawal is <b>$${min.toFixed(2)}</b>\nYour balance: <b>$${balance.toFixed(2)}</b>`,
          { parse_mode: 'HTML' }
        );
      }
      bot.sendMessage(msg.chat.id,
        `💸 Balance: <b>$${balance.toFixed(2)}</b>\n\nWithdrawal request received. Admin will process it shortly.`,
        { parse_mode: 'HTML', ...backToMenuKeyboard() }
      );
    } catch (e) { logger.error('/withdraw error', { error: e.message }); }
  });

  // ── /stats ────────────────────────────────────────────────────────────────
  bot.onText(/\/stats/, async (msg) => {
    try {
      const user = await User.findOne({ where: { telegram_id: msg.from.id } });
      if (!user) return bot.sendMessage(msg.chat.id, '❌ Please /start first.');
      await user.reload();
      const stats = await getReferralStats(user.id);
      bot.sendMessage(msg.chat.id,
        `📊 Referrals: <b>${stats.total}</b> | ✅ Rewarded: <b>${stats.rewarded}</b>\n` +
        `💵 Balance: <b>$${parseFloat(user.balance).toFixed(2)}</b>`,
        { parse_mode: 'HTML', ...backToMenuKeyboard() }
      );
    } catch (e) { logger.error('/stats error', { error: e.message }); }
  });

  // ── /help ─────────────────────────────────────────────────────────────────
  bot.onText(/\/help/, async (msg) => {
    try {
      const user = await User.findOne({ where: { telegram_id: msg.from.id } });
      bot.sendMessage(msg.chat.id, helpMessage(user), {
        parse_mode: 'HTML', ...backToMenuKeyboard(),
      });
    } catch (e) { logger.error('/help error', { error: e.message }); }
  });

  // ── Callback queries ──────────────────────────────────────────────────────
  bot.on('callback_query', async (callbackQuery) => {
    await handleCallback(bot, callbackQuery);
  });

  // ── Error handlers ────────────────────────────────────────────────────────
  bot.on('polling_error', (err) => {
    logger.error('Bot polling error', { message: err.message });
  });
  bot.on('error', (err) => {
    logger.error('Bot error', { message: err.message });
  });

  logger.info('Bot handlers registered');
  return bot;
};

module.exports = { initBot };
