const { runStructuredInference } = require('./ai.service');
const { buildDiseasePredictionPrompt } = require('../utils/promptBuilder');
const { normalizeNumber, uniqueStrings } = require('../utils/validators');

const includesAny = (text, keywords = []) => keywords.some((keyword) => text.includes(keyword));

const normalizePredictionResponse = (payload = {}, fallback = {}, provider = 'local-fallback') => {
  const predictions = Array.isArray(payload.predictions) ? payload.predictions : fallback.predictions || [];

  return {
    overallRiskLevel: ['low', 'moderate', 'high'].includes(payload.overallRiskLevel)
      ? payload.overallRiskLevel
      : fallback.overallRiskLevel || 'low',
    predictions: predictions
      .map((item) => ({
        name: String(item.name || '').trim(),
        riskScore: Math.min(Math.max(Number(item.riskScore) || 0, 0), 1),
        reasons: Array.isArray(item.reasons) ? item.reasons.map((entry) => String(entry).trim()).filter(Boolean) : [],
        recommendedTests: Array.isArray(item.recommendedTests) ? item.recommendedTests.map((entry) => String(entry).trim()).filter(Boolean) : [],
      }))
      .filter((item) => item.name),
    preventionTips: Array.isArray(payload.preventionTips)
      ? payload.preventionTips.map((item) => String(item).trim()).filter(Boolean)
      : fallback.preventionTips || [],
    recommendedTests: Array.isArray(payload.recommendedTests)
      ? payload.recommendedTests.map((item) => String(item).trim()).filter(Boolean)
      : fallback.recommendedTests || [],
    provider,
  };
};

const buildLocalDiseasePrediction = (payload) => {
  const symptoms = uniqueStrings(payload.symptoms).map((item) => item.toLowerCase());
  const familyHistory = uniqueStrings(payload.familyHistory).map((item) => item.toLowerCase());
  const lifestyleFactors = uniqueStrings(payload.lifestyleFactors).map((item) => item.toLowerCase());
  const symptomText = symptoms.join(' ');
  const predictions = [];
  const preventionTips = new Set();
  const recommendedTests = new Set();

  const fastingGlucose = normalizeNumber(payload?.vitals?.fastingGlucose);
  const systolicBP = normalizeNumber(payload?.vitals?.systolicBP);
  const diastolicBP = normalizeNumber(payload?.vitals?.diastolicBP);
  const hemoglobin = normalizeNumber(payload?.vitals?.hemoglobin);
  const bmi = normalizeNumber(payload?.vitals?.bmi);

  if (
    includesAny(symptomText, ['increased thirst', 'frequent urination', 'weight loss', 'fatigue'])
    || familyHistory.includes('diabetes')
    || (fastingGlucose !== undefined && fastingGlucose > 125)
  ) {
    predictions.push({
      name: 'Type 2 diabetes risk',
      riskScore: fastingGlucose > 125 || familyHistory.includes('diabetes') ? 0.83 : 0.67,
      reasons: [
        'Symptoms overlap with common early metabolic risk signals.',
        familyHistory.includes('diabetes') ? 'Family history increases background risk.' : '',
        fastingGlucose > 125 ? 'Reported fasting glucose is above common screening thresholds.' : '',
      ].filter(Boolean),
      recommendedTests: ['HbA1c', 'Fasting blood glucose'],
    });
    preventionTips.add('Limit refined sugar intake and prioritize regular physical activity.');
    recommendedTests.add('HbA1c');
    recommendedTests.add('Fasting blood glucose');
  }

  if (
    includesAny(symptomText, ['headache', 'dizziness', 'blurred vision'])
    || (systolicBP !== undefined && systolicBP >= 140)
    || (diastolicBP !== undefined && diastolicBP >= 90)
    || bmi >= 30
  ) {
    predictions.push({
      name: 'Hypertension or cardiovascular risk',
      riskScore: systolicBP >= 140 || diastolicBP >= 90 ? 0.81 : 0.62,
      reasons: [
        'Symptoms and vitals can align with elevated blood pressure risk.',
        bmi >= 30 ? 'Elevated BMI may increase long-term cardiovascular risk.' : '',
      ].filter(Boolean),
      recommendedTests: ['Blood pressure monitoring', 'Lipid profile'],
    });
    preventionTips.add('Reduce salt intake and maintain a consistent exercise routine.');
    recommendedTests.add('Blood pressure monitoring');
    recommendedTests.add('Lipid profile');
  }

  if (
    includesAny(symptomText, ['fatigue', 'pale skin', 'shortness of breath', 'dizziness'])
    || (hemoglobin !== undefined && hemoglobin < 12)
  ) {
    predictions.push({
      name: 'Anemia risk',
      riskScore: hemoglobin < 12 ? 0.79 : 0.58,
      reasons: [
        'Tiredness, dizziness, and breathlessness may indicate reduced oxygen-carrying capacity.',
        hemoglobin < 12 ? 'Reported hemoglobin is below a common adult reference threshold.' : '',
      ].filter(Boolean),
      recommendedTests: ['Complete blood count', 'Iron studies'],
    });
    preventionTips.add('Review dietary iron, folate, and B12 intake with a clinician if symptoms persist.');
    recommendedTests.add('Complete blood count');
    recommendedTests.add('Iron studies');
  }

  if (
    includesAny(symptomText, ['wheezing', 'shortness of breath', 'chest tightness', 'night cough'])
    || lifestyleFactors.includes('smoking')
  ) {
    predictions.push({
      name: 'Asthma or chronic airway irritation risk',
      riskScore: lifestyleFactors.includes('smoking') ? 0.72 : 0.61,
      reasons: [
        'Respiratory symptoms suggest airway irritation or reactive airways.',
        lifestyleFactors.includes('smoking') ? 'Smoking can worsen or trigger airway disease.' : '',
      ].filter(Boolean),
      recommendedTests: ['Spirometry', 'Clinical respiratory exam'],
    });
    preventionTips.add('Avoid smoke exposure and track triggers such as dust, exercise, or cold air.');
    recommendedTests.add('Spirometry');
    recommendedTests.add('Clinical respiratory exam');
  }

  if (predictions.length === 0) {
    predictions.push({
      name: 'General preventive health screening recommended',
      riskScore: 0.32,
      reasons: ['Current inputs do not map strongly to a specific disease pattern, but screening can still be useful.'],
      recommendedTests: ['Basic health checkup', 'CBC', 'Blood pressure monitoring'],
    });
    preventionTips.add('Maintain preventive checkups, sleep, hydration, and physical activity.');
    recommendedTests.add('Basic health checkup');
  }

  const maxRiskScore = Math.max(...predictions.map((item) => item.riskScore));
  const overallRiskLevel = maxRiskScore >= 0.75 ? 'high' : maxRiskScore >= 0.5 ? 'moderate' : 'low';

  return {
    overallRiskLevel,
    predictions: predictions.sort((left, right) => right.riskScore - left.riskScore),
    preventionTips: [...preventionTips],
    recommendedTests: [...recommendedTests],
  };
};

const predictDiseaseRisk = async (payload) => {
  const prompt = buildDiseasePredictionPrompt(payload);

  return runStructuredInference({
    prompt,
    taskLabel: 'disease-prediction',
    fallback: () => buildLocalDiseasePrediction(payload),
    normalize: normalizePredictionResponse,
  });
};

module.exports = {
  predictDiseaseRisk,
};
