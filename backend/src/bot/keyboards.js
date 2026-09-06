'use strict';

const env = require('../config/env');

const botUsername = env.TELEGRAM_BOT_USERNAME || 'cryptogive_awayBOT';

/**
 * Main menu keyboard — shown after user is verified.
 */
const mainMenuKeyboard = () => ({
  reply_markup: {
    inline_keyboard: [
      [
        { text: '💰 Balance',            callback_data: 'balance' },
        { text: '🔗 My Referral Link',   callback_data: 'referral_link' },
      ],
      [
        { text: '👥 My Referrals',       callback_data: 'my_referrals' },
        { text: '✅ Verify Requirements', callback_data: 'verify' },
      ],
      [
        { text: '💸 Withdraw',           callback_data: 'withdraw' },
        { text: '📊 Statistics',         callback_data: 'stats' },
      ],
      [
        { text: 'ℹ️ Help',               callback_data: 'help' },
      ],
    ],
  },
});

/**
 * Requirements keyboard — shown on /start and when verifying.
 * Each requirement has a URL button that opens the group/channel.
 * At the bottom: ✅ Check Requirements button.
 */
const requirementsKeyboard = (requirements) => {
  const rows = requirements.map((req) => {
    let label;
    if (req.type === 'TELEGRAM') {
      // Distinguish community vs group by order
      label = req.order_index === 1
        ? '📢 Join Community'
        : '👥 Join Group';
    } else {
      label = '▶️ Subscribe YouTube Channel';
    }
    return [{ text: label, url: req.url }];
  });

  // Check Requirements button below all join buttons
  rows.push([{ text: '✅ Check Requirements', callback_data: 'check_requirements' }]);

  return { reply_markup: { inline_keyboard: rows } };
};

/**
 * Back to main menu keyboard.
 */
const backToMenuKeyboard = () => ({
  reply_markup: {
    inline_keyboard: [[{ text: '🏠 Main Menu', callback_data: 'main_menu' }]],
  },
});

/**
 * Build referral link from code.
 */
const getReferralLink = (referralCode) =>
  `https://t.me/${botUsername}?start=${referralCode}`;

module.exports = {
  mainMenuKeyboard,
  requirementsKeyboard,
  backToMenuKeyboard,
  getReferralLink,
};
