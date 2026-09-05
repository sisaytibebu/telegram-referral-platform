/**
 * Standardised API response helpers.
 * All responses follow: { success, message, data?, meta? }
 */
'use strict';

/**
 * Send a successful response.
 */
const success = (res, data = null, message = 'Success', statusCode = 200, meta = null) => {
  const body = { success: true, message };
  if (data !== null) body.data = data;
  if (meta !== null) body.meta = meta;
  return res.status(statusCode).json(body);
};

/**
 * Send an error response.
 * In production, internal details are suppressed.
 */
const error = (res, message = 'An error occurred', statusCode = 500, details = null) => {
  const body = { success: false, message };
  if (details && process.env.NODE_ENV !== 'production') {
    body.details = details;
  }
  return res.status(statusCode).json(body);
};

/**
 * Send a paginated response.
 */
const paginated = (res, data, total, page, limit, message = 'Success') => {
  return res.status(200).json({
    success: true,
    message,
    data,
    meta: {
      total,
      page: parseInt(page, 10),
      limit: parseInt(limit, 10),
      totalPages: Math.ceil(total / limit),
    },
  });
};

module.exports = { success, error, paginated };
