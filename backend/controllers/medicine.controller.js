const MedicineLog = require('../models/MedicineLog');
const { extractTextFromFile } = require('../services/ocr.service');
const { compareMedicinePrices, extractMedicineNameFromText } = require('../services/medicinePrice.service');
const { verifyMedicine } = require('../services/medicineVerify.service');
const { asyncHandler } = require('../middleware/errorHandler');
const { createError, sendSuccess } = require('../utils/response');
const { isValidDate, normalizeBoolean } = require('../utils/validators');

const buildFileUrl = (req, file) => `${req.protocol}://${req.get('host')}/uploads/medicines/${file.filename}`;

const uploadMedicineImage = asyncHandler(async (req, res) => {
  if (!req.file) {
    throw createError('Medicine image is required', 400);
  }

  return sendSuccess(
    res,
    'Medicine image uploaded successfully',
    {
      file: {
        originalName: req.file.originalname,
        fileName: req.file.filename,
        mimeType: req.file.mimetype,
        size: req.file.size,
        url: buildFileUrl(req, req.file),
      },
    },
    201,
  );
});

const verifyMedicineController = asyncHandler(async (req, res) => {
  const medicineName = String(req.body.medicineName || '').trim();
  if (!medicineName) {
    throw createError('medicineName is required', 400);
  }

  if (req.body.expiryDate && !isValidDate(req.body.expiryDate)) {
    throw createError('expiryDate must be a valid date', 400);
  }

  const ocrResult = req.file ? await extractTextFromFile(req.file) : null;

  const verificationInput = {
    medicineName,
    batchNumber: String(req.body.batchNumber || '').trim(),
    manufacturer: String(req.body.manufacturer || '').trim(),
    expiryDate: req.body.expiryDate ? new Date(req.body.expiryDate) : undefined,
    purchaseSource: String(req.body.purchaseSource || '').trim(),
    packagingCondition: String(req.body.packagingCondition || '').trim(),
    qrCodePresent: req.body.qrCodePresent === undefined
      ? undefined
      : normalizeBoolean(req.body.qrCodePresent),
    extractedText: String(req.body.extractedText || ocrResult?.text || '').trim(),
  };

  const verificationResult = await verifyMedicine(verificationInput);

  const medicineLog = await MedicineLog.create({
    user: req.user._id,
    medicineName,
    batchNumber: verificationInput.batchNumber,
    manufacturer: verificationInput.manufacturer,
    expiryDate: verificationInput.expiryDate,
    purchaseSource: verificationInput.purchaseSource,
    packagingCondition: verificationInput.packagingCondition,
    uploadedImagePath: req.file ? req.file.path : '',
    uploadedImageOriginalName: req.file ? req.file.originalname : '',
    verificationResult,
  });

  return sendSuccess(
    res,
    'Medicine verification completed successfully',
    {
      result: verificationResult,
      ocr: ocrResult,
      log: medicineLog,
    },
    201,
  );
});

const compareMedicinePricesController = asyncHandler(async (req, res) => {
  const explicitMedicineName = String(req.body.medicineName || '').trim();
  const ocrResult = req.file ? await extractTextFromFile(req.file) : null;
  const extractedMedicineName = explicitMedicineName
    || extractMedicineNameFromText(ocrResult?.text, req.file?.originalname);

  if (!explicitMedicineName && !req.file) {
    throw createError('medicineName or image is required', 400);
  }

  if (!extractedMedicineName) {
    throw createError('Unable to determine the medicine name from the provided input', 400);
  }

  const comparison = await compareMedicinePrices({
    query: extractedMedicineName,
  });

  return sendSuccess(
    res,
    'Medicine price comparison generated successfully',
    {
      input: {
        medicineName: explicitMedicineName,
        source: explicitMedicineName ? 'manual-input' : 'image-ocr',
      },
      extractedMedicineName,
      ocr: ocrResult,
      comparison,
    },
  );
});

module.exports = {
  uploadMedicineImage,
  verifyMedicineController,
  compareMedicinePricesController,
};
