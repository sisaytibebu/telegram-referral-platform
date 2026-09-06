/**
 * Run Sequelize migrations programmatically.
 * Called by the Railway start command before the server starts.
 */
'use strict';

const { Sequelize } = require('sequelize');
const { Umzug, SequelizeStorage } = require('umzug');
const path = require('path');
const env = require('../config/env');

const sequelize = new Sequelize(env.DB_NAME, env.DB_USER, env.DB_PASSWORD, {
  host: env.DB_HOST,
  port: env.DB_PORT,
  dialect: 'mysql',
  logging: false,
});

const umzug = new Umzug({
  migrations: {
    glob: path.join(__dirname, '../../database/migrations/*.js'),
    resolve: ({ name, path: migPath, context }) => {
      const migration = require(migPath);
      return {
        name,
        up: async () => migration.up(context, Sequelize),
        down: async () => migration.down(context, Sequelize),
      };
    },
  },
  context: sequelize.getQueryInterface(),
  storage: new SequelizeStorage({ sequelize }),
  logger: console,
});

(async () => {
  try {
    console.log('Running database migrations...');
    const migrations = await umzug.up();
    if (migrations.length === 0) {
      console.log('No pending migrations.');
    } else {
      console.log(`Applied ${migrations.length} migration(s):`, migrations.map(m => m.name));
    }
    await sequelize.close();
    process.exit(0);
  } catch (err) {
    console.error('Migration failed:', err.message);
    await sequelize.close();
    process.exit(1);
  }
})();
