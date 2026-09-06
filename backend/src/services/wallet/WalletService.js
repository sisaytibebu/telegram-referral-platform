'use strict';

const { User, Transaction, sequelize } = require('../../models');
const env = require('../../config/env');
const logger = require('../../utils/logger');

/**
 * Credit a referral reward to the referrer.
 * Must be called inside an existing transaction.
 */
const creditReferralReward = async (userId, referralId, t) => {
  const user = await User.findByPk(userId, { transaction: t, lock: true });
  if (!user) throw new Error(`User ${userId} not found`);

  const reward = parseFloat(env.REFERRAL_REWARD);
  const balanceBefore = parseFloat(user.balance);
  const balanceAfter = balanceBefore + reward;

  await Transaction.create({
    user_id:        userId,
    type:           'REFERRAL_REWARD',
    amount:         reward,
    currency:       'USD',
    balance_before: balanceBefore.toFixed(2),
    balance_after:  balanceAfter.toFixed(2),
    reference_type: 'referral',
    reference_id:   referralId,
    description:    'Referral reward',
    status:         'COMPLETED',
  }, { transaction: t });

  await user.update({
    balance:      balanceAfter.toFixed(2),
    total_earned: (parseFloat(user.total_earned) + reward).toFixed(2),
  }, { transaction: t });

  logger.info('Referral reward credited', { user_id: userId, amount: reward });
};

/**
 * Get user balance summary.
 */
const getBalanceSummary = async (userId) => {
  const user = await User.findByPk(userId);
  if (!user) throw new Error('User not found');

  return {
    balance:         parseFloat(user.balance).toFixed(2),
    total_earned:    parseFloat(user.total_earned).toFixed(2),
    total_withdrawn: parseFloat(user.total_withdrawn).toFixed(2),
  };
};

module.exports = { creditReferralReward, getBalanceSummary };
