'use strict';

const env = require('../config/env');

const botUsername = env.TELEGRAM_BOT_USERNAME || 'cryptogive_awayBOT';

const mainMenuKeyboard = () => ({
  reply_markup: {
    inline_keyboard: [
      [
        { text: '💰 Balance',          callback_data: 'balance' },
        { text: '🔗 My Referral Link', callback_data: 'referral_link' },
      ],
      [
        { text: '👥 My Referrals',     callback_data: 'my_referrals' },
        { text: '✅ Verify Requirements', callback_data: 'verify' },
      ],
      [
        { text: '💸 Withdraw',         callback_data: 'withdraw' },
        { text: '📊 Statistics',       callback_data: 'stats' },
      ],
      [
        { text: 'ℹ️ Help',             callback_data: 'help' },
      ],
    ],
  },
});

const requirementsKeyboard = (requirements) => {
  const rows = requirements.map((req) => {
    const label = req.type === 'TELEGRAM'
      ? `📢 ${req.name}`
      : `▶️ ${req.name}`;
    return [{ text: label, url: req.url }];
  });
  rows.push([{ text: '✅ Check Requirements', callback_data: 'check_requirements' }]);
  rows.push([{ text: '🏠 Main Menu', callback_data: 'main_menu' }]);
  return { reply_markup: { inline_keyboard: rows } };
};

const backToMenuKeyboard = () => ({
  reply_markup: {
    inline_keyboard: [[{ text: '🏠 Main Menu', callback_data: 'main_menu' }]],
  },
});

const getReferralLink = (referralCode) =>
  `https://t.me/${botUsername}?start=${referralCode}`;

module.exports = {
  mainMenuKeyboard,
  requirementsKeyboard,
  backToMenuKeyboard,
  getReferralLink,
};
