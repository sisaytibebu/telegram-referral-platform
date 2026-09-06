'use strict';

const jwt = require('jsonwebtoken');
const env = require('../config/env');
const { Admin } = require('../models');
const { error: apiError } = require('../utils/apiResponse');

/**
 * Verify admin JWT token.
 */
const requireAdmin = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return apiError(res, 'Authentication required', 401);
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, env.JWT_SECRET);

    const admin = await Admin.findByPk(decoded.id);
    if (!admin || !admin.is_active) {
      return apiError(res, 'Admin not found or inactive', 401);
    }

    req.admin = admin;
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') return apiError(res, 'Token expired', 401);
    if (err.name === 'JsonWebTokenError') return apiError(res, 'Invalid token', 401);
    next(err);
  }
};

/**
 * Require SUPER_ADMIN role.
 */
const requireSuperAdmin = (req, res, next) => {
  if (req.admin?.role !== 'SUPER_ADMIN') {
    return apiError(res, 'Super admin access required', 403);
  }
  next();
};

module.exports = { requireAdmin, requireSuperAdmin };
