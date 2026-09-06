'use strict';

const { User, Transaction, Referral } = require('../models');
const { getReferralStats } = require('../services/referral/ReferralService');
const { success, error: apiError, paginated } = require('../utils/apiResponse');
const { Op } = require('sequelize');

// GET /api/users/me
const getMe = async (req, res, next) => {
  try {
    const telegramId = req.query.telegram_id;
    if (!telegramId) return apiError(res, 'telegram_id required', 400);

    const user = await User.findOne({ where: { telegram_id: telegramId } });
    if (!user) return apiError(res, 'User not found', 404);

    return success(res, {
      id:            user.id,
      telegram_id:   user.telegram_id,
      username:      user.username,
      first_name:    user.first_name,
      referral_code: user.referral_code,
    });
  } catch (err) { next(err); }
};

// GET /api/users/me/balance
const getBalance = async (req, res, next) => {
  try {
    const telegramId = req.query.telegram_id;
    if (!telegramId) return apiError(res, 'telegram_id required', 400);

    const user = await User.findOne({ where: { telegram_id: telegramId } });
    if (!user) return apiError(res, 'User not found', 404);

    const stats = await getReferralStats(user.id);
    return success(res, {
      balance:         parseFloat(user.balance).toFixed(2),
      total_earned:    parseFloat(user.total_earned).toFixed(2),
      total_withdrawn: parseFloat(user.total_withdrawn).toFixed(2),
      referral_stats:  stats,
    });
  } catch (err) { next(err); }
};

// GET /api/users/me/referrals
const getMyReferrals = async (req, res, next) => {
  try {
    const telegramId = req.query.telegram_id;
    if (!telegramId) return apiError(res, 'telegram_id required', 400);

    const user = await User.findOne({ where: { telegram_id: telegramId } });
    if (!user) return apiError(res, 'User not found', 404);

    const page = parseInt(req.query.page || '1');
    const limit = parseInt(req.query.limit || '10');
    const offset = (page - 1) * limit;

    const { count, rows } = await Referral.findAndCountAll({
      where: { referrer_id: user.id },
      include: [{ model: User, as: 'referred_user', attributes: ['id', 'username', 'first_name', 'created_at'] }],
      order: [['created_at', 'DESC']],
      limit,
      offset,
    });

    return paginated(res, rows, count, page, limit);
  } catch (err) { next(err); }
};

// GET /api/users/me/transactions
const getMyTransactions = async (req, res, next) => {
  try {
    const telegramId = req.query.telegram_id;
    if (!telegramId) return apiError(res, 'telegram_id required', 400);

    const user = await User.findOne({ where: { telegram_id: telegramId } });
    if (!user) return apiError(res, 'User not found', 404);

    const page = parseInt(req.query.page || '1');
    const limit = parseInt(req.query.limit || '20');
    const offset = (page - 1) * limit;

    const { count, rows } = await Transaction.findAndCountAll({
      where: { user_id: user.id },
      order: [['created_at', 'DESC']],
      limit,
      offset,
    });

    return paginated(res, rows, count, page, limit);
  } catch (err) { next(err); }
};

module.exports = { getMe, getBalance, getMyReferrals, getMyTransactions };
