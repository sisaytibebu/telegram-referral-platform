/**
 * Centralised Express error handler.
 * Must be registered as the LAST middleware in app.js.
 */
'use strict';

const logger = require('../utils/logger');
const { error: apiError } = require('../utils/apiResponse');
const env = require('../config/env');

// eslint-disable-next-line no-unused-vars
const errorHandler = (err, req, res, next) => {
  // Log the full error server-side
  logger.error('Unhandled error', {
    message: err.message,
    stack: env.isDevelopment() ? err.stack : undefined,
    path: req.path,
    method: req.method,
    ip: req.ip,
  });

  // Sequelize validation errors
  if (err.name === 'SequelizeValidationError' || err.name === 'SequelizeUniqueConstraintError') {
    const messages = err.errors ? err.errors.map((e) => e.message) : [err.message];
    return apiError(res, messages.join('; '), 422);
  }

  // Sequelize foreign key / database errors
  if (err.name === 'SequelizeForeignKeyConstraintError') {
    return apiError(res, 'Referenced resource not found', 422);
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    return apiError(res, 'Invalid token', 401);
  }
  if (err.name === 'TokenExpiredError') {
    return apiError(res, 'Token expired', 401);
  }

  // Custom app errors with a statusCode
  if (err.statusCode) {
    return apiError(res, err.message, err.statusCode);
  }

  // Default 500
  const message = env.isProduction() ? 'Internal server error' : err.message;
  return apiError(res, message, 500);
};

/**
 * 404 handler — register before errorHandler.
 */
const notFoundHandler = (req, res) => {
  return apiError(res, `Route not found: ${req.method} ${req.path}`, 404);
};

module.exports = { errorHandler, notFoundHandler };
