/**
 * Health-check endpoint.
 * GET /api/health
 */
'use strict';

const { Router } = require('express');
const { testConnection } = require('../config/database');
const { success, error: apiError } = require('../utils/apiResponse');
const env = require('../config/env');

const router = Router();

router.get('/', async (req, res) => {
  const dbOk = await testConnection();

  const payload = {
    status: dbOk ? 'healthy' : 'degraded',
    timestamp: new Date().toISOString(),
    environment: env.NODE_ENV,
    services: {
      database: dbOk ? 'connected' : 'disconnected',
      api: 'running',
    },
    version: process.env.npm_package_version || '1.0.0',
    uptime: Math.floor(process.uptime()),
  };

  if (!dbOk) {
    return apiError(res, 'API is running but database is unavailable', 503, payload);
  }

  return success(res, payload, 'API is running');
});

module.exports = router;
