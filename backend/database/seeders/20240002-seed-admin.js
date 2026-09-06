'use strict';

const argon2 = require('argon2');

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface) {
    const existing = await queryInterface.sequelize.query(
      'SELECT COUNT(*) as count FROM admins',
      { type: queryInterface.sequelize.QueryTypes.SELECT }
    );
    if (existing[0].count > 0) {
      console.log('Admin already seeded — skipping.');
      return;
    }

    // Default password: Admin@1234  — CHANGE THIS IMMEDIATELY after first login
    const passwordHash = await argon2.hash('Admin@1234');

    await queryInterface.bulkInsert('admins', [{
      username:      'admin',
      email:         'admin@cryptogiveaway.com',
      password_hash: passwordHash,
      role:          'SUPER_ADMIN',
      is_active:     true,
      created_at:    new Date(),
      updated_at:    new Date(),
    }]);

    console.log('Default admin created — username: admin, password: Admin@1234');
    console.log('IMPORTANT: Change the password immediately after first login!');
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete('admins', { username: 'admin' }, {});
  },
};
