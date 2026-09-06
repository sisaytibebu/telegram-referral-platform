'use strict';

const { getReferralLink } = require('./keyboards');

/**
 * Welcome message for NEW users.
 * Shows requirements with join buttons below.
 */
const welcomeNew = (user, requirements) => {
  const name = user.first_name || 'Friend';
  return (
    `👋 <b>Welcome, ${name}!</b>\n\n` +
    `👥 <b>Refer &amp; Earn Program</b>\n\n` +
    `🚀 Invite friends and earn <b>$0.75 USDT</b> for every person who joins through your link!\n\n` +
    `📋 <b>To activate your account, complete these 3 steps:</b>\n\n` +
    `1️⃣ Join our Telegram Community\n` +
    `2️⃣ Join our Telegram Group\n` +
    `3️⃣ Subscribe to our YouTube Channel\n\n` +
    `👇 Click the buttons below to join, then press <b>✅ Check Requirements</b>\n\n` +
    `🔗 <b>Your Referral Link:</b>\n` +
    `<code>${getReferralLink(user.referral_code)}</code>\n\n` +
    `📢 Share your link and earn $0.75 for every verified referral!`
  );
};

/**
 * Welcome back message for RETURNING users.
 */
const welcomeBack = (user) => {
  const name = user.first_name || 'Friend';
  return (
    `👋 Welcome back, <b>${name}</b>!\n\n` +
    `What would you like to do?`
  );
};

/**
 * Balance summary message.
 */
const balanceMessage = (user, stats) =>
  `💰 <b>Your Balance</b>\n\n` +
  `💵 Available: <b>$${parseFloat(user.balance).toFixed(2)}</b>\n` +
  `💸 Withdrawn: <b>$${parseFloat(user.total_withdrawn).toFixed(2)}</b>\n` +
  `📈 Total Earned: <b>$${parseFloat(user.total_earned).toFixed(2)}</b>\n\n` +
  `👥 Total Referrals: <b>${stats.total}</b>\n` +
  `✅ Rewarded: <b>${stats.rewarded}</b>\n` +
  `⏳ Pending: <b>${stats.pending}</b>\n\n` +
  `🔗 <b>Your Referral Link:</b>\n` +
  `<code>${getReferralLink(user.referral_code)}</code>`;

/**
 * Verification result message.
 */
const verificationResult = (results) => {
  const lines = results.map((r) => {
    const icon = r.verified ? '✅' : '❌';
    let name;
    if (r.requirement.type === 'TELEGRAM') {
      name = r.requirement.order_index === 1 ? 'Telegram Community' : 'Telegram Group';
    } else {
      name = 'YouTube Channel';
    }
    return `${icon} ${name}`;
  });

  const allDone = results.every((r) => r.verified);

  if (allDone) {
    return (
      `<b>✅ Verification Complete!</b>\n\n` +
      `${lines.join('\n')}\n\n` +
      `🎉 <b>All requirements met!</b>\n` +
      `💰 <b>$0.75 USDT</b> has been added to your balance!\n\n` +
      `Keep sharing your referral link to earn more!`
    );
  }

  return (
    `<b>Verification Status</b>\n\n` +
    `${lines.join('\n')}\n\n` +
    `⚠️ Please complete the remaining steps and check again.`
  );
};

/**
 * Reward notification sent to referrer.
 */
const referrerRewardNotification = (referredUser, newBalance) =>
  `🎉 <b>Referral Reward!</b>\n\n` +
  `Your referral <b>${referredUser.first_name || 'a user'}</b> has completed all requirements!\n\n` +
  `💰 <b>+$0.75 USDT</b> added to your balance\n` +
  `💵 New balance: <b>$${parseFloat(newBalance).toFixed(2)}</b>\n\n` +
  `Keep sharing to earn more! 🚀`;

/**
 * Help message.
 */
const helpMessage = () =>
  `ℹ️ <b>How It Works</b>\n\n` +
  `1️⃣ Complete all 3 requirements\n` +
  `2️⃣ Share your referral link with friends\n` +
  `3️⃣ Earn <b>$0.75</b> for each friend who completes requirements\n` +
  `4️⃣ Withdraw when you reach <b>$10.00</b>\n\n` +
  `<b>Commands:</b>\n` +
  `/start - Start the bot\n` +
  `/balance - Check your balance\n` +
  `/referral - Get your referral link\n` +
  `/referrals - See your referrals\n` +
  `/withdraw - Request withdrawal\n` +
  `/help - Show this message`;

module.exports = {
  welcomeNew,
  welcomeBack,
  balanceMessage,
  verificationResult,
  referrerRewardNotification,
  helpMessage,
};
