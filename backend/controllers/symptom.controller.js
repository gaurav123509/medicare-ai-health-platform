const SymptomLog = require('../models/SymptomLog');
const { analyzeSymptoms } = require('../services/ai.service');
const { asyncHandler } = require('../middleware/errorHandler');
const { createError, sendSuccess } = require('../utils/response');
const { normalizeStringArray } = require('../utils/validators');

const checkSymptoms = asyncHandler(async (req, res) => {
  const symptoms = normalizeStringArray(req.body.symptoms);

  if (symptoms.length === 0) {
    throw createError('At least one symptom is required', 400);
  }

  const payload = {
    symptoms,
    duration: String(req.body.duration || '').trim(),
    severity: String(req.body.severity || 'mild').trim().toLowerCase(),
    age: Number(req.body.age || req.user.age || 0) || undefined,
    gender: String(req.body.gender || req.user.gender || '').trim().toLowerCase(),
    notes: String(req.body.notes || '').trim(),
  };

  const analysis = await analyzeSymptoms(payload);

  const log = await SymptomLog.create({
    user: req.user._id,
    source: 'symptom-check',
    symptoms,
    duration: payload.duration,
    severity: payload.severity,
    age: payload.age,
    gender: payload.gender,
    notes: payload.notes,
    aiResponse: analysis,
  });

  return sendSuccess(
    res,
    'Symptom analysis completed successfully',
    {
      result: analysis,
      log,
    },
    201,
  );
});

const getSymptomHistory = asyncHandler(async (req, res) => {
  const history = await SymptomLog.find({
    user: req.user._id,
    source: 'symptom-check',
  }).sort({ createdAt: -1 });

  return sendSuccess(res, 'Symptom history fetched successfully', { history });
});

module.exports = {
  checkSymptoms,
  getSymptomHistory,
};
