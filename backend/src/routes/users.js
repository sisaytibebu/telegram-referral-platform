'use strict';

const { Router } = require('express');
const { getMe, getBalance, getMyReferrals, getMyTransactions } = require('../controllers/userController');

const router = Router();

router.get('/me',                getMe);
router.get('/me/balance',        getBalance);
router.get('/me/referrals',      getMyReferrals);
router.get('/me/transactions',   getMyTransactions);

module.exports = router;
