'use strict';

const { Router } = require('express');
const { validateWithdrawal, requestWithdrawal, getMyWithdrawals } = require('../controllers/withdrawalController');

const router = Router();

router.post('/',   validateWithdrawal, requestWithdrawal);
router.get('/',    getMyWithdrawals);

module.exports = router;
