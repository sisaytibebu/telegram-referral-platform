'use strict';

const { Requirement, User } = require('../models');
const { checkAllRequirements, qualifyReferralIfEligible } = require('../services/verification/VerificationService');
const { success, error: apiError } = require('../utils/apiResponse');

// GET /api/requirements
const getRequirements = async (req, res, next) => {
  try {
    const requirements = await Requirement.findAll({
      where: { is_enabled: true },
      order: [['order_index', 'ASC']],
      attributes: ['id', 'name', 'type', 'url', 'description', 'order_index'],
    });
    return success(res, requirements);
  } catch (err) { next(err); }
};

// POST /api/requirements/verify
const verifyRequirements = async (req, res, next) => {
  try {
    const { telegram_id } = req.body;
    if (!telegram_id) return apiError(res, 'telegram_id required', 400);

    const user = await User.findOne({ where: { telegram_id } });
    if (!user) return apiError(res, 'User not found', 404);

    const { results, qualified, rewarded } = await qualifyReferralIfEligible(user);

    const formatted = results.map((r) => ({
      id:       r.requirement.id,
      name:     r.requirement.name,
      type:     r.requirement.type,
      verified: r.verified,
    }));

    return success(res, {
      verifications:   formatted,
      all_complete:    qualified,
      referral_rewarded: rewarded || false,
    });
  } catch (err) { next(err); }
};

module.exports = { getRequirements, verifyRequirements };
