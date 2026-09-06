'use strict';

const { Router } = require('express');
const { getRequirements, verifyRequirements } = require('../controllers/requirementController');

const router = Router();

router.get('/',        getRequirements);
router.post('/verify', verifyRequirements);

module.exports = router;
