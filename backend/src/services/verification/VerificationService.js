'use strict';

const { Requirement, RequirementVerification, Referral, sequelize } = require('../../models');
const { checkMembership } = require('../telegram/TelegramService');
const WalletService = require('../wallet/WalletService');
const logger = require('../../utils/logger');

/**
 * Check all requirements for a user and update verification records.
 * Returns array of { requirement, verified } objects.
 */
const checkAllRequirements = async (user) => {
  const requirements = await Requirement.findAll({
    where: { is_enabled: true },
    order: [['order_index', 'ASC']],
  });

  const results = [];

  for (const req of requirements) {
    let verified = false;

    if (req.type === 'TELEGRAM') {
      verified = await checkMembership(req.telegram_chat_id, user.telegram_id);
    } else if (req.type === 'YOUTUBE') {
      // YouTube subscription cannot be verified directly via API.
      // Check if user has manually confirmed (set via admin or self-report flow).
      const existing = await RequirementVerification.findOne({
        where: { user_id: user.id, requirement_id: req.id, status: 'VERIFIED' },
      });
      verified = !!existing;
    }

    // Upsert verification record
    const [record] = await RequirementVerification.findOrCreate({
      where: { user_id: user.id, requirement_id: req.id },
      defaults: { status: 'PENDING' },
    });

    if (verified && record.status !== 'VERIFIED') {
      await record.update({ status: 'VERIFIED', verified_at: new Date() });
    } else if (!verified && record.status === 'PENDING') {
      await record.update({ status: 'FAILED' });
    }

    results.push({ requirement: req, verified });
  }

  return results;
};

/**
 * Check if all requirements are met.
 */
const allRequirementsMet = (results) => results.every((r) => r.verified);

/**
 * Qualify a referral and reward the referrer if all requirements are met.
 */
const qualifyReferralIfEligible = async (user) => {
  const results = await checkAllRequirements(user);
  if (!allRequirementsMet(results)) return { qualified: false, results };

  // Find pending referral where this user is the referred user
  const referral = await Referral.findOne({
    where: { referred_user_id: user.id, status: 'PENDING' },
  });

  if (!referral) return { qualified: true, results, rewarded: false };

  // Qualify and reward in a single transaction
  await sequelize.transaction(async (t) => {
    await referral.update({ status: 'QUALIFIED', qualified_at: new Date() }, { transaction: t });
    await WalletService.creditReferralReward(referral.referrer_id, referral.id, t);
    await referral.update({ status: 'REWARDED', rewarded_at: new Date() }, { transaction: t });
  });

  logger.info('Referral rewarded', { referral_id: referral.id, referrer_id: referral.referrer_id });
  return { qualified: true, results, rewarded: true, referral };
};

module.exports = { checkAllRequirements, allRequirementsMet, qualifyReferralIfEligible };
