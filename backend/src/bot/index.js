'use strict';

const { getBot } = require('../services/telegram/TelegramService');
const { handleStart } = require('./handlers/startHandler');
const { handleCallback } = require('./handlers/callbackHandler');
const { User } = require('../models');
const { getReferralStats } = require('../services/referral/ReferralService');
const { balanceMessage, helpMessage } = require('./messages');
const { mainMenuKeyboard, requirementsKeyboard, backToMenuKeyboard, getReferralLink } = require('./keyboards');
const { Requirement } = require('../models');
const logger = require('../utils/logger');

const initBot = () => {
  const bot = getBot();
  if (!bot) {
    logger.warn('Bot not initialised — skipping handler registration');
    return null;
  }

  // ── /start ──────────────────────────────────────────────────────────────────
  bot.onText(/\/start(?:\s+(.+))?/, async (msg, match) => {
    const referralCode = match[1] ? match[1].trim() : null;
    await handleStart(bot, msg, referralCode);
  });

  // ── /balance ─────────────────────────────────────────────────────────────────
  bot.onText(/\/balance/, async (msg) => {
    const user = await User.findOne({ where: { telegram_id: msg.from.id } });
    if (!user) return bot.sendMessage(msg.chat.id, '❌ Please /start first.');
    const stats = await getReferralStats(user.id);
    bot.sendMessage(msg.chat.id, balanceMessage(user, stats), {
      parse_mode: 'HTML', ...backToMenuKeyboard(),
    });
  });

  // ── /referral ─────────────────────────────────────────────────────────────────
  bot.onText(/\/referral/, async (msg) => {
    const user = await User.findOne({ where: { telegram_id: msg.from.id } });
    if (!user) return bot.sendMessage(msg.chat.id, '❌ Please /start first.');
    const link = getReferralLink(user.referral_code);
    bot.sendMessage(msg.chat.id,
      `👥 <b>Refer &amp; Earn Program</b>\n\n` +
      `🚀 Invite your friends and earn limitless crypto!\n\n` +
      `🎁 You will receive <b>$0.75 USDT</b> for every valid user who joins through your link.\n\n` +
      `🔗 <b>Your Exclusive Referral Link:</b>\n<code>${link}</code>\n\n` +
      `📢 Share this link with your network and start earning!`,
      { parse_mode: 'HTML', ...backToMenuKeyboard() }
    );
  });

  // ── /referrals ────────────────────────────────────────────────────────────────
  bot.onText(/\/referrals/, async (msg) => {
    const user = await User.findOne({ where: { telegram_id: msg.from.id } });
    if (!user) return bot.sendMessage(msg.chat.id, '❌ Please /start first.');
    const stats = await getReferralStats(user.id);
    bot.sendMessage(msg.chat.id,
      `👥 <b>My Referrals</b>\n\nTotal: <b>${stats.total}</b>\n✅ Rewarded: <b>${stats.rewarded}</b>\n⏳ Pending: <b>${stats.pending}</b>`,
      { parse_mode: 'HTML', ...backToMenuKeyboard() }
    );
  });

  // ── /withdraw ─────────────────────────────────────────────────────────────────
  bot.onText(/\/withdraw/, async (msg) => {
    const user = await User.findOne({ where: { telegram_id: msg.from.id } });
    if (!user) return bot.sendMessage(msg.chat.id, '❌ Please /start first.');
    const balance = parseFloat(user.balance);
    const min = parseFloat(process.env.MIN_WITHDRAWAL || '10.00');
    if (balance < min) {
      return bot.sendMessage(msg.chat.id,
        `❌ Minimum withdrawal is <b>$${min.toFixed(2)}</b>\nYour balance: <b>$${balance.toFixed(2)}</b>`,
        { parse_mode: 'HTML' }
      );
    }
    bot.sendMessage(msg.chat.id,
      `💸 Your balance is <b>$${balance.toFixed(2)}</b>.\n\nPlease contact admin to process your withdrawal.`,
      { parse_mode: 'HTML', ...backToMenuKeyboard() }
    );
  });

  // ── /help ─────────────────────────────────────────────────────────────────────
  bot.onText(/\/help/, async (msg) => {
    bot.sendMessage(msg.chat.id, helpMessage(), { parse_mode: 'HTML', ...backToMenuKeyboard() });
  });

  // ── /stats (admin summary via bot) ────────────────────────────────────────────
  bot.onText(/\/stats/, async (msg) => {
    const user = await User.findOne({ where: { telegram_id: msg.from.id } });
    if (!user) return bot.sendMessage(msg.chat.id, '❌ Please /start first.');
    const stats = await getReferralStats(user.id);
    bot.sendMessage(msg.chat.id,
      `📊 <b>Your Statistics</b>\n\n` +
      `👥 Total referrals: <b>${stats.total}</b>\n` +
      `✅ Rewarded: <b>${stats.rewarded}</b>\n` +
      `⏳ Pending: <b>${stats.pending}</b>\n\n` +
      `💰 Balance: <b>$${parseFloat(user.balance).toFixed(2)}</b>\n` +
      `📈 Total Earned: <b>$${parseFloat(user.total_earned).toFixed(2)}</b>`,
      { parse_mode: 'HTML', ...backToMenuKeyboard() }
    );
  });

  // ── Callback queries ──────────────────────────────────────────────────────────
  bot.on('callback_query', async (callbackQuery) => {
    await handleCallback(bot, callbackQuery);
  });

  // ── Error handler ─────────────────────────────────────────────────────────────
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
