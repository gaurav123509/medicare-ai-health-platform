const express = require('express');
const { analyzeMedicalReport, getReportHistory } = require('../controllers/report.controller');
const protect = require('../middleware/auth');
const { uploadReport } = require('../middleware/upload');

const router = express.Router();

router.post('/analyze', protect, uploadReport.single('report'), analyzeMedicalReport);
router.get('/history', protect, getReportHistory);

module.exports = router;
