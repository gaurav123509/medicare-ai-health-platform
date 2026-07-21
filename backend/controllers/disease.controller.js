const SymptomLog = require('../models/SymptomLog');
const { predictDiseaseRisk } = require('../services/diseasePrediction.service');
const { asyncHandler } = require('../middleware/errorHandler');
const { createError, sendSuccess } = require('../utils/response');
const { normalizeNumber, normalizeStringArray } = require('../utils/validators');

const mapRiskToTriage = (riskLevel) => {
  if (riskLevel === 'high') {
    return 'high';
  }

  if (riskLevel === 'moderate') {
    return 'medium';
  }

  return 'low';
};

const predictDisease = asyncHandler(async (req, res) => {
  const symptoms = normalizeStringArray(req.body.symptoms);

  if (symptoms.length === 0) {
    throw createError('At least one symptom is required for disease prediction', 400);
  }

  const payload = {
    symptoms,
    familyHistory: normalizeStringArray(req.body.familyHistory),
    lifestyleFactors: normalizeStringArray(req.body.lifestyleFactors),
    age: normalizeNumber(req.body.age ?? req.user.age),
    gender: String(req.body.gender || req.user.gender || '').trim().toLowerCase(),
    vitals: {
      fastingGlucose: normalizeNumber(req.body.vitals?.fastingGlucose ?? req.body.fastingGlucose),
      systolicBP: normalizeNumber(req.body.vitals?.systolicBP ?? req.body.systolicBP),
      diastolicBP: normalizeNumber(req.body.vitals?.diastolicBP ?? req.body.diastolicBP),
      hemoglobin: normalizeNumber(req.body.vitals?.hemoglobin ?? req.body.hemoglobin),
      bmi: normalizeNumber(req.body.vitals?.bmi ?? req.body.bmi),
    },
  };

  const prediction = await predictDiseaseRisk(payload);

  await SymptomLog.create({
    user: req.user._id,
    source: 'disease-predict',
    symptoms,
    severity: prediction.overallRiskLevel === 'high' ? 'severe' : 'moderate',
    age: payload.age,
    gender: payload.gender,
    notes: `Disease risk prediction generated with provider: ${prediction.provider}`,
    aiResponse: {
      summary: `Overall preventive risk level assessed as ${prediction.overallRiskLevel}.`,
      triageLevel: mapRiskToTriage(prediction.overallRiskLevel),
      possibleConditions: prediction.predictions.map((item) => ({
        name: item.name,
        probability: item.riskScore,
        rationale: item.reasons.join(' '),
      })),
      recommendations: prediction.preventionTips,
      redFlags: prediction.overallRiskLevel === 'high'
        ? ['High-risk pattern detected. Clinical follow-up is recommended soon.']
        : [],
      provider: prediction.provider,
      rawText: '',
    },
  });

  return sendSuccess(res, 'Disease prediction completed successfully', { prediction }, 201);
});

module.exports = {
  predictDisease,
};
