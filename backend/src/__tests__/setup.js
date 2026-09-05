/**
 * Jest global test setup.
 * Loads test environment variables before any test module is imported.
 */
'use strict';

process.env.NODE_ENV = 'test';
process.env.PORT = '5001';
process.env.DB_NAME = process.env.DB_NAME_TEST || 'telegram_referral_test';
process.env.JWT_SECRET = 'test-jwt-secret-not-for-production';
process.env.REFERRAL_REWARD = '0.75';
process.env.MIN_WITHDRAWAL = '10.00';
process.env.FRONTEND_URL = 'http://localhost:5173';
