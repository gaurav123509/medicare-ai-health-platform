const express = require('express');
const {
  uploadMedicineImage,
  verifyMedicineController,
  compareMedicinePricesController,
} = require('../controllers/medicine.controller');
const protect = require('../middleware/auth');
const { uploadMedicine } = require('../middleware/upload');

const router = express.Router();

router.post('/upload', protect, uploadMedicine.single('image'), uploadMedicineImage);
router.post('/verify', protect, uploadMedicine.single('image'), verifyMedicineController);
router.post('/compare-prices', protect, uploadMedicine.single('image'), compareMedicinePricesController);

module.exports = router;
