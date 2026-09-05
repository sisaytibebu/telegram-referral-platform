'use strict';

module.exports = {
  testEnvironment: 'node',
  testMatch: ['**/__tests__/**/*.test.js', '**/*.test.js'],
  coverageDirectory: 'coverage',
  collectCoverageFrom: [
    'src/**/*.js',
    '!src/server.js',           // entry point, not unit-testable
    '!src/config/sequelize.js', // CLI config
  ],
  setupFiles: ['./src/__tests__/setup.js'],
  verbose: true,
};
