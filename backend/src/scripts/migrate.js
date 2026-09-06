/**
 * Run Sequelize migrations + seeders programmatically.
 * Called automatically on Railway deploy before server starts.
 */
'use strict';

const { Sequelize } = require('sequelize');
const { Umzug, SequelizeStorage } = require('umzug');
const path = require('path');

require('dotenv').config({ path: path.resolve(__dirname, '../../../.env') });

const env = require('../config/env');

const sequelize = new Sequelize(env.DB_NAME, env.DB_USER, env.DB_PASSWORD, {
  host: env.DB_HOST,
  port: env.DB_PORT,
  dialect: 'mysql',
  logging: false,
  dialectOptions: { decimalNumbers: true },
});

// ── Migrations ───────────────────────────────────────────────────────────────
const migrator = new Umzug({
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
  storage: new SequelizeStorage({ sequelize, tableName: 'sequelize_meta' }),
  logger: console,
});

// ── Seeders ──────────────────────────────────────────────────────────────────
const seeder = new Umzug({
  migrations: {
    glob: path.join(__dirname, '../../database/seeders/*.js'),
    resolve: ({ name, path: seedPath, context }) => {
      const seed = require(seedPath);
      return {
        name,
        up: async () => seed.up(context, Sequelize),
        down: async () => seed.down(context, Sequelize),
      };
    },
  },
  context: sequelize.getQueryInterface(),
  storage: new SequelizeStorage({ sequelize, tableName: 'sequelize_seeds' }),
  logger: console,
});

(async () => {
  try {
    // Run migrations
    console.log('\n── Running migrations ──────────────────────────────');
    const migrations = await migrator.up();
    if (migrations.length === 0) {
      console.log('No pending migrations.');
    } else {
      console.log(`Applied ${migrations.length} migration(s).`);
    }

    // Run seeders
    console.log('\n── Running seeders ─────────────────────────────────');
    const seeds = await seeder.up();
    if (seeds.length === 0) {
      console.log('No pending seeders.');
    } else {
      console.log(`Applied ${seeds.length} seeder(s).`);
    }

    console.log('\n── Database ready ──────────────────────────────────\n');
    await sequelize.close();
    process.exit(0);
  } catch (err) {
    // If table already exists, that's fine — skip and continue
    if (err.message && (
      err.message.includes('already exists') ||
      err.message.includes('Duplicate key name') ||
      err.message.includes('ER_TABLE_EXISTS_ERROR')
    )) {
      console.warn('Migration warning (table/index exists):', err.message);
      console.log('Continuing...');
      await sequelize.close();
      process.exit(0);
    }

    console.error('\nMigration/seed failed:', err.message);
    await sequelize.close();
    process.exit(1);
  }
})();
