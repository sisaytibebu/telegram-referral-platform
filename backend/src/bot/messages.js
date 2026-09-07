'use strict';

const { getReferralLink } = require('./keyboards');

// ── Welcome (new user) ────────────────────────────────────────────────────────
const welcomeNew = (user, requirements) => {
  const name = user.first_name || 'Friend';
  return (
    `👋 <b>Welcome, ${name}!</b>\n\n` +
    `🎉 Join our <b>Refer &amp; Earn</b> program and earn <b>$0.75 USDT</b> for every friend you invite!\n\n` +
    `📋 <b>Complete 3 quick steps to activate your account:</b>\n` +
    `1️⃣ Join our Telegram Community\n` +
    `2️⃣ Join our Telegram Group\n` +
    `3️⃣ Subscribe to our YouTube Channel\n\n` +
    `👇 Use the buttons below to join, then press <b>✅ Check Requirements</b>`
  );
};

// ── Welcome back (returning user) ─────────────────────────────────────────────
const welcomeBack = (user) => {
  const name = user.first_name || 'Friend';
  return (
    `👋 <b>Welcome back, ${name}!</b>\n\n` +
    `💰 Balance: <b>$${parseFloat(user.balance).toFixed(2)}</b>\n\n` +
    `Use the menu below to manage your account.`
  );
};

// ── Balance ────────────────────────────────────────────────────────────────────
const balanceMessage = (user, stats) =>
  `💰 <b>Your Balance</b>\n\n` +
  `💵 Available: <b>$${parseFloat(user.balance).toFixed(2)}</b>\n` +
  `💸 Withdrawn: <b>$${parseFloat(user.total_withdrawn).toFixed(2)}</b>\n` +
  `📈 Total Earned: <b>$${parseFloat(user.total_earned).toFixed(2)}</b>\n\n` +
  `👥 Total Referrals: <b>${stats.total}</b>\n` +
  `✅ Successful: <b>${stats.rewarded}</b>\n` +
  `⏳ Pending: <b>${stats.pending}</b>`;

// ── My Referrals ───────────────────────────────────────────────────────────────
const myReferralsMessage = (user, stats, referralList) => {
  const link = getReferralLink(user.referral_code);

  let listText = '';
  if (referralList && referralList.length > 0) {
    listText = '\n\n<b>Recent Referrals:</b>\n';
    listText += referralList.slice(0, 10).map((r, i) => {
      const name = r.referred_user?.first_name || r.referred_user?.username || 'Unknown';
      const status = r.status === 'REWARDED' ? '✅' : '⏳';
      return `${i + 1}. ${status} ${name}`;
    }).join('\n');
  }

  return (
    `👥 <b>My Referrals</b>\n\n` +
    `Total Invited: <b>${stats.total}</b>\n` +
    `✅ Completed &amp; Rewarded: <b>${stats.rewarded}</b>\n` +
    `⏳ Pending: <b>${stats.pending}</b>\n\n` +
    `💰 Total Earned: <b>$${parseFloat(user.total_earned).toFixed(2)}</b>` +
    listText +
    `\n\n━━━━━━━━━━━━━━━━━━━\n\n` +
    `👥 <b>Refer &amp; Earn Program</b>\n\n` +
    `🚀 Invite your friends and earn limitless crypto!\n\n` +
    `🎁 You will receive <b>$0.75 USDT</b> for every valid user who joins through your link.\n\n` +
    `🔗 <b>Your Exclusive Referral Link:</b>\n` +
    `${link}\n\n` +
    `📢 Share this link with your network and start earning!`
  );
};

// ── Verification result ────────────────────────────────────────────────────────
const verificationResult = (results) => {
  const lines = results.map((r) => {
    const icon = r.verified ? '✅' : '❌';
    let label;
    if (r.requirement.type === 'TELEGRAM') {
      label = r.requirement.order_index === 1 ? 'Joined Telegram Community' : 'Joined Telegram Group';
    } else {
      label = r.verified ? 'Subscribed YouTube Channel' : 'YouTube Channel';
    }
    return `${icon} ${label}`;
  });

  const allDone = results.every((r) => r.verified);

  if (allDone) {
    return (
      `✅ <b>All Requirements Complete!</b>\n\n` +
      `${lines.join('\n')}\n\n` +
      `🎉 <b>$0.75 USDT</b> has been added to your balance!\n\n` +
      `Keep sharing your referral link to earn more! 🚀`
    );
  }

  return (
    `📋 <b>Verification Status</b>\n\n` +
    `${lines.join('\n')}\n\n` +
    `⚠️ Complete the missing steps and press <b>✅ Check Requirements</b> again.`
  );
};

// ── Referrer reward notification ───────────────────────────────────────────────
const referrerRewardNotification = (referredUser, newBalance) =>
  `🎉 <b>You earned a referral reward!</b>\n\n` +
  `Your friend <b>${referredUser.first_name || 'a user'}</b> has completed all requirements!\n\n` +
  `💰 <b>+$0.75 USDT</b> added to your balance\n` +
  `💵 New balance: <b>$${parseFloat(newBalance).toFixed(2)}</b>\n\n` +
  `Keep sharing your referral link to earn more! 🚀`;

// ── Help ───────────────────────────────────────────────────────────────────────
const helpMessage = (user) => {
  const link = user ? getReferralLink(user.referral_code) : '';
  return (
    `ℹ️ <b>How It Works</b>\n\n` +
    `1️⃣ Join all 3 required channels/groups\n` +
    `2️⃣ Press ✅ Check Requirements\n` +
    `3️⃣ Get <b>$0.75 USDT</b> added to your balance\n` +
    `4️⃣ Share your referral link with friends\n` +
    `5️⃣ Earn <b>$0.75</b> for every friend who completes steps 1-3\n` +
    `6️⃣ Withdraw when balance reaches <b>$10.00</b>\n\n` +
    `<b>Commands:</b>\n` +
    `/start — Restart the bot\n` +
    `/balance — Check balance\n` +
    `/referral — Get your referral link\n` +
    `/referrals — View your referrals\n` +
    `/withdraw — Request withdrawal\n` +
    `/help — Show this message` +
    (link ? `\n\n🔗 <b>Your Link:</b>\n<code>${link}</code>` : '')
  );
};

module.exports = {
  welcomeNew,
  welcomeBack,
  balanceMessage,
  myReferralsMessage,
  verificationResult,
  referrerRewardNotification,
  helpMessage,
};
