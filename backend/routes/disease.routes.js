const express = require('express');
const { predictDisease } = require('../controllers/disease.controller');
const protect = require('../middleware/auth');

const router = express.Router();

router.post('/predict', protect, predictDisease);

module.exports = router;
