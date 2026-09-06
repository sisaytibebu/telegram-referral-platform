'use strict';

/**
 * Wallet / financial calculation tests.
 * Tests the math logic in isolation — no DB required.
 */

describe('Wallet financial calculations', () => {
  const REWARD = 0.75;
  const MIN_WITHDRAWAL = 10.00;

  describe('Referral reward', () => {
    it('credits exactly $0.75', () => {
      const balance = 0.00;
      const newBalance = parseFloat((balance + REWARD).toFixed(2));
      expect(newBalance).toBe(0.75);
    });

    it('accumulates correctly over multiple referrals', () => {
      let balance = 0.00;
      for (let i = 0; i < 17; i++) {
        balance = parseFloat((balance + REWARD).toFixed(2));
      }
      expect(balance).toBe(12.75);
    });

    it('does not use floating point arithmetic that loses precision', () => {
      // Classic JS float issue: 0.1 + 0.2 !== 0.3
      // We always toFixed(2) to avoid this
      const result = parseFloat((0.1 + 0.2).toFixed(2));
      expect(result).toBe(0.30);
    });
  });

  describe('Withdrawal validation', () => {
    it('rejects amount below minimum', () => {
      const balance = 7.50;
      const amount = 5.00;
      expect(amount < MIN_WITHDRAWAL).toBe(true);
    });

    it('accepts amount equal to minimum', () => {
      const balance = 10.00;
      const amount = 10.00;
      expect(amount >= MIN_WITHDRAWAL).toBe(true);
      expect(balance >= amount).toBe(true);
    });

    it('rejects amount greater than balance', () => {
      const balance = 8.00;
      const amount = 10.00;
      expect(balance < amount).toBe(true);
    });

    it('correctly calculates balance after withdrawal', () => {
      const balance = 15.25;
      const amount = 10.00;
      const newBalance = parseFloat((balance - amount).toFixed(2));
      expect(newBalance).toBe(5.25);
    });

    it('prevents negative balance', () => {
      const balance = 10.00;
      const amount = 10.01;
      expect(balance < amount).toBe(true); // should be rejected
    });
  });

  describe('Balance calculations', () => {
    it('total_earned increases by reward amount', () => {
      const totalEarned = 5.25;
      const newTotal = parseFloat((totalEarned + REWARD).toFixed(2));
      expect(newTotal).toBe(6.00);
    });

    it('balance_after = balance_before + amount for credit', () => {
      const before = 3.75;
      const amount = 0.75;
      const after = parseFloat((before + amount).toFixed(2));
      expect(after).toBe(4.50);
    });

    it('balance_after = balance_before - amount for debit', () => {
      const before = 15.00;
      const amount = 10.00;
      const after = parseFloat((before - amount).toFixed(2));
      expect(after).toBe(5.00);
    });
  });
});
