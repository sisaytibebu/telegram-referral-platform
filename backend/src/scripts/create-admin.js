/**
 * Standalone script to create the default admin account.
 * Run once: node src/scripts/create-admin.js
 */
'use strict';

const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../../.env') });

const { Sequelize } = require('sequelize');
const argon2 = require('argon2');
const env = require('../config/env');

const sequelize = new Sequelize(env.DB_NAME, env.DB_USER, env.DB_PASSWORD, {
  host: env.DB_HOST,
  port: env.DB_PORT,
  dialect: 'mysql',
  logging: false,
});

(async () => {
  try {
    await sequelize.authenticate();
    console.log('Database connected.');

    // Check if admin already exists
    const [rows] = await sequelize.query('SELECT COUNT(*) as count FROM admins');
    if (rows[0].count > 0) {
      console.log('Admin already exists. To reset, delete the row from the admins table first.');
      await sequelize.close();
      process.exit(0);
    }

    const passwordHash = await argon2.hash('Admin@1234');

    await sequelize.query(
      `INSERT INTO admins (username, email, password_hash, role, is_active, created_at, updated_at)
       VALUES ('admin', 'admin@cryptogiveaway.com', :hash, 'SUPER_ADMIN', 1, NOW(), NOW())`,
      { replacements: { hash: passwordHash } }
    );

    console.log('✅ Admin created successfully!');
    console.log('   Username: admin');
    console.log('   Password: Admin@1234');
    console.log('   CHANGE THE PASSWORD AFTER FIRST LOGIN!');

    await sequelize.close();
    process.exit(0);
  } catch (err) {
    console.error('Failed:', err.message);
    await sequelize.close();
    process.exit(1);
  }
})();
