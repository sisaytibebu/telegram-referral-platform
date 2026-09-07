'use strict';

const env = require('../config/env');
const botUsername = env.TELEGRAM_BOT_USERNAME || 'cryptogive_awayBOT';

/**
 * Start/Verify keyboard.
 *
 * YouTube flow:
 *   Row 1: URL button → opens YouTube directly (no callback, no tracking)
 *   Row 2: Callback button "✅ I Visited YouTube" → records click silently
 *
 * User MUST press "I Visited YouTube" for the requirement to pass.
 * Pressing the URL button alone does NOT track anything (Telegram limitation).
 */
const buildRequirementRows = (requirements) => {
  const rows = [];
  requirements.forEach((req) => {
    if (req.type === 'TELEGRAM') {
      const label = req.order_index === 1 ? '📢 Join Community' : '👥 Join Group';
      rows.push([{ text: label, url: req.url }]);
    } else {
      // Callback button — when clicked, sends a message with the YouTube link
      rows.push([{ text: '▶️ Subscribe YouTube Channel', callback_data: `yt_click_${req.id}` }]);
    }
  });
  return rows;
};

const startKeyboard = (requirements) => {
  const rows = buildRequirementRows(requirements);
  rows.push([{ text: '✅ Check Requirements', callback_data: 'check_requirements' }]);
  rows.push([
    { text: '🏠 Main Menu', callback_data: 'main_menu' },
    { text: 'ℹ️ Help',      callback_data: 'help' },
  ]);
  return { reply_markup: { inline_keyboard: rows } };
};

const verifyKeyboard = (requirements) => {
  const rows = buildRequirementRows(requirements);
  rows.push([{ text: '✅ Check Requirements', callback_data: 'check_requirements' }]);
  rows.push([{ text: '🏠 Main Menu', callback_data: 'main_menu' }]);
  return { reply_markup: { inline_keyboard: rows } };
};

const mainMenuKeyboard = () => ({
  reply_markup: {
    inline_keyboard: [
      [
        { text: '💰 Balance',             callback_data: 'balance' },
        { text: '👥 My Referrals',        callback_data: 'my_referrals' },
      ],
      [
        { text: '💸 Withdraw',            callback_data: 'withdraw' },
        { text: '🔗 My Referral Link',    callback_data: 'referral_link' },
      ],
      [
        { text: '✅ Verify Requirements', callback_data: 'verify' },
        { text: '📊 Statistics',          callback_data: 'stats' },
      ],
    ],
  },
});

const backToMenuKeyboard = () => ({
  reply_markup: {
    inline_keyboard: [[{ text: '🏠 Main Menu', callback_data: 'main_menu' }]],
  },
});

const getReferralLink = (referralCode) =>
  `https://t.me/${botUsername}?start=${referralCode}`;

module.exports = {
  startKeyboard,
  verifyKeyboard,
  mainMenuKeyboard,
  backToMenuKeyboard,
  getReferralLink,
};
