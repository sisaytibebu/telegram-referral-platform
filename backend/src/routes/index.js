/**
 * Root API router — mounts all route modules.
 */
'use strict';

const { Router } = require('express');
const healthRouter = require('./health');

const router = Router();

router.use('/health', healthRouter);

// Future routes will be mounted here in subsequent phases:
// router.use('/users',      require('./users'));
// router.use('/withdrawals', require('./withdrawals'));
// router.use('/requirements', require('./requirements'));
// router.use('/admin',      require('./admin'));
// router.use('/telegram',   require('./telegram'));

module.exports = router;
