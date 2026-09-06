'use strict';

const { v4: uuidv4 } = require('uuid');
const { User, Referral, sequelize } = require('../../models');
const logger = require('../../utils/logger');

/**
 * Generate a unique 8-character referral code.
 */
const generateReferralCode = () => {
  return uuidv4().replace(/-/g, '').substring(0, 8).toUpperCase();
};

/**
 * Find or create a user from Telegram data.
 * Returns { user, isNew, referral }
 */
const findOrCreateUser = async (telegramUser, referralCode = null) => {
  const { id: telegramId, username, first_name, last_name } = telegramUser;

  // Check existing user
  let user = await User.findOne({ where: { telegram_id: telegramId } });

  if (user) {
    // Update last seen and profile info
    await user.update({
      username:     username || user.username,
      first_name:   first_name || user.first_name,
      last_name:    last_name || user.last_name,
      last_seen_at: new Date(),
    });
    return { user, isNew: false, referral: null };
  }

  // Generate unique referral code
  let code;
  let attempts = 0;
  do {
    code = generateReferralCode();
    const existing = await User.findOne({ where: { referral_code: code } });
    if (!existing) break;
    attempts++;
  } while (attempts < 10);

  // Find referrer if code was provided
  let referrer = null;
  if (referralCode) {
    referrer = await User.findOne({ where: { referral_code: referralCode } });
    // Prevent self-referral (same telegram_id can't refer themselves)
    if (referrer && referrer.telegram_id === telegramId) {
      referrer = null;
    }
  }

  // Create user + referral atomically
  const result = await sequelize.transaction(async (t) => {
    const newUser = await User.create({
      telegram_id:   telegramId,
      username:      username || null,
      first_name:    first_name || null,
      last_name:     last_name || null,
      referral_code: code,
      referred_by_id: referrer ? referrer.id : null,
      last_seen_at:  new Date(),
    }, { transaction: t });

    let referral = null;
    if (referrer) {
      referral = await Referral.create({
        referrer_id:      referrer.id,
        referred_user_id: newUser.id,
        status:           'PENDING',
      }, { transaction: t });

      logger.info('Referral created', {
        referrer_id: referrer.id,
        referred_user_id: newUser.id,
      });
    }

    return { user: newUser, referral };
  });

  logger.info('New user registered', { telegram_id: telegramId });
  return { user: result.user, isNew: true, referral: result.referral };
};

/**
 * Get referral stats for a user.
 */
const getReferralStats = async (userId) => {
  const total = await Referral.count({ where: { referrer_id: userId } });
  const qualified = await Referral.count({ where: { referrer_id: userId, status: 'QUALIFIED' } });
  const rewarded = await Referral.count({ where: { referrer_id: userId, status: 'REWARDED' } });
  const pending = await Referral.count({ where: { referrer_id: userId, status: 'PENDING' } });

  return { total, qualified, rewarded, pending };
};

module.exports = { findOrCreateUser, generateReferralCode, getReferralStats };
