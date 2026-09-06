'use strict';

const { User, Withdrawal, Transaction, sequelize } = require('../../models');
const env = require('../../config/env');
const logger = require('../../utils/logger');

const MIN_WITHDRAWAL = parseFloat(env.MIN_WITHDRAWAL || '10.00');

/**
 * Create a withdrawal request with ledger reservation.
 * Full transaction safety — prevents concurrent double-spend.
 */
const createWithdrawal = async (userId, amount, paymentMethod, paymentDetails) => {
  amount = parseFloat(amount);

  if (isNaN(amount) || amount <= 0) {
    throw Object.assign(new Error('Invalid withdrawal amount'), { statusCode: 400 });
  }
  if (amount < MIN_WITHDRAWAL) {
    throw Object.assign(
      new Error(`Minimum withdrawal is $${MIN_WITHDRAWAL.toFixed(2)}`),
      { statusCode: 400 }
    );
  }

  return await sequelize.transaction(async (t) => {
    // Lock the user row to prevent concurrent withdrawals
    const user = await User.findByPk(userId, { transaction: t, lock: true });
    if (!user) throw Object.assign(new Error('User not found'), { statusCode: 404 });

    const balance = parseFloat(user.balance);
    if (balance < amount) {
      throw Object.assign(
        new Error(`Insufficient balance. Available: $${balance.toFixed(2)}`),
        { statusCode: 400 }
      );
    }

    // Check no pending withdrawal already exists
    const pendingExists = await Withdrawal.findOne({
      where: { user_id: userId, status: 'PENDING' },
      transaction: t,
      lock: true,
    });
    if (pendingExists) {
      throw Object.assign(
        new Error('You already have a pending withdrawal request'),
        { statusCode: 400 }
      );
    }

    const balanceBefore = balance;
    const balanceAfter = balance - amount;

    // Create withdrawal record
    const withdrawal = await Withdrawal.create({
      user_id:         userId,
      amount:          amount.toFixed(2),
      currency:        'USD',
      payment_method:  paymentMethod,
      payment_details: JSON.stringify(paymentDetails),
      status:          'PENDING',
    }, { transaction: t });

    // Create ledger transaction (debit)
    await Transaction.create({
      user_id:        userId,
      type:           'WITHDRAWAL',
      amount:         (-amount).toFixed(2),
      currency:       'USD',
      balance_before: balanceBefore.toFixed(2),
      balance_after:  balanceAfter.toFixed(2),
      reference_type: 'withdrawal',
      reference_id:   withdrawal.id,
      description:    `Withdrawal request #${withdrawal.id}`,
      status:         'PENDING',
    }, { transaction: t });

    // Reserve balance
    await user.update({
      balance:          balanceAfter.toFixed(2),
      total_withdrawn:  (parseFloat(user.total_withdrawn) + amount).toFixed(2),
    }, { transaction: t });

    logger.info('Withdrawal created', { user_id: userId, amount, withdrawal_id: withdrawal.id });
    return withdrawal;
  });
};

/**
 * Approve a withdrawal (admin action).
 */
const approveWithdrawal = async (withdrawalId, adminId) => {
  return await sequelize.transaction(async (t) => {
    const withdrawal = await Withdrawal.findByPk(withdrawalId, { transaction: t, lock: true });
    if (!withdrawal) throw Object.assign(new Error('Withdrawal not found'), { statusCode: 404 });
    if (withdrawal.status !== 'PENDING') {
      throw Object.assign(new Error(`Cannot approve a ${withdrawal.status} withdrawal`), { statusCode: 400 });
    }

    await withdrawal.update({
      status:       'PAID',
      admin_id:     adminId,
      processed_at: new Date(),
    }, { transaction: t });

    // Mark ledger transaction as completed
    await Transaction.update(
      { status: 'COMPLETED' },
      { where: { reference_type: 'withdrawal', reference_id: withdrawalId }, transaction: t }
    );

    logger.info('Withdrawal approved', { withdrawal_id: withdrawalId, admin_id: adminId });
    return withdrawal;
  });
};

/**
 * Reject a withdrawal — reverse the balance deduction.
 */
const rejectWithdrawal = async (withdrawalId, adminId, note = '') => {
  return await sequelize.transaction(async (t) => {
    const withdrawal = await Withdrawal.findByPk(withdrawalId, { transaction: t, lock: true });
    if (!withdrawal) throw Object.assign(new Error('Withdrawal not found'), { statusCode: 404 });
    if (withdrawal.status !== 'PENDING') {
      throw Object.assign(new Error(`Cannot reject a ${withdrawal.status} withdrawal`), { statusCode: 400 });
    }

    const user = await User.findByPk(withdrawal.user_id, { transaction: t, lock: true });
    const amount = parseFloat(withdrawal.amount);
    const balanceBefore = parseFloat(user.balance);
    const balanceAfter = balanceBefore + amount;

    // Reverse balance
    await user.update({
      balance:         balanceAfter.toFixed(2),
      total_withdrawn: (parseFloat(user.total_withdrawn) - amount).toFixed(2),
    }, { transaction: t });

    // Create reversal ledger entry
    await Transaction.create({
      user_id:        withdrawal.user_id,
      type:           'WITHDRAWAL_REVERSAL',
      amount:         amount.toFixed(2),
      currency:       'USD',
      balance_before: balanceBefore.toFixed(2),
      balance_after:  balanceAfter.toFixed(2),
      reference_type: 'withdrawal',
      reference_id:   withdrawalId,
      description:    `Withdrawal #${withdrawalId} rejected`,
      status:         'COMPLETED',
    }, { transaction: t });

    await withdrawal.update({
      status:       'REJECTED',
      admin_id:     adminId,
      admin_note:   note,
      processed_at: new Date(),
    }, { transaction: t });

    // Mark original ledger transaction as reversed
    await Transaction.update(
      { status: 'REVERSED' },
      { where: { reference_type: 'withdrawal', reference_id: withdrawalId, type: 'WITHDRAWAL' }, transaction: t }
    );

    logger.info('Withdrawal rejected', { withdrawal_id: withdrawalId, admin_id: adminId });
    return withdrawal;
  });
};

module.exports = { createWithdrawal, approveWithdrawal, rejectWithdrawal };
