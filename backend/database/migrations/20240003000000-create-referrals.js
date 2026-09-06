'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('referrals', {
      id: {
        type: Sequelize.BIGINT.UNSIGNED,
        autoIncrement: true,
        primaryKey: true,
      },
      referrer_id: {
        type: Sequelize.BIGINT.UNSIGNED,
        allowNull: false,
        references: { model: 'users', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      referred_user_id: {
        // One referred user can only appear once — enforces single-reward rule
        type: Sequelize.BIGINT.UNSIGNED,
        allowNull: false,
        unique: true,
        references: { model: 'users', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      status: {
        type: Sequelize.ENUM('PENDING', 'QUALIFIED', 'REWARDED', 'REJECTED'),
        allowNull: false,
        defaultValue: 'PENDING',
      },
      reward_amount: {
        type: Sequelize.DECIMAL(12, 2),
        allowNull: true,
      },
      qualified_at: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      rewarded_at: {
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

    await queryInterface.addIndex('referrals', ['referrer_id'], { name: 'idx_referrals_referrer_id' });
    await queryInterface.addIndex('referrals', ['referred_user_id'], { unique: true, name: 'idx_referrals_referred_user_id' });
    await queryInterface.addIndex('referrals', ['status'], { name: 'idx_referrals_status' });
    await queryInterface.addIndex('referrals', ['created_at'], { name: 'idx_referrals_created_at' });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('referrals');
  },
};
