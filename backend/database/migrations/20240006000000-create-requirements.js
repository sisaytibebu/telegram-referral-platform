'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('requirements', {
      id: {
        type: Sequelize.INTEGER.UNSIGNED,
        autoIncrement: true,
        primaryKey: true,
      },
      name: {
        type: Sequelize.STRING(100),
        allowNull: false,
      },
      type: {
        type: Sequelize.ENUM('TELEGRAM', 'YOUTUBE'),
        allowNull: false,
      },
      telegram_chat_id: {
        type: Sequelize.STRING(100),
        allowNull: true,
      },
      url: {
        type: Sequelize.STRING(500),
        allowNull: true,
      },
      description: {
        type: Sequelize.STRING(255),
        allowNull: true,
      },
      is_enabled: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: true,
      },
      order_index: {
        type: Sequelize.INTEGER.UNSIGNED,
        allowNull: false,
        defaultValue: 0,
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

    await queryInterface.addIndex('requirements', ['type'], { name: 'idx_requirements_type' });
    await queryInterface.addIndex('requirements', ['is_enabled'], { name: 'idx_requirements_enabled' });
    await queryInterface.addIndex('requirements', ['order_index'], { name: 'idx_requirements_order' });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('requirements');
  },
};
