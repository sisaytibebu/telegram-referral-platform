/**
 * Sequelize CLI configuration.
 * Used by `sequelize-cli` for migrations and seeders.
 */
'use strict';

require('dotenv').config({ path: require('path').resolve(__dirname, '../../../.env') });

module.exports = {
  development: {
    username: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'telegram_referral',
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '3306', 10),
    dialect: 'mysql',
    define: {
      underscored: true,
      timestamps: true,
    },
  },
  test: {
    username: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME_TEST || 'telegram_referral_test',
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '3306', 10),
    dialect: 'mysql',
    logging: false,
    define: {
      underscored: true,
      timestamps: true,
    },
  },
  production: {
    use_env_variable: 'DATABASE_URL',
    dialect: 'mysql',
    dialectOptions: {
      ssl: {
        rejectUnauthorized: false,
      },
    },
    define: {
      underscored: true,
      timestamps: true,
    },
    logging: false,
  },
};
