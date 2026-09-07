'use strict';

const { Requirement, RequirementVerification, Referral, sequelize } = require('../../models');
const { checkMembership } = require('../telegram/TelegramService');
const WalletService = require('../wallet/WalletService');
const logger = require('../../utils/logger');

/**
 * Check all requirements for a user.
 * - Telegram: real Bot API check
 * - YouTube: passes only if user clicked the YouTube button
 */
const checkAllRequirements = async (user) => {
  let requirements;
  try {
    requirements = await Requirement.findAll({
      where: { is_enabled: true },
      order: [['order_index', 'ASC']],
    });
  } catch (e) {
    requirements = [];
  }

  // Fallback if DB is empty
  if (!requirements || requirements.length === 0) {
    const env = require('../../config/env');
    requirements = [
      { id: 1, name: 'Join Telegram Community',  type: 'TELEGRAM', telegram_chat_id: env.TELEGRAM_CHAT_ID_1, is_enabled: true, order_index: 1 },
      { id: 2, name: 'Join Telegram Group',       type: 'TELEGRAM', telegram_chat_id: env.TELEGRAM_CHAT_ID_2, is_enabled: true, order_index: 2 },
      { id: 3, name: 'Subscribe YouTube Channel', type: 'YOUTUBE',  telegram_chat_id: null,                   is_enabled: true, order_index: 3 },
    ];
  }

  const results = [];

  for (const req of requirements) {
    let verified = false;
    let method = 'unknown';

    if (req.type === 'TELEGRAM') {
      verified = await checkMembership(req.telegram_chat_id, user.telegram_id);
      method = 'TELEGRAM_API';
    } else if (req.type === 'YOUTUBE') {
      // YouTube passes ONLY if user clicked the ▶️ Subscribe YouTube Channel button
      try {
        const clickRecord = await RequirementVerification.findOne({
          where: { user_id: user.id, requirement_id: req.id },
        });
        verified = !!(clickRecord && ['PENDING', 'VERIFIED'].includes(clickRecord.status));
      } catch (e) {
        verified = false;
      }
      method = 'BUTTON_CLICK';
    }

    // Update verification record — never overwrite YouTube click records
    const [record] = await RequirementVerification.findOrCreate({
      where: { user_id: user.id, requirement_id: req.id },
      defaults: { status: 'PENDING', verification_data: null },
    });

    if (verified && record.status !== 'VERIFIED') {
      await record.update({
        status:            'VERIFIED',
        verified_at:       new Date(),
        verification_data: JSON.stringify({ method }),
      });
    } else if (!verified && req.type === 'TELEGRAM') {
      // Only mark Telegram as failed — never touch YouTube click records
      if (['PENDING', 'FAILED'].includes(record.status)) {
        await record.update({ status: 'FAILED' });
      }
    }

    results.push({ requirement: req, verified, method });
  }

  return results;
};

const allRequirementsMet = (results) => results.every((r) => r.verified);

/**
 * When user completes all requirements:
 * 1. Credit $0.75 to the USER themselves (for completing)
 * 2. Credit $0.75 to their REFERRER (if they were invited)
 *
 * Both rewards are idempotent — protected by DB constraints.
 */
const qualifyReferralIfEligible = async (user) => {
  const results = await checkAllRequirements(user);
  if (!allRequirementsMet(results)) return { qualified: false, results };

  let userRewarded = false;
  let referral = null;
  let referrerRewarded = false;

  await sequelize.transaction(async (t) => {
    // Reload user inside transaction with lock
    const freshUser = await user.constructor.findByPk(user.id, { transaction: t, lock: true });

    // ── Reward 1: Credit $0.75 to the user themselves ──────────────────────────
    // Only if they haven't already received their own completion reward
    const alreadyGotOwnReward = await freshUser.constructor.sequelize.query(
      `SELECT id FROM transactions WHERE user_id = :uid AND type = 'REFERRAL_REWARD' AND description = 'Completion reward' LIMIT 1`,
      { replacements: { uid: user.id }, type: freshUser.constructor.sequelize.QueryTypes.SELECT, transaction: t }
    );

    if (alreadyGotOwnReward.length === 0) {
      await WalletService.creditReferralReward(user.id, null, t, 'Completion reward');
      userRewarded = true;
      logger.info('Completion reward credited to user', { user_id: user.id });
    }

    // ── Reward 2: Credit $0.75 to referrer if user was invited ─────────────────
    referral = await Referral.findOne({
      where: { referred_user_id: user.id, status: 'PENDING' },
      transaction: t,
      lock: true,
    });

    if (referral) {
      await referral.update({ status: 'QUALIFIED', qualified_at: new Date() }, { transaction: t });
      await WalletService.creditReferralReward(referral.referrer_id, referral.id, t, 'Referral reward');
      await referral.update({ status: 'REWARDED', rewarded_at: new Date() }, { transaction: t });
      referrerRewarded = true;
      logger.info('Referral reward credited to referrer', { referrer_id: referral.referrer_id });
    }
  });

  // Reload to get updated balance
  await user.reload();

  // Post earn notification to groups
  try {
    const { getBot } = require('../telegram/TelegramService');
    const { postEarnNotification } = require('../telegram/GroupNotificationService');
    const bot = getBot();
    if (bot && userRewarded) {
      await postEarnNotification(bot, user.telegram_id);
    }
  } catch (e) {
    logger.warn('Could not post earn notification', { error: e.message });
  }

  return { qualified: true, results, userRewarded, referral, referrerRewarded };
};

module.exports = {
  checkAllRequirements,
  allRequirementsMet,
  qualifyReferralIfEligible,
};
