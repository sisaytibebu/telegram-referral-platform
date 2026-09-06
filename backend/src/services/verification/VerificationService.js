'use strict';

const { Requirement, RequirementVerification, Referral, sequelize } = require('../../models');
const { checkMembership } = require('../telegram/TelegramService');
const { verifySubscription } = require('../youtube/YouTubeService');
const WalletService = require('../wallet/WalletService');
const logger = require('../../utils/logger');

/**
 * Check all requirements for a user and update verification records.
 *
 * Telegram requirements: verified in real-time via Bot API getChatMember.
 * YouTube requirements:  cannot be auto-verified via API — check if admin
 *                        has manually approved the user's self-report.
 *
 * Returns array of { requirement, verified, method } objects.
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

  // If DB has no requirements, use env-based fallback
  if (!requirements || requirements.length === 0) {
    const env = require('../../config/env');
    requirements = [
      { id: 1, name: 'Join Telegram Community', type: 'TELEGRAM', telegram_chat_id: env.TELEGRAM_CHAT_ID_1, is_enabled: true, order_index: 1 },
      { id: 2, name: 'Join Telegram Group',      type: 'TELEGRAM', telegram_chat_id: env.TELEGRAM_CHAT_ID_2, is_enabled: true, order_index: 2 },
      { id: 3, name: 'Subscribe YouTube Channel', type: 'YOUTUBE', telegram_chat_id: null, is_enabled: true, order_index: 3 },
    ];
  }

  const results = [];

  for (const req of requirements) {
    let verified = false;
    let method = 'unknown';

    if (req.type === 'TELEGRAM') {
      // Real-time check via Telegram Bot API
      verified = await checkMembership(req.telegram_chat_id, user.telegram_id);
      method = 'TELEGRAM_API';
    } else if (req.type === 'YOUTUBE') {
      // YouTube passes ONLY if user clicked the YouTube button
      try {
        const clickRecord = await RequirementVerification.findOne({
          where: {
            user_id: user.id,
            requirement_id: req.id,
          },
        });
        verified = !!(clickRecord && ['PENDING', 'VERIFIED'].includes(clickRecord.status));
      } catch (e) {
        verified = false;
      }
      method = 'BUTTON_CLICK';
    }

    // Upsert verification record — but NEVER overwrite a click record for YouTube
    const [record, created] = await RequirementVerification.findOrCreate({
      where: { user_id: user.id, requirement_id: req.id },
      defaults: { status: 'PENDING', verification_data: null },
    });

    if (verified && record.status !== 'VERIFIED') {
      // Mark as verified
      await record.update({
        status:            'VERIFIED',
        verified_at:       new Date(),
        verification_data: JSON.stringify({ method }),
      });
    } else if (!verified && req.type === 'TELEGRAM') {
      // Only update TELEGRAM failures — never overwrite YouTube click records
      if (record.status === 'PENDING' || record.status === 'FAILED') {
        await record.update({ status: 'FAILED' });
      }
    }
    // For YouTube: if not verified and record exists, leave it as-is (preserve click record)

    results.push({ requirement: req, verified, method });
  }

  return results;
};

/**
 * Check if all enabled requirements are met.
 */
const allRequirementsMet = (results) => results.every((r) => r.verified);

/**
 * Submit a YouTube self-report for a user.
 * Creates/updates a PENDING verification — admin must approve to count.
 */
const submitYouTubeSelfReport = async (userId, requirementId, youtubeChannelUrl) => {
  const { verifySubscription: verify } = require('../youtube/YouTubeService');
  const result = await verify(youtubeChannelUrl);

  await RequirementVerification.upsert({
    user_id:           userId,
    requirement_id:    requirementId,
    status:            'PENDING',  // Admin must approve
    verification_data: JSON.stringify({ ...result.data, submitted_at: new Date() }),
  });

  return result;
};

/**
 * Admin approves a YouTube verification.
 */
const approveYouTubeVerification = async (userId, requirementId) => {
  const [record] = await RequirementVerification.findOrCreate({
    where: { user_id: userId, requirement_id: requirementId },
    defaults: { status: 'PENDING' },
  });
  await record.update({ status: 'VERIFIED', verified_at: new Date() });
  return record;
};

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

  // Qualify and reward atomically — double-reward protected by UNIQUE constraint
  await sequelize.transaction(async (t) => {
    await referral.update({ status: 'QUALIFIED', qualified_at: new Date() }, { transaction: t });
    await WalletService.creditReferralReward(referral.referrer_id, referral.id, t);
    await referral.update({ status: 'REWARDED', rewarded_at: new Date() }, { transaction: t });
  });

  logger.info('Referral rewarded', { referral_id: referral.id, referrer_id: referral.referrer_id });
  return { qualified: true, results, rewarded: true, referral };
};

module.exports = {
  checkAllRequirements,
  allRequirementsMet,
  qualifyReferralIfEligible,
  submitYouTubeSelfReport,
  approveYouTubeVerification,
};
