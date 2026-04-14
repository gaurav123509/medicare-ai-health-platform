const express = require('express');
const { uploadMedicineImage, verifyMedicineController } = require('../controllers/medicine.controller');
const protect = require('../middleware/auth');
const { uploadMedicine } = require('../middleware/upload');

const router = express.Router();

router.post('/upload', protect, uploadMedicine.single('image'), uploadMedicineImage);
router.post('/verify', protect, uploadMedicine.single('image'), verifyMedicineController);

module.exports = router;
