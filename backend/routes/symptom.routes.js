const express = require('express');
const { checkSymptoms, getSymptomHistory } = require('../controllers/symptom.controller');
const protect = require('../middleware/auth');

const router = express.Router();

router.post('/check', protect, checkSymptoms);
router.get('/history', protect, getSymptomHistory);

module.exports = router;
