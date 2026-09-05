/**
 * Sequelize database configuration & connection.
 */
'use strict';

const { Sequelize } = require('sequelize');
const env = require('./env');
const logger = require('../utils/logger');

const sequelize = new Sequelize(env.DB_NAME, env.DB_USER, env.DB_PASSWORD, {
  host: env.DB_HOST,
  port: env.DB_PORT,
  dialect: 'mysql',
  logging: env.isDevelopment()
    ? (msg) => logger.debug(msg)
    : false,
  pool: {
    max: 10,
    min: 0,
    acquire: 30000,
    idle: 10000,
  },
  dialectOptions: {
    // Required for DECIMAL precision — prevent JS float conversion
    decimalNumbers: true,
    ...(env.isProduction() && {
      ssl: {
        rejectUnauthorized: false,
      },
    }),
  },
  define: {
    underscored: true,        // snake_case columns by default
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
  },
  timezone: '+00:00',         // Always store UTC
});

/**
 * Test the database connection.
 * @returns {Promise<boolean>}
 */
const testConnection = async () => {
  try {
    await sequelize.authenticate();
    logger.info(`Database connected: ${env.DB_HOST}:${env.DB_PORT}/${env.DB_NAME}`);
    return true;
  } catch (error) {
    logger.error('Database connection failed:', { message: error.message });
    return false;
  }
};

module.exports = { sequelize, testConnection };
