'use strict';

/**
 * Referral business logic tests.
 * Uses in-memory mocks — no real DB connection required.
 */

const { generateReferralCode } = require('../services/referral/ReferralService');

describe('ReferralService', () => {
  describe('generateReferralCode', () => {
    it('generates an 8-character uppercase code', () => {
      const code = generateReferralCode();
      expect(code).toHaveLength(8);
      expect(code).toMatch(/^[A-Z0-9]+$/);
    });

    it('generates unique codes on repeated calls', () => {
      const codes = new Set(Array.from({ length: 100 }, () => generateReferralCode()));
      expect(codes.size).toBe(100);
    });
  });
});
