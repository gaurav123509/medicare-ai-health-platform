const safeJson = (value) => JSON.stringify(value, null, 2);

const buildSymptomPrompt = (payload) => {
  return [
    'You are a clinical triage assistant for a telemedicine platform.',
    'Respond with valid JSON only.',
    'Return keys: summary, triageLevel, possibleConditions, recommendations, redFlags.',
    'possibleConditions must be an array of objects with name, probability, rationale.',
    'Never claim a definitive diagnosis. Keep advice safe and non-prescriptive.',
    `Patient context: ${safeJson(payload)}`,
  ].join('\n');
};

const buildReportPrompt = (payload) => {
  return [
    'You are analyzing a medical report for a patient-facing health platform.',
    'Respond with valid JSON only.',
    'Return keys: summary, keyObservations, abnormalIndicators, recommendations, followUpLevel.',
    'Use cautious medical language and avoid definitive diagnosis.',
    `Report context: ${safeJson(payload)}`,
  ].join('\n');
};

const buildDiseasePredictionPrompt = (payload) => {
  return [
    'You are a preventive health risk stratification assistant.',
    'Respond with valid JSON only.',
    'Return keys: overallRiskLevel, predictions, preventionTips, recommendedTests.',
    'predictions must be an array of objects with name, riskScore, reasons, recommendedTests.',
    'Keep results non-diagnostic and suitable for early screening.',
    `Risk input: ${safeJson(payload)}`,
  ].join('\n');
};

module.exports = {
  buildDiseasePredictionPrompt,
  buildReportPrompt,
  buildSymptomPrompt,
};
