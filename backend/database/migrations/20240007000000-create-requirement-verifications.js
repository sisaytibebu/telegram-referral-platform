'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('requirement_verifications', {
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
      requirement_id: {
        type: Sequelize.INTEGER.UNSIGNED,
        allowNull: false,
        references: { model: 'requirements', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      status: {
        type: Sequelize.ENUM('PENDING', 'VERIFIED', 'FAILED'),
        allowNull: false,
        defaultValue: 'PENDING',
      },
      verified_at: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      verification_data: {
        // JSON — stores raw API response or verification token
        type: Sequelize.TEXT,
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

    // Unique: one verification record per user per requirement
    await queryInterface.addIndex(
      'requirement_verifications',
      ['user_id', 'requirement_id'],
      { unique: true, name: 'idx_req_verifications_user_req' }
    );
    await queryInterface.addIndex('requirement_verifications', ['status'], { name: 'idx_req_verifications_status' });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('requirement_verifications');
  },
};
