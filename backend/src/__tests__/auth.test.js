'use strict';

/**
 * Authorization tests — verifies admin/user separation logic.
 * Pure unit tests, no DB required.
 */

const request = require('supertest');
const app = require('../app');

describe('Authorization', () => {
  describe('Admin routes protection', () => {
    it('rejects unauthenticated access to /api/admin/dashboard', async () => {
      const res = await request(app).get('/api/admin/dashboard');
      expect(res.statusCode).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('rejects invalid JWT token', async () => {
      const res = await request(app)
        .get('/api/admin/dashboard')
        .set('Authorization', 'Bearer invalid-token-here');
      expect(res.statusCode).toBe(401);
    });

    it('rejects unauthenticated access to /api/admin/users', async () => {
      const res = await request(app).get('/api/admin/users');
      expect(res.statusCode).toBe(401);
    });

    it('rejects unauthenticated withdrawal approval', async () => {
      const res = await request(app).post('/api/admin/withdrawals/1/approve');
      expect(res.statusCode).toBe(401);
    });

    it('rejects unauthenticated withdrawal rejection', async () => {
      const res = await request(app).post('/api/admin/withdrawals/1/reject');
      expect(res.statusCode).toBe(401);
    });
  });

  describe('Public routes accessible', () => {
    it('GET /api/health is accessible without auth', async () => {
      const res = await request(app).get('/api/health');
      expect([200, 503]).toContain(res.statusCode);
      expect(res.body).toHaveProperty('success');
    });

    it('GET /api/requirements is accessible without auth', async () => {
      const res = await request(app).get('/api/requirements');
      // 200 if DB connected, 500 if not — both are acceptable in test
      expect([200, 500, 503]).toContain(res.statusCode);
    });
  });

  describe('Admin login validation', () => {
    it('rejects login with missing fields', async () => {
      const res = await request(app)
        .post('/api/admin/login')
        .send({});
      expect(res.statusCode).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('rejects login with wrong credentials', async () => {
      const res = await request(app)
        .post('/api/admin/login')
        .send({ username: 'admin', password: 'wrongpassword' });
      // 401 if DB connected, 500 if not
      expect([401, 500]).toContain(res.statusCode);
    });
  });
});
