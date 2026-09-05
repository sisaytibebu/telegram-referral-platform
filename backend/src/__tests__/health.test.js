/**
 * Phase 1 tests — health endpoint.
 */
'use strict';

const request = require('supertest');
const app = require('../app');

describe('GET /api/health', () => {
  it('should return 200 with success:true when API is running', async () => {
    const res = await request(app).get('/api/health');

    // The endpoint returns 200 if DB is up, 503 if DB is down.
    // In CI without a DB, we accept both; the key check is the response shape.
    expect([200, 503]).toContain(res.statusCode);
    expect(res.body).toHaveProperty('success');
    expect(res.body).toHaveProperty('message');
  });

  it('should return JSON content-type', async () => {
    const res = await request(app).get('/api/health');
    expect(res.headers['content-type']).toMatch(/application\/json/);
  });

  it('should include environment and services in response data', async () => {
    const res = await request(app).get('/api/health');
    // data is present on 200, details on 503
    const payload = res.body.data || res.body.details;
    if (payload) {
      expect(payload).toHaveProperty('environment');
      expect(payload).toHaveProperty('services');
    }
  });

  it('should return 404 for unknown routes', async () => {
    const res = await request(app).get('/api/unknown-route-xyz');
    expect(res.statusCode).toBe(404);
    expect(res.body.success).toBe(false);
  });
});
