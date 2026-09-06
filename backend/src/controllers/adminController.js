'use strict';

const argon2 = require('argon2');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const { Op } = require('sequelize');
const {
  Admin, User, Referral, Transaction, Withdrawal,
  Requirement, AuditLog, Setting, sequelize,
} = require('../models');
const { approveWithdrawal, rejectWithdrawal } = require('../services/withdrawal/WithdrawalService');
const { success, error: apiError, paginated } = require('../utils/apiResponse');
const env = require('../config/env');
const logger = require('../utils/logger');

// ── Auth ──────────────────────────────────────────────────────────────────────

const validateLogin = [
  body('username').notEmpty(),
  body('password').notEmpty(),
];

// POST /api/admin/login
const login = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return apiError(res, 'Username and password required', 400);

    const { username, password } = req.body;
    const admin = await Admin.findOne({ where: { username, is_active: true } });
    if (!admin) return apiError(res, 'Invalid credentials', 401);

    const valid = await argon2.verify(admin.password_hash, password);
    if (!valid) return apiError(res, 'Invalid credentials', 401);

    await admin.update({
      last_login_at: new Date(),
      last_login_ip: req.ip,
    });

    const token = jwt.sign(
      { id: admin.id, username: admin.username, role: admin.role },
      env.JWT_SECRET,
      { expiresIn: env.JWT_EXPIRES_IN }
    );

    logger.info('Admin login', { username: admin.username, ip: req.ip });
    return success(res, { token, admin: { id: admin.id, username: admin.username, role: admin.role } });
  } catch (err) { next(err); }
};

// ── Dashboard ─────────────────────────────────────────────────────────────────

// GET /api/admin/dashboard
const getDashboard = async (req, res, next) => {
  try {
    const [
      totalUsers, activeUsers,
      totalReferrals, qualifiedReferrals,
      totalTransactions, pendingWithdrawals,
      totalWithdrawn,
    ] = await Promise.all([
      User.count(),
      User.count({ where: { is_active: true } }),
      Referral.count(),
      Referral.count({ where: { status: 'REWARDED' } }),
      Transaction.count({ where: { type: 'REFERRAL_REWARD', status: 'COMPLETED' } }),
      Withdrawal.count({ where: { status: 'PENDING' } }),
      Withdrawal.sum('amount', { where: { status: 'PAID' } }),
    ]);

    const totalRewards = await Transaction.sum('amount', {
      where: { type: 'REFERRAL_REWARD', status: 'COMPLETED' },
    });

    return success(res, {
      total_users:          totalUsers,
      active_users:         activeUsers,
      total_referrals:      totalReferrals,
      qualified_referrals:  qualifiedReferrals,
      total_rewards:        parseFloat(totalRewards || 0).toFixed(2),
      total_withdrawn:      parseFloat(totalWithdrawn || 0).toFixed(2),
      pending_withdrawals:  pendingWithdrawals,
    });
  } catch (err) { next(err); }
};

// ── Users ─────────────────────────────────────────────────────────────────────

// GET /api/admin/users
const getUsers = async (req, res, next) => {
  try {
    const page  = parseInt(req.query.page  || '1');
    const limit = parseInt(req.query.limit || '20');
    const search = req.query.search || '';
    const offset = (page - 1) * limit;

    const where = search ? {
      [Op.or]: [
        { username:   { [Op.like]: `%${search}%` } },
        { first_name: { [Op.like]: `%${search}%` } },
      ],
    } : {};

    const { count, rows } = await User.findAndCountAll({
      where, order: [['created_at', 'DESC']], limit, offset,
    });
    return paginated(res, rows, count, page, limit);
  } catch (err) { next(err); }
};

// GET /api/admin/users/:id
const getUserById = async (req, res, next) => {
  try {
    const user = await User.findByPk(req.params.id, {
      include: [
        { model: Referral, as: 'referrals_made', limit: 10, order: [['created_at', 'DESC']] },
        { model: Transaction, as: 'transactions', limit: 10, order: [['created_at', 'DESC']] },
      ],
    });
    if (!user) return apiError(res, 'User not found', 404);
    return success(res, user);
  } catch (err) { next(err); }
};

