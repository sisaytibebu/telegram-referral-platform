'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('withdrawals', {
      id: {
        type: Sequelize.BIGINT.UNSIGNED,
        autoIncrement: true,
        primaryKey: true,
      },
      user_id: {
        type: Sequelize.BIGINT.UNSIGNED,
        allowNull: false,
        references: { model: 'users', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      amount: {
        type: Sequelize.DECIMAL(12, 2),
        allowNull: false,
      },
      currency: {
        type: Sequelize.STRING(3),
        allowNull: false,
        defaultValue: 'USD',
      },
      payment_method: {
        type: Sequelize.STRING(50),
        allowNull: false,
      },
      payment_details: {
        type: Sequelize.TEXT,
        allowNull: false,
      },
      status: {
        type: Sequelize.ENUM('PENDING', 'PROCESSING', 'PAID', 'REJECTED', 'CANCELLED'),
        allowNull: false,
        defaultValue: 'PENDING',
      },
      admin_id: {
        type: Sequelize.BIGINT.UNSIGNED,
        allowNull: true,
        references: { model: 'admins', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
      },
      admin_note: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      processed_at: {
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

    await queryInterface.addIndex('withdrawals', ['user_id'], { name: 'idx_withdrawals_user_id' });
    await queryInterface.addIndex('withdrawals', ['status'], { name: 'idx_withdrawals_status' });
    await queryInterface.addIndex('withdrawals', ['created_at'], { name: 'idx_withdrawals_created_at' });
    await queryInterface.addIndex('withdrawals', ['admin_id'], { name: 'idx_withdrawals_admin_id' });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('withdrawals');
  },
};
