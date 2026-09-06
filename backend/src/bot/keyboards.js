'use strict';

const env = require('../config/env');
const botUsername = env.TELEGRAM_BOT_USERNAME || 'cryptogive_awayBOT';

/**
 * Start/Welcome keyboard:
 * - Join buttons (one per requirement)
 * - Main Menu button
 * - Help button
 */
const startKeyboard = (requirements) => {
  const rows = [];

  // Join buttons for each requirement
  requirements.forEach((req) => {
    let label;
    if (req.type === 'TELEGRAM') {
      label = req.order_index === 1 ? '📢 Join Community' : '👥 Join Group';
    } else {
      label = '▶️ Subscribe YouTube Channel';
    }
    rows.push([{ text: label, url: req.url }]);
  });

  // Check Requirements button
  rows.push([{ text: '✅ Check Requirements', callback_data: 'check_requirements' }]);

  // Main Menu and Help
  rows.push([
    { text: '🏠 Main Menu', callback_data: 'main_menu' },
    { text: 'ℹ️ Help',      callback_data: 'help' },
  ]);

  return { reply_markup: { inline_keyboard: rows } };
};

/**
 * Main Menu keyboard:
 * - Balance
 * - My Referrals
 * - Withdraw
 * - My Referral Link
 * - Verify Requirements
 * - Statistics
 */
const mainMenuKeyboard = () => ({
  reply_markup: {
    inline_keyboard: [
      [
        { text: '💰 Balance',              callback_data: 'balance' },
        { text: '👥 My Referrals',         callback_data: 'my_referrals' },
      ],
      [
        { text: '💸 Withdraw',             callback_data: 'withdraw' },
        { text: '🔗 My Referral Link',     callback_data: 'referral_link' },
      ],
      [
        { text: '✅ Verify Requirements',  callback_data: 'verify' },
        { text: '📊 Statistics',           callback_data: 'stats' },
      ],
    ],
  },
});

/**
 * Back to menu keyboard.
 */
const backToMenuKeyboard = () => ({
  reply_markup: {
    inline_keyboard: [[{ text: '🏠 Main Menu', callback_data: 'main_menu' }]],
  },
});

/**
 * Verify page keyboard — same join buttons + check button + back.
 */
const verifyKeyboard = (requirements) => {
  const rows = requirements.map((req) => {
    const label = req.type === 'TELEGRAM'
      ? (req.order_index === 1 ? '📢 Join Community' : '👥 Join Group')
      : '▶️ Subscribe YouTube Channel';
    return [{ text: label, url: req.url }];
  });
  rows.push([{ text: '✅ Check Requirements', callback_data: 'check_requirements' }]);
  rows.push([{ text: '🏠 Main Menu', callback_data: 'main_menu' }]);
  return { reply_markup: { inline_keyboard: rows } };
};

const getReferralLink = (referralCode) =>
  `https://t.me/${botUsername}?start=${referralCode}`;

module.exports = {
  startKeyboard,
  mainMenuKeyboard,
  backToMenuKeyboard,
  verifyKeyboard,
  getReferralLink,
};
