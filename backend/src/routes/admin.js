'use strict';

const { Router } = require('express');
const { requireAdmin } = require('../middleware/auth');
const { authLimiter } = require('../middleware/rateLimiter');
const c = require('../controllers/adminController');

const router = Router();

// Public — login only
router.post('/login', authLimiter, c.validateLogin, c.login);

// All routes below require admin JWT
router.use(requireAdmin);

router.get('/dashboard',                      c.getDashboard);

router.get('/users',                          c.getUsers);
router.get('/users/:id',                      c.getUserById);

router.get('/referrals',                      c.getReferrals);

router.get('/transactions',                   c.getTransactions);

router.get('/withdrawals',                    c.getWithdrawals);
router.post('/withdrawals/:id/approve',       c.approveWithdrawalHandler);
router.post('/withdrawals/:id/reject',        c.rejectWithdrawalHandler);

router.get('/settings',                       c.getSettings);
router.put('/settings',                       c.updateSettings);

router.get('/requirements',                   c.getAdminRequirements);
router.post('/requirements',                  c.createRequirement);
router.put('/requirements/:id',               c.updateRequirement);
router.delete('/requirements/:id',            c.deleteRequirement);

router.get('/audit-logs',                     c.getAuditLogs);

module.exports = router;
