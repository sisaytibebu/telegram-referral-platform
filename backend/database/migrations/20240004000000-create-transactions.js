'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('transactions', {
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
      type: {
        type: Sequelize.ENUM(
          'REFERRAL_REWARD',
          'WITHDRAWAL',
          'WITHDRAWAL_REVERSAL',
          'ADJUSTMENT'
        ),
        allowNull: false,
      },
      amount: {
        // Positive = credit, negative = debit
        type: Sequelize.DECIMAL(12, 2),
        allowNull: false,
      },
      currency: {
        type: Sequelize.STRING(3),
        allowNull: false,
        defaultValue: 'USD',
      },
      balance_before: {
        type: Sequelize.DECIMAL(12, 2),
        allowNull: false,
      },
      balance_after: {
        type: Sequelize.DECIMAL(12, 2),
        allowNull: false,
      },
      reference_type: {
        // e.g. 'referral', 'withdrawal'
        type: Sequelize.STRING(50),
        allowNull: true,
      },
      reference_id: {
        type: Sequelize.BIGINT.UNSIGNED,
        allowNull: true,
      },
      description: {
        type: Sequelize.STRING(255),
        allowNull: true,
      },
      status: {
        type: Sequelize.ENUM('PENDING', 'COMPLETED', 'FAILED', 'REVERSED'),
        allowNull: false,
        defaultValue: 'COMPLETED',
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

    await queryInterface.addIndex('transactions', ['user_id'], { name: 'idx_transactions_user_id' });
    await queryInterface.addIndex('transactions', ['type'], { name: 'idx_transactions_type' });
    await queryInterface.addIndex('transactions', ['status'], { name: 'idx_transactions_status' });
    await queryInterface.addIndex('transactions', ['reference_type', 'reference_id'], { name: 'idx_transactions_reference' });
    await queryInterface.addIndex('transactions', ['created_at'], { name: 'idx_transactions_created_at' });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('transactions');
  },
};
