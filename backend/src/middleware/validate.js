'use strict';

const { validationResult } = require('express-validator');
const { error: apiError } = require('../utils/apiResponse');

/**
 * Run express-validator checks and return 400 on first error.
 */
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return apiError(res, errors.array()[0].msg, 400);
  }
  next();
};

module.exports = { validate };
