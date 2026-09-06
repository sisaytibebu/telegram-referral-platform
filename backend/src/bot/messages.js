'use strict';

const { getReferralLink } = require('./keyboards');

const welcomeNew = (user, requirements) => {
  const reqList = requirements
    .map((r, i) => `${i + 1}. ${r.type === 'TELEGRAM' ? '📢' : '▶️'} ${r.name}`)
    .join('\n');

  return `👋 <b>Welcome, ${user.first_name || 'Friend'}!</b>

To participate in our referral program, complete the required tasks below:

${reqList}

After completing them, press <b>✅ Check Requirements</b> below.

🔗 <b>Your referral link:</b>
<code>${getReferralLink(user.referral_code)}</code>

Share this link and earn <b>$0.75</b> for every verified referral!`;
};

const welcomeBack = (user) =>
  `👋 Welcome back, <b>${user.first_name || 'Friend'}!</b>

What would you like to do?`;

const balanceMessage = (user, stats) =>
  `💰 <b>Your Balance</b>

💵 Available: <b>$${parseFloat(user.balance).toFixed(2)}</b>
💸 Withdrawn: <b>$${parseFloat(user.total_withdrawn).toFixed(2)}</b>
📈 Total Earned: <b>$${parseFloat(user.total_earned).toFixed(2)}</b>

👥 Referrals: <b>${stats.total}</b>
✅ Qualified: <b>${stats.rewarded}</b>
⏳ Pending: <b>${stats.pending}</b>

🔗 <b>Your referral link:</b>
<code>${getReferralLink(user.referral_code)}</code>`;

const verificationResult = (results) => {
  const lines = results.map((r) => {
    const icon = r.verified ? '✅' : '❌';
    return `${icon} ${r.requirement.name}`;
  });

  const allDone = results.every((r) => r.verified);
  const summary = allDone
    ? '\n\n🎉 <b>All requirements completed!</b>\nYou are now eligible to earn referral rewards.'
    : '\n\n⚠️ Please complete the remaining requirements.';

  return `<b>Verification Status</b>\n\n${lines.join('\n')}${summary}`;
};

const helpMessage = () =>
  `ℹ️ <b>Help</b>

<b>How it works:</b>
1. Share your referral link with friends
2. They join the bot and complete requirements
3. You earn <b>$0.75</b> per verified referral
4. Withdraw when you reach <b>$10.00</b>

<b>Commands:</b>
/start - Start the bot
/balance - Check your balance
/referral - Get your referral link
/referrals - See your referrals
/withdraw - Request a withdrawal
/help - Show this message

<b>Requirements to qualify:</b>
• Join both Telegram communities
• Subscribe to our YouTube channel`;

module.exports = { welcomeNew, welcomeBack, balanceMessage, verificationResult, helpMessage };
