'use strict';

const { body, validationResult } = require('express-validator');
const { User, Withdrawal } = require('../models');
const { createWithdrawal } = require('../services/withdrawal/WithdrawalService');
const { success, error: apiError, paginated } = require('../utils/apiResponse');

const validateWithdrawal = [
  body('telegram_id').notEmpty().withMessage('telegram_id required'),
  body('amount').isFloat({ min: 0.01 }).withMessage('Valid amount required'),
  body('payment_method').notEmpty().withMessage('payment_method required'),
  body('payment_details').notEmpty().withMessage('payment_details required'),
];

// POST /api/withdrawals
const requestWithdrawal = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return apiError(res, errors.array()[0].msg, 400);

    const { telegram_id, amount, payment_method, payment_details } = req.body;

    const user = await User.findOne({ where: { telegram_id } });
    if (!user) return apiError(res, 'User not found', 404);
    if (user.is_banned) return apiError(res, 'Account suspended', 403);

    const withdrawal = await createWithdrawal(user.id, amount, payment_method, payment_details);
    return success(res, withdrawal, 'Withdrawal request submitted', 201);
  } catch (err) {
    if (err.statusCode) return apiError(res, err.message, err.statusCode);
    next(err);
  }
};

// GET /api/withdrawals
const getMyWithdrawals = async (req, res, next) => {
  try {
    const telegramId = req.query.telegram_id;
    if (!telegramId) return apiError(res, 'telegram_id required', 400);

    const user = await User.findOne({ where: { telegram_id: telegramId } });
    if (!user) return apiError(res, 'User not found', 404);

    const page = parseInt(req.query.page || '1');
    const limit = parseInt(req.query.limit || '10');
    const offset = (page - 1) * limit;

    const { count, rows } = await Withdrawal.findAndCountAll({
      where: { user_id: user.id },
      order: [['created_at', 'DESC']],
      limit, offset,
    });

    return paginated(res, rows, count, page, limit);
  } catch (err) { next(err); }
};

module.exports = { validateWithdrawal, requestWithdrawal, getMyWithdrawals };
