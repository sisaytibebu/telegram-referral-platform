'use strict';

const { sequelize } = require('../config/database');
const { DataTypes } = require('sequelize');

// ── User ─────────────────────────────────────────────────────────────────────
const User = sequelize.define('User', {
  id:               { type: DataTypes.BIGINT.UNSIGNED, autoIncrement: true, primaryKey: true },
  telegram_id:      { type: DataTypes.BIGINT, allowNull: false, unique: true },
  username:         { type: DataTypes.STRING(100), allowNull: true },
  first_name:       { type: DataTypes.STRING(100), allowNull: true },
  last_name:        { type: DataTypes.STRING(100), allowNull: true },
  referral_code:    { type: DataTypes.STRING(20), allowNull: false, unique: true },
  referred_by_id:   { type: DataTypes.BIGINT.UNSIGNED, allowNull: true },
  balance:          { type: DataTypes.DECIMAL(12,2), allowNull: false, defaultValue: '0.00' },
  total_earned:     { type: DataTypes.DECIMAL(12,2), allowNull: false, defaultValue: '0.00' },
  total_withdrawn:  { type: DataTypes.DECIMAL(12,2), allowNull: false, defaultValue: '0.00' },
  is_active:        { type: DataTypes.BOOLEAN, defaultValue: true },
  is_banned:        { type: DataTypes.BOOLEAN, defaultValue: false },
  last_seen_at:     { type: DataTypes.DATE, allowNull: true },
}, { tableName: 'users', underscored: true });

// ── Referral ──────────────────────────────────────────────────────────────────
const Referral = sequelize.define('Referral', {
  id:               { type: DataTypes.BIGINT.UNSIGNED, autoIncrement: true, primaryKey: true },
  referrer_id:      { type: DataTypes.BIGINT.UNSIGNED, allowNull: false },
  referred_user_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false, unique: true },
  status:           { type: DataTypes.ENUM('PENDING','QUALIFIED','REWARDED','REJECTED'), defaultValue: 'PENDING' },
  reward_amount:    { type: DataTypes.DECIMAL(12,2), allowNull: true },
  qualified_at:     { type: DataTypes.DATE, allowNull: true },
  rewarded_at:      { type: DataTypes.DATE, allowNull: true },
}, { tableName: 'referrals', underscored: true });

// ── Transaction ───────────────────────────────────────────────────────────────
const Transaction = sequelize.define('Transaction', {
  id:             { type: DataTypes.BIGINT.UNSIGNED, autoIncrement: true, primaryKey: true },
  user_id:        { type: DataTypes.BIGINT.UNSIGNED, allowNull: false },
  type:           { type: DataTypes.ENUM('REFERRAL_REWARD','WITHDRAWAL','WITHDRAWAL_REVERSAL','ADJUSTMENT'), allowNull: false },
  amount:         { type: DataTypes.DECIMAL(12,2), allowNull: false },
  currency:       { type: DataTypes.STRING(3), defaultValue: 'USD' },
  balance_before: { type: DataTypes.DECIMAL(12,2), allowNull: false },
  balance_after:  { type: DataTypes.DECIMAL(12,2), allowNull: false },
  reference_type: { type: DataTypes.STRING(50), allowNull: true },
  reference_id:   { type: DataTypes.BIGINT.UNSIGNED, allowNull: true },
  description:    { type: DataTypes.STRING(255), allowNull: true },
  status:         { type: DataTypes.ENUM('PENDING','COMPLETED','FAILED','REVERSED'), defaultValue: 'COMPLETED' },
}, { tableName: 'transactions', underscored: true });

// ── Withdrawal ────────────────────────────────────────────────────────────────
const Withdrawal = sequelize.define('Withdrawal', {
  id:              { type: DataTypes.BIGINT.UNSIGNED, autoIncrement: true, primaryKey: true },
  user_id:         { type: DataTypes.BIGINT.UNSIGNED, allowNull: false },
  amount:          { type: DataTypes.DECIMAL(12,2), allowNull: false },
  currency:        { type: DataTypes.STRING(3), defaultValue: 'USD' },
  payment_method:  { type: DataTypes.STRING(50), allowNull: false },
  payment_details: { type: DataTypes.TEXT, allowNull: false },
  status:          { type: DataTypes.ENUM('PENDING','PROCESSING','PAID','REJECTED','CANCELLED'), defaultValue: 'PENDING' },
  admin_id:        { type: DataTypes.BIGINT.UNSIGNED, allowNull: true },
  admin_note:      { type: DataTypes.TEXT, allowNull: true },
  processed_at:    { type: DataTypes.DATE, allowNull: true },
}, { tableName: 'withdrawals', underscored: true });

