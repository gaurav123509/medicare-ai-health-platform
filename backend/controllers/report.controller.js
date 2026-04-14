const Report = require('../models/Report');
const { analyzeReport } = require('../services/ai.service');
const { extractTextFromFile } = require('../services/ocr.service');
const { asyncHandler } = require('../middleware/errorHandler');
const { createError, sendSuccess } = require('../utils/response');

const analyzeMedicalReport = asyncHandler(async (req, res) => {
  if (!req.file) {
    throw createError('Medical report file is required', 400);
  }

  const ocrResult = await extractTextFromFile(req.file);
  const analysis = await analyzeReport({
    title: String(req.body.title || req.file.originalname).trim(),
    reportType: String(req.body.reportType || 'general').trim(),
    extractedText: ocrResult.text,
    mimeType: req.file.mimetype,
    originalName: req.file.originalname,
  });

  const report = await Report.create({
    user: req.user._id,
    title: String(req.body.title || req.file.originalname).trim(),
    reportType: String(req.body.reportType || 'general').trim(),
    filePath: req.file.path,
    originalName: req.file.originalname,
    mimeType: req.file.mimetype,
    size: req.file.size,
    extractedText: ocrResult.text,
    analysis,
  });

  return sendSuccess(
    res,
    'Medical report analyzed successfully',
    {
      report,
      ocr: ocrResult,
      analysis,
    },
    201,
  );
});

const getReportHistory = asyncHandler(async (req, res) => {
  const reports = await Report.find({ user: req.user._id }).sort({ createdAt: -1 });
  return sendSuccess(res, 'Report history fetched successfully', { reports });
});

module.exports = {
  analyzeMedicalReport,
  getReportHistory,
};
