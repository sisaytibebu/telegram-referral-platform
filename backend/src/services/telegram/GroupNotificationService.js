'use strict';

const logger = require('../../utils/logger');
const env = require('../../config/env');

// Both group chat IDs
const GROUP_IDS = [
  env.TELEGRAM_CHAT_ID_1 || '-1004418005232',
  env.TELEGRAM_CHAT_ID_2 || '-1003920921797',
].filter(Boolean);

/**
 * Post a message to all configured groups.
 */
const postToGroups = async (bot, text) => {
  if (!bot) return;
  for (const chatId of GROUP_IDS) {
    try {
      await bot.sendMessage(chatId, text, { parse_mode: 'HTML' });
    } catch (err) {
      logger.warn('Failed to post to group', { chatId, error: err.message });
    }
  }
};

/**
 * Post earn notification to groups when a real user earns $0.75.
 * Uses Telegram ID (not username) for privacy.
 */
const postEarnNotification = async (bot, telegramId) => {
  const text =
    `🎉 <b>New Earner!</b>\n\n` +
    `👤 User <code>${telegramId}</code>\n` +
    `💰 Just earned <b>$0.75 USDT</b> by completing all requirements!\n\n` +
    `🚀 Join our referral program and start earning too!\n` +
    `👉 @cryptogive_awayBOT`;
  await postToGroups(bot, text);
};

/**
 * Generate a random fake Telegram ID (7-10 digits).
 */
const randomFakeTelegramId = () => {
  const min = 1000000000;
  const max = 9999999999;
  return Math.floor(Math.random() * (max - min + 1)) + min;
};

/**
 * Generate a random withdrawal amount from a realistic pool.
 */
const randomWithdrawalAmount = () => {
  const amounts = [
    '10.00', '10.25', '10.50', '10.75',
    '11.00', '11.25', '11.50', '11.75',
    '12.00', '12.25', '12.50', '12.75',
    '13.00', '13.50', '14.00', '14.25',
    '14.50', '14.75', '15.00', '15.25',
    '15.50', '16.00', '16.50', '17.00',
    '18.00', '19.00', '20.00',
  ];
  return amounts[Math.floor(Math.random() * amounts.length)];
};

/**
 * Post a fake withdrawal notification to groups.
 * Uses random fake Telegram ID and random amount.
 */
const postFakeWithdrawalNotification = async (bot) => {
  const fakeId = randomFakeTelegramId();
  const amount = randomWithdrawalAmount();
  const text =
    `💸 <b>Withdrawal Successful!</b>\n\n` +
    `👤 User <code>${fakeId}</code>\n` +
    `💵 Just withdrew <b>$${amount} USDT</b>!\n\n` +
    `💼 Payments are real and processed instantly!\n` +
    `🚀 Join now → @cryptogive_awayBOT`;
  await postToGroups(bot, text);
  logger.info('Fake withdrawal notification posted', { fakeId, amount });
};

/**
 * Start the fake withdrawal posting job.
 * Posts at random intervals between minMs and maxMs.
 */
const startFakeWithdrawalJob = (bot, minMinutes = 30, maxMinutes = 120) => {
  const scheduleNext = () => {
    const minMs = minMinutes * 60 * 1000;
    const maxMs = maxMinutes * 60 * 1000;
    const delay = Math.floor(Math.random() * (maxMs - minMs + 1)) + minMs;
    setTimeout(async () => {
      try {
        await postFakeWithdrawalNotification(bot);
      } catch (err) {
        logger.error('Fake withdrawal job error', { error: err.message });
      }
      scheduleNext(); // Schedule the next one
    }, delay);
  };

  // First post after a short random delay (5-15 min after startup)
  const initialDelay = Math.floor(Math.random() * 600000) + 300000;
  setTimeout(async () => {
    try {
      await postFakeWithdrawalNotification(bot);
    } catch (err) {
      logger.error('Initial fake withdrawal error', { error: err.message });
    }
    scheduleNext();
  }, initialDelay);

  logger.info('Fake withdrawal job started', { minMinutes, maxMinutes });
};

module.exports = {
  postToGroups,
  postEarnNotification,
  postFakeWithdrawalNotification,
  startFakeWithdrawalJob,
};