// ── Referrals ─────────────────────────────────────────────────────────────────

// GET /api/admin/referrals
const getReferrals = async (req, res, next) => {
  try {
    const page   = parseInt(req.query.page   || '1');
    const limit  = parseInt(req.query.limit  || '20');
    const status = req.query.status;
    const offset = (page - 1) * limit;
    const where  = status ? { status } : {};

    const { count, rows } = await Referral.findAndCountAll({
      where,
      include: [
        { model: User, as: 'referrer',      attributes: ['id', 'username', 'first_name', 'telegram_id'] },
        { model: User, as: 'referred_user', attributes: ['id', 'username', 'first_name', 'telegram_id'] },
      ],
      order: [['created_at', 'DESC']], limit, offset,
    });
    return paginated(res, rows, count, page, limit);
  } catch (err) { next(err); }
};

// ── Transactions ──────────────────────────────────────────────────────────────

// GET /api/admin/transactions
const getTransactions = async (req, res, next) => {
  try {
    const page   = parseInt(req.query.page  || '1');
    const limit  = parseInt(req.query.limit || '20');
    const offset = (page - 1) * limit;
    const where  = req.query.type ? { type: req.query.type } : {};

    const { count, rows } = await Transaction.findAndCountAll({
      where,
      include: [{ model: User, attributes: ['id', 'username', 'first_name', 'telegram_id'] }],
      order: [['created_at', 'DESC']], limit, offset,
    });
    return paginated(res, rows, count, page, limit);
  } catch (err) { next(err); }
};

// ── Withdrawals ───────────────────────────────────────────────────────────────

// GET /api/admin/withdrawals
const getWithdrawals = async (req, res, next) => {
  try {
    const page   = parseInt(req.query.page   || '1');
    const limit  = parseInt(req.query.limit  || '20');
    const status = req.query.status || 'PENDING';
    const offset = (page - 1) * limit;

    const { count, rows } = await Withdrawal.findAndCountAll({
      where: status === 'ALL' ? {} : { status },
      include: [{ model: User, attributes: ['id', 'username', 'first_name', 'telegram_id'] }],
      order: [['created_at', 'DESC']], limit, offset,
    });
    return paginated(res, rows, count, page, limit);
  } catch (err) { next(err); }
};

// POST /api/admin/withdrawals/:id/approve
const approveWithdrawalHandler = async (req, res, next) => {
  try {
    const withdrawal = await approveWithdrawal(req.params.id, req.admin.id);
    await AuditLog.create({
      admin_id:    req.admin.id,
      action:      'WITHDRAWAL_APPROVED',
      entity_type: 'withdrawal',
      entity_id:   withdrawal.id,
      ip_address:  req.ip,
    });
    return success(res, withdrawal, 'Withdrawal approved');
  } catch (err) {
    if (err.statusCode) return apiError(res, err.message, err.statusCode);
    next(err);
  }
};

// POST /api/admin/withdrawals/:id/reject
const rejectWithdrawalHandler = async (req, res, next) => {
  try {
    const { note } = req.body;
    const withdrawal = await rejectWithdrawal(req.params.id, req.admin.id, note);
    await AuditLog.create({
      admin_id:    req.admin.id,
      action:      'WITHDRAWAL_REJECTED',
      entity_type: 'withdrawal',
      entity_id:   withdrawal.id,
      new_values:  JSON.stringify({ note }),
      ip_address:  req.ip,
    });
    return success(res, withdrawal, 'Withdrawal rejected');
  } catch (err) {
    if (err.statusCode) return apiError(res, err.message, err.statusCode);
    next(err);
  }
};

// ── Settings ──────────────────────────────────────────────────────────────────

// GET /api/admin/settings
const getSettings = async (req, res, next) => {
  try {
    const settings = await Setting.findAll({ order: [['key', 'ASC']] });
    return success(res, settings);
  } catch (err) { next(err); }
};

