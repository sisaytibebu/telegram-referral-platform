'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Create table only if not exists
    await queryInterface.createTable('users', {
      id:              { type: Sequelize.BIGINT.UNSIGNED, autoIncrement: true, primaryKey: true },
      telegram_id:     { type: Sequelize.BIGINT, allowNull: false, unique: true },
      username:        { type: Sequelize.STRING(100), allowNull: true },
      first_name:      { type: Sequelize.STRING(100), allowNull: true },
      last_name:       { type: Sequelize.STRING(100), allowNull: true },
      referral_code:   { type: Sequelize.STRING(20), allowNull: false, unique: true },
      referred_by_id:  { type: Sequelize.BIGINT.UNSIGNED, allowNull: true },
      balance:         { type: Sequelize.DECIMAL(12,2), allowNull: false, defaultValue: '0.00' },
      total_earned:    { type: Sequelize.DECIMAL(12,2), allowNull: false, defaultValue: '0.00' },
      total_withdrawn: { type: Sequelize.DECIMAL(12,2), allowNull: false, defaultValue: '0.00' },
      is_active:       { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: true },
      is_banned:       { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: false },
      last_seen_at:    { type: Sequelize.DATE, allowNull: true },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP'),
      },
    });

    // Use raw SQL CREATE INDEX IF NOT EXISTS (MySQL 8 supports this)
    const safeIndex = async (sql) => {
      try {
        await queryInterface.sequelize.query(sql);
      } catch (e) {
        if (e.message && e.message.includes('Duplicate key name')) {
          // Already exists — fine
        } else throw e;
      }
    };

    await safeIndex(`CREATE UNIQUE INDEX IF NOT EXISTS idx_users_telegram_id  ON users (telegram_id)`);
    await safeIndex(`CREATE UNIQUE INDEX IF NOT EXISTS idx_users_referral_code ON users (referral_code)`);
    await safeIndex(`CREATE        INDEX IF NOT EXISTS idx_users_referred_by_id ON users (referred_by_id)`);
    await safeIndex(`CREATE        INDEX IF NOT EXISTS idx_users_created_at    ON users (created_at)`);
  },

  async down(queryInterface) {
    await queryInterface.dropTable('users');
  },
};