// ── Requirement ───────────────────────────────────────────────────────────────
const Requirement = sequelize.define('Requirement', {
  id:               { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
  name:             { type: DataTypes.STRING(100), allowNull: false },
  type:             { type: DataTypes.ENUM('TELEGRAM','YOUTUBE'), allowNull: false },
  telegram_chat_id: { type: DataTypes.STRING(100), allowNull: true },
  url:              { type: DataTypes.STRING(500), allowNull: true },
  description:      { type: DataTypes.STRING(255), allowNull: true },
  is_enabled:       { type: DataTypes.BOOLEAN, defaultValue: true },
  order_index:      { type: DataTypes.INTEGER.UNSIGNED, defaultValue: 0 },
}, { tableName: 'requirements', underscored: true });

// ── RequirementVerification ───────────────────────────────────────────────────
const RequirementVerification = sequelize.define('RequirementVerification', {
  id:                { type: DataTypes.BIGINT.UNSIGNED, autoIncrement: true, primaryKey: true },
  user_id:           { type: DataTypes.BIGINT.UNSIGNED, allowNull: false },
  requirement_id:    { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
  status:            { type: DataTypes.ENUM('PENDING','VERIFIED','FAILED'), defaultValue: 'PENDING' },
  verified_at:       { type: DataTypes.DATE, allowNull: true },
  verification_data: { type: DataTypes.TEXT, allowNull: true },
}, { tableName: 'requirement_verifications', underscored: true });

// ── Admin ─────────────────────────────────────────────────────────────────────
const Admin = sequelize.define('Admin', {
  id:            { type: DataTypes.BIGINT.UNSIGNED, autoIncrement: true, primaryKey: true },
  username:      { type: DataTypes.STRING(50), allowNull: false, unique: true },
  email:         { type: DataTypes.STRING(255), allowNull: false, unique: true },
  password_hash: { type: DataTypes.STRING(255), allowNull: false },
  role:          { type: DataTypes.ENUM('SUPER_ADMIN','ADMIN','MODERATOR'), defaultValue: 'ADMIN' },
  is_active:     { type: DataTypes.BOOLEAN, defaultValue: true },
  last_login_at: { type: DataTypes.DATE, allowNull: true },
  last_login_ip: { type: DataTypes.STRING(45), allowNull: true },
}, { tableName: 'admins', underscored: true });

// ── Setting ───────────────────────────────────────────────────────────────────
const Setting = sequelize.define('Setting', {
  id:          { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
  key:         { type: DataTypes.STRING(100), allowNull: false, unique: true },
  value:       { type: DataTypes.TEXT, allowNull: true },
  description: { type: DataTypes.STRING(255), allowNull: true },
  is_public:   { type: DataTypes.BOOLEAN, defaultValue: false },
}, { tableName: 'settings', underscored: true });

// ── AuditLog ──────────────────────────────────────────────────────────────────
const AuditLog = sequelize.define('AuditLog', {
  id:          { type: DataTypes.BIGINT.UNSIGNED, autoIncrement: true, primaryKey: true },
  admin_id:    { type: DataTypes.BIGINT.UNSIGNED, allowNull: true },
  action:      { type: DataTypes.STRING(100), allowNull: false },
  entity_type: { type: DataTypes.STRING(50), allowNull: true },
  entity_id:   { type: DataTypes.BIGINT.UNSIGNED, allowNull: true },
  old_values:  { type: DataTypes.TEXT, allowNull: true },
  new_values:  { type: DataTypes.TEXT, allowNull: true },
  ip_address:  { type: DataTypes.STRING(45), allowNull: true },
  user_agent:  { type: DataTypes.STRING(500), allowNull: true },
}, { tableName: 'audit_logs', underscored: true });

// ── Associations ──────────────────────────────────────────────────────────────
User.hasMany(Referral, { foreignKey: 'referrer_id', as: 'referrals_made' });
User.hasOne(Referral,  { foreignKey: 'referred_user_id', as: 'my_referral' });
Referral.belongsTo(User, { foreignKey: 'referrer_id', as: 'referrer' });
Referral.belongsTo(User, { foreignKey: 'referred_user_id', as: 'referred_user' });

User.hasMany(Transaction, { foreignKey: 'user_id', as: 'transactions' });
Transaction.belongsTo(User, { foreignKey: 'user_id' });

User.hasMany(Withdrawal, { foreignKey: 'user_id', as: 'withdrawals' });
Withdrawal.belongsTo(User, { foreignKey: 'user_id' });

User.hasMany(RequirementVerification, { foreignKey: 'user_id', as: 'verifications' });
RequirementVerification.belongsTo(User, { foreignKey: 'user_id' });
RequirementVerification.belongsTo(Requirement, { foreignKey: 'requirement_id' });
Requirement.hasMany(RequirementVerification, { foreignKey: 'requirement_id' });

module.exports = {
  sequelize,
  User,
  Referral,
  Transaction,
  Withdrawal,
  Requirement,
  RequirementVerification,
  Admin,
  Setting,
  AuditLog,
};
