'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('users', {
      id: {
        type: Sequelize.BIGINT.UNSIGNED,
        autoIncrement: true,
        primaryKey: true,
      },
      telegram_id: {
        type: Sequelize.BIGINT,
        allowNull: false,
        unique: true,
      },
      username: {
        type: Sequelize.STRING(100),
        allowNull: true,
      },
      first_name: {
        type: Sequelize.STRING(100),
        allowNull: true,
      },
      last_name: {
        type: Sequelize.STRING(100),
        allowNull: true,
      },
      referral_code: {
        type: Sequelize.STRING(20),
        allowNull: false,
        unique: true,
      },
      referred_by_id: {
        type: Sequelize.BIGINT.UNSIGNED,
        allowNull: true,
        references: { model: 'users', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
      },
      balance: {
        // Denormalised cache — source of truth is transactions table
        type: Sequelize.DECIMAL(12, 2),
        allowNull: false,
        defaultValue: '0.00',
      },
      total_earned: {
        type: Sequelize.DECIMAL(12, 2),
        allowNull: false,
        defaultValue: '0.00',
      },
      total_withdrawn: {
        type: Sequelize.DECIMAL(12, 2),
        allowNull: false,
        defaultValue: '0.00',
      },
      is_active: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: true,
      },
      is_banned: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      last_seen_at: {
        type: Sequelize.DATE,
        allowNull: true,
      },
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

    await queryInterface.addIndex('users', ['telegram_id'], { unique: true, name: 'idx_users_telegram_id' });
    await queryInterface.addIndex('users', ['referral_code'], { unique: true, name: 'idx_users_referral_code' });
    await queryInterface.addIndex('users', ['referred_by_id'], { name: 'idx_users_referred_by_id' });
    await queryInterface.addIndex('users', ['created_at'], { name: 'idx_users_created_at' });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('users');
  },
};
