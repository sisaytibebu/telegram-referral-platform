/**
 * Phase 1 migration — create database and verify connection.
 * The full production schema will be added in Phase 2.
 */
'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Phase 1: verify the connection is working by running a simple query.
    // Full table creation happens in Phase 2 migrations.
    await queryInterface.sequelize.query('SELECT 1+1 AS result');
    console.log('Phase 1 migration: database connection verified.');
  },

  async down(queryInterface, Sequelize) {
    // No destructive action for this migration.
  },
};