// PUT /api/admin/settings
const updateSettings = async (req, res, next) => {
  try {
    const updates = req.body; // { key: value, ... }
    for (const [key, value] of Object.entries(updates)) {
      await Setting.update({ value: String(value) }, { where: { key } });
      await AuditLog.create({
        admin_id:    req.admin.id,
        action:      'SETTING_UPDATED',
        entity_type: 'setting',
        new_values:  JSON.stringify({ key, value }),
        ip_address:  req.ip,
      });
    }
    return success(res, null, 'Settings updated');
  } catch (err) { next(err); }
};

// ── Requirements ──────────────────────────────────────────────────────────────

// GET /api/admin/requirements
const getAdminRequirements = async (req, res, next) => {
  try {
    const reqs = await Requirement.findAll({ order: [['order_index', 'ASC']] });
    return success(res, reqs);
  } catch (err) { next(err); }
};

// POST /api/admin/requirements
const createRequirement = async (req, res, next) => {
  try {
    const req_ = await Requirement.create(req.body);
    await AuditLog.create({ admin_id: req.admin.id, action: 'REQUIREMENT_CREATED', entity_type: 'requirement', entity_id: req_.id, ip_address: req.ip });
    return success(res, req_, 'Requirement created', 201);
  } catch (err) { next(err); }
};

// PUT /api/admin/requirements/:id
const updateRequirement = async (req, res, next) => {
  try {
    const req_ = await Requirement.findByPk(req.params.id);
    if (!req_) return apiError(res, 'Requirement not found', 404);
    await req_.update(req.body);
    await AuditLog.create({ admin_id: req.admin.id, action: 'REQUIREMENT_UPDATED', entity_type: 'requirement', entity_id: req_.id, ip_address: req.ip });
    return success(res, req_, 'Requirement updated');
  } catch (err) { next(err); }
};

// DELETE /api/admin/requirements/:id
const deleteRequirement = async (req, res, next) => {
  try {
    const req_ = await Requirement.findByPk(req.params.id);
    if (!req_) return apiError(res, 'Requirement not found', 404);
    await req_.destroy();
    await AuditLog.create({ admin_id: req.admin.id, action: 'REQUIREMENT_DELETED', entity_type: 'requirement', entity_id: parseInt(req.params.id), ip_address: req.ip });
    return success(res, null, 'Requirement deleted');
  } catch (err) { next(err); }
};

// ── Audit Logs ────────────────────────────────────────────────────────────────

// POST /api/admin/youtube/approve
const approveYouTubeVerificationHandler = async (req, res, next) => {
  try {
    const { user_id, requirement_id } = req.body;
    if (!user_id || !requirement_id) return apiError(res, 'user_id and requirement_id required', 400);
    const { approveYouTubeVerification } = require('../services/verification/VerificationService');
    const record = await approveYouTubeVerification(user_id, requirement_id);
    await AuditLog.create({
      admin_id:    req.admin.id,
      action:      'YOUTUBE_VERIFICATION_APPROVED',
      entity_type: 'requirement_verification',
      entity_id:   record.id,
      ip_address:  req.ip,
    });
    return success(res, record, 'YouTube verification approved');
  } catch (err) { next(err); }
};

// GET /api/admin/audit-logs
const getAuditLogs = async (req, res, next) => {
  try {
    const page  = parseInt(req.query.page  || '1');
    const limit = parseInt(req.query.limit || '20');
    const offset = (page - 1) * limit;
    const { count, rows } = await AuditLog.findAndCountAll({
      include: [{ model: Admin, attributes: ['id', 'username'] }],
      order: [['created_at', 'DESC']], limit, offset,
    });
    return paginated(res, rows, count, page, limit);
  } catch (err) { next(err); }
};

module.exports = {
  validateLogin, login,
  getDashboard,
  getUsers, getUserById,
  getReferrals,
  getTransactions,
  getWithdrawals, approveWithdrawalHandler, rejectWithdrawalHandler,
  getSettings, updateSettings,
  getAdminRequirements, createRequirement, updateRequirement, deleteRequirement,
  getAuditLogs,
  approveYouTubeVerificationHandler,
};
