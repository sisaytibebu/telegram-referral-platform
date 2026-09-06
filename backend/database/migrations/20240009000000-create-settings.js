'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('settings', {
      id: {
        type: Sequelize.INTEGER.UNSIGNED,
        autoIncrement: true,
        primaryKey: true,
      },
      key: {
        type: Sequelize.STRING(100),
        allowNull: false,
        unique: true,
      },
      value: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      description: {
        type: Sequelize.STRING(255),
        allowNull: true,
      },
      is_public: {
        // Public settings can be read without auth
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false,
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

    await queryInterface.addIndex('settings', ['key'], { unique: true, name: 'idx_settings_key' });

    // Seed default settings
    await queryInterface.bulkInsert('settings', [
      { key: 'referral_reward',   value: '0.75',  description: 'USD reward per qualified referral', is_public: false, created_at: new Date(), updated_at: new Date() },
      { key: 'min_withdrawal',    value: '10.00', description: 'Minimum withdrawal amount in USD',  is_public: false, created_at: new Date(), updated_at: new Date() },
      { key: 'bot_username',      value: '',      description: 'Telegram bot username',             is_public: true,  created_at: new Date(), updated_at: new Date() },
      { key: 'platform_name',     value: 'Telegram Referral Platform', description: 'Platform display name', is_public: true, created_at: new Date(), updated_at: new Date() },
      { key: 'withdrawals_open',  value: 'true',  description: 'Whether withdrawals are enabled',   is_public: false, created_at: new Date(), updated_at: new Date() },
    ]);
  },

  async down(queryInterface) {
    await queryInterface.dropTable('settings');
  },
};
