const express = require('express');
const { triggerSOS } = require('../controllers/emergency.controller');
const protect = require('../middleware/auth');

const router = express.Router();

router.post('/sos', protect, triggerSOS);

module.exports = router;
