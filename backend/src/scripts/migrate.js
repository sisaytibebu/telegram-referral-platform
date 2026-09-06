/**
 * Run Sequelize migrations + seeders programmatically.
 * Fully idempotent — safe to run multiple times.
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

const qi = sequelize.getQueryInterface();

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
  context: qi,
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
  context: qi,
  storage: new SequelizeStorage({ sequelize, tableName: 'sequelize_seeds' }),
  logger: console,
});

// ── Helper: remove a broken migration record so it can re-run ────────────────
const clearBrokenMigration = async (name) => {
  try {
    await sequelize.query(
      `DELETE FROM sequelize_meta WHERE name = :name`,
      { replacements: { name }, type: Sequelize.QueryTypes.DELETE }
    );
    console.log(`Cleared broken migration record: ${name}`);
  } catch (e) {
    // Table may not exist yet — that's fine
  }
};

(async () => {
  try {
    console.log('\n── Running migrations ──────────────────────────────');
    const migrations = await migrator.up();
    if (migrations.length === 0) {
      console.log('No pending migrations.');
    } else {
      console.log(`Applied ${migrations.length} migration(s).`);
    }

    console.log('\n── Running seeders ─────────────────────────────────');

    // If admins table is empty, force re-run of admin seeder
    try {
      const [rows] = await sequelize.query('SELECT COUNT(*) as count FROM admins');
      if (parseInt(rows[0].count) === 0) {
        console.log('Admins table is empty — clearing seed record to force re-seed...');
        await sequelize.query(
          `DELETE FROM sequelize_seeds WHERE name = '20240002-seed-admin.js'`
        ).catch(() => {});
      }
    } catch (e) { /* table may not exist yet */ }

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
    const msg = err.message || '';

    // Duplicate index — migration ran partially before, clear and retry once
    if (msg.includes('Duplicate key name') || msg.includes('ER_DUP_KEYNAME')) {
      console.warn('Duplicate index detected — clearing migration record and retrying...');
      const match = err.cause?.message || msg;
      // Extract migration name from umzug error
      const nameMatch = msg.match(/Migration (\S+) \(up\)/);
      if (nameMatch) {
        await clearBrokenMigration(nameMatch[1]);
      }
      console.log('Please redeploy to retry the migration.');
      await sequelize.close();
      // Exit 0 so Railway doesn't crash-loop — server will start without migrations
      process.exit(0);
    }

    // Table already exists — not a real error
    if (msg.includes('already exists') || msg.includes('ER_TABLE_EXISTS_ERROR')) {
      console.warn('Table already exists — skipping:', msg);
      await sequelize.close();
      process.exit(0);
    }

    console.error('\nMigration failed:', msg);
    await sequelize.close();
    process.exit(1);
  }
})();
