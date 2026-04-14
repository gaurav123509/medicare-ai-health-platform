const { buildReportPrompt, buildSymptomPrompt } = require('../utils/promptBuilder');
const { uniqueStrings } = require('../utils/validators');

const extractJsonPayload = (rawText = '') => {
  const text = String(rawText).trim();

  if (!text) {
    return {};
  }

  try {
    return JSON.parse(text);
  } catch (directError) {
    const fenced = text.match(/```json\s*([\s\S]*?)```/i) || text.match(/```([\s\S]*?)```/);
    const candidate = fenced?.[1] || text.slice(text.indexOf('{'), text.lastIndexOf('}') + 1);

    if (!candidate || !candidate.includes('{')) {
      throw directError;
    }

    return JSON.parse(candidate);
  }
};

const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

const includesAny = (text, keywords = []) => keywords.some((keyword) => text.includes(keyword));

const ensureConditionShape = (conditions = []) => {
  return conditions
    .filter(Boolean)
    .map((item) => ({
      name: String(item.name || '').trim(),
      probability: clamp(Number(item.probability) || 0, 0, 1),
      rationale: String(item.rationale || '').trim(),
    }))
    .filter((item) => item.name);
};

const normalizeStringList = (items = []) => {
  if (!Array.isArray(items)) {
    return [];
  }

  return items
    .map((item) => String(item).trim())
    .filter(Boolean);
};

const normalizeSymptomResponse = (payload = {}, fallback = {}, provider = 'local-fallback') => {
  return {
    summary: String(payload.summary || fallback.summary || '').trim(),
    triageLevel: ['low', 'medium', 'high', 'critical'].includes(payload.triageLevel)
      ? payload.triageLevel
      : fallback.triageLevel || 'low',
    possibleConditions: ensureConditionShape(payload.possibleConditions || fallback.possibleConditions),
    recommendations: normalizeStringList(payload.recommendations || fallback.recommendations),
    redFlags: normalizeStringList(payload.redFlags || fallback.redFlags),
    provider,
    rawText: String(payload.rawText || fallback.rawText || '').trim(),
  };
};

const normalizeReportResponse = (payload = {}, fallback = {}, provider = 'local-fallback') => {
  return {
    summary: String(payload.summary || fallback.summary || '').trim(),
    keyObservations: normalizeStringList(payload.keyObservations || fallback.keyObservations),
    abnormalIndicators: normalizeStringList(payload.abnormalIndicators || fallback.abnormalIndicators),
    recommendations: normalizeStringList(payload.recommendations || fallback.recommendations),
    followUpLevel: ['routine', 'soon', 'urgent'].includes(payload.followUpLevel)
      ? payload.followUpLevel
      : fallback.followUpLevel || 'routine',
    provider,
  };
};

const callOpenAI = async (prompt) => {
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: process.env.OPENAI_MODEL || 'gpt-4.1-mini',
      temperature: 0.2,
      messages: [
        {
          role: 'system',
          content: 'You are a healthcare backend assistant. Return valid JSON only.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`OpenAI request failed: ${response.status} ${errorText}`);
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content || '{}';
  return extractJsonPayload(content);
};

const callGemini = async (prompt) => {
  const model = process.env.GEMINI_MODEL || 'gemini-2.0-flash';
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${process.env.GEMINI_API_KEY}`;
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      contents: [
        {
          role: 'user',
          parts: [{ text: `${prompt}\n\nReturn valid JSON only.` }],
        },
      ],
      generationConfig: {
        temperature: 0.2,
      },
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Gemini request failed: ${response.status} ${errorText}`);
  }

  const data = await response.json();
  const content = data.candidates?.[0]?.content?.parts?.map((part) => part.text).join(' ') || '{}';
  return extractJsonPayload(content);
};

const runStructuredInference = async ({
  prompt,
  fallback,
  normalize,
  taskLabel = 'analysis',
}) => {
  const provider = (process.env.AI_PROVIDER || 'local').toLowerCase();
  const fallbackData = typeof fallback === 'function' ? fallback() : (fallback || {});
  const normalizeResponse = typeof normalize === 'function'
    ? normalize
    : ((payload, base, resolvedProvider) => ({ ...base, ...payload, provider: resolvedProvider }));

  if (provider === 'openai' && process.env.OPENAI_API_KEY) {
    try {
      const result = await callOpenAI(prompt);
      return normalizeResponse(result, fallbackData, 'openai');
    } catch (error) {
      console.error(`[ai] ${taskLabel} failed with OpenAI: ${error.message}`);
    }
  }

  if (provider === 'gemini' && process.env.GEMINI_API_KEY) {
    try {
      const result = await callGemini(prompt);
      return normalizeResponse(result, fallbackData, 'gemini');
    } catch (error) {
      console.error(`[ai] ${taskLabel} failed with Gemini: ${error.message}`);
    }
  }

  return normalizeResponse({}, fallbackData, 'local-fallback');
};

const buildLocalSymptomAnalysis = (payload) => {
  const symptoms = uniqueStrings(payload.symptoms).map((item) => item.toLowerCase());
  const symptomText = symptoms.join(' ');
  const severity = String(payload.severity || 'mild').toLowerCase();
  const redFlags = [];
  const possibleConditions = [];
  const recommendations = [];

  if (includesAny(symptomText, ['chest pain', 'difficulty breathing', 'shortness of breath', 'unconscious', 'seizure', 'severe bleeding'])) {
    redFlags.push('Symptoms suggest a medical emergency and need immediate attention.');
  }

  if (includesAny(symptomText, ['high fever', 'confusion', 'persistent vomiting', 'severe dehydration'])) {
    redFlags.push('Persistent severe symptoms should be assessed by a clinician soon.');
  }

  if (includesAny(symptomText, ['fever', 'cough', 'sore throat'])) {
    possibleConditions.push({
      name: 'Upper respiratory tract infection',
      probability: 0.77,
      rationale: 'Fever with cough and throat irritation commonly appears in viral respiratory illness.',
    });
  }

  if (includesAny(symptomText, ['headache', 'nausea', 'light sensitivity', 'migraine'])) {
    possibleConditions.push({
      name: 'Migraine or tension headache',
      probability: 0.64,
      rationale: 'Headache associated with nausea or light sensitivity may match migraine patterns.',
    });
  }

  if (includesAny(symptomText, ['abdominal pain', 'diarrhea', 'vomiting', 'loose motion'])) {
    possibleConditions.push({
      name: 'Gastrointestinal infection or food intolerance',
      probability: 0.7,
      rationale: 'Digestive symptoms together often indicate an acute gastrointestinal issue.',
    });
  }

  if (includesAny(symptomText, ['burning urination', 'frequent urination', 'pelvic pain'])) {
    possibleConditions.push({
      name: 'Urinary tract infection',
      probability: 0.72,
      rationale: 'Urinary discomfort and increased frequency can be seen in urinary infection.',
    });
  }

  if (includesAny(symptomText, ['fatigue', 'weight loss', 'increased thirst', 'frequent urination'])) {
    possibleConditions.push({
      name: 'Metabolic imbalance such as diabetes',
      probability: 0.6,
      rationale: 'Fatigue with weight and urination changes can suggest glucose regulation issues.',
    });
  }

  if (includesAny(symptomText, ['rash', 'itching', 'swelling'])) {
    possibleConditions.push({
      name: 'Allergic reaction or dermatitis',
      probability: 0.58,
      rationale: 'Skin irritation and swelling are often seen in allergic or inflammatory conditions.',
    });
  }

  if (possibleConditions.length === 0) {
    possibleConditions.push({
      name: 'Non-specific viral or inflammatory illness',
      probability: 0.42,
      rationale: 'Current symptoms are broad and need clinical correlation for a clearer conclusion.',
    });
  }

  if (redFlags.length > 0) {
    recommendations.push('Seek urgent medical evaluation immediately or call local emergency services.');
  } else if (severity === 'severe') {
    recommendations.push('Arrange a same-day telemedicine or in-person clinical review.');
  } else {
    recommendations.push('Monitor symptoms closely and book a doctor consultation if they worsen or persist.');
  }

  recommendations.push('Stay hydrated and keep a log of symptom duration, triggers, and temperature if relevant.');
  recommendations.push('Use this result as screening support only and not as a final diagnosis.');

  const triageLevel = redFlags.length > 0
    ? 'critical'
    : severity === 'severe'
      ? 'high'
      : symptoms.length >= 4
        ? 'medium'
        : 'low';

  return {
    summary: `Based on the reported symptoms, the case is currently assessed as ${triageLevel} priority.`,
    triageLevel,
    possibleConditions,
    recommendations,
    redFlags,
    rawText: '',
  };
};

const extractMetricValue = (text, labels = []) => {
  for (const label of labels) {
    const regex = new RegExp(`${label}[^\\d]{0,10}(\\d+(?:\\.\\d+)?)`, 'i');
    const match = text.match(regex);

    if (match?.[1]) {
      return Number(match[1]);
    }
  }

  return null;
};

const buildLocalReportAnalysis = (payload) => {
  const reportText = String(payload.extractedText || '').toLowerCase();
  const keyObservations = [];
  const abnormalIndicators = [];
  const recommendations = [];

  if (!reportText.trim()) {
    return {
      summary: 'The report file was uploaded successfully, but readable report text could not be extracted automatically.',
      keyObservations: ['No structured text was extracted from the uploaded file.'],
      abnormalIndicators: [],
      recommendations: [
        'Upload a clearer PDF or text-based report for deeper automated analysis.',
        'A clinician should review the original document if symptoms are concerning.',
      ],
      followUpLevel: 'routine',
    };
  }

  const glucose = extractMetricValue(reportText, ['glucose', 'fasting glucose', 'blood sugar']);
  const hemoglobin = extractMetricValue(reportText, ['hemoglobin', 'hb']);
  const cholesterol = extractMetricValue(reportText, ['cholesterol', 'total cholesterol']);
  const creatinine = extractMetricValue(reportText, ['creatinine']);

  if (glucose !== null) {
    keyObservations.push(`Detected glucose value around ${glucose}.`);
    if (glucose > 126) {
      abnormalIndicators.push('Glucose appears elevated and may require metabolic follow-up.');
    }
  }

  if (hemoglobin !== null) {
    keyObservations.push(`Detected hemoglobin value around ${hemoglobin}.`);
    if (hemoglobin < 12) {
      abnormalIndicators.push('Hemoglobin appears lower than a common adult reference range.');
    }
  }

  if (cholesterol !== null) {
    keyObservations.push(`Detected cholesterol value around ${cholesterol}.`);
    if (cholesterol > 200) {
      abnormalIndicators.push('Cholesterol appears elevated and may warrant cardiovascular risk review.');
    }
  }

  if (creatinine !== null) {
    keyObservations.push(`Detected creatinine value around ${creatinine}.`);
    if (creatinine > 1.3) {
      abnormalIndicators.push('Creatinine appears elevated and may need kidney function review.');
    }
  }

  if (includesAny(reportText, ['positive', 'abnormal', 'elevated', 'reduced', 'low', 'high'])) {
    keyObservations.push('The extracted report text contains result qualifiers that may indicate non-normal values.');
  }

  if (abnormalIndicators.length === 0) {
    recommendations.push('Continue routine follow-up and review the full report with a clinician for context.');
  } else {
    recommendations.push('Discuss abnormal findings with a doctor who can interpret the results with your symptoms and history.');
  }

  recommendations.push('Do not make medication changes without clinician guidance.');
  recommendations.push('Keep the original report available for manual review.');

  return {
    summary: abnormalIndicators.length > 0
      ? `The uploaded report shows ${abnormalIndicators.length} potentially important finding(s) that deserve follow-up.`
      : 'The uploaded report does not show clear high-risk signals from the extracted text alone.',
    keyObservations: keyObservations.length > 0 ? keyObservations : ['Basic report text was extracted successfully.'],
    abnormalIndicators,
    recommendations,
    followUpLevel: abnormalIndicators.length >= 2 ? 'urgent' : abnormalIndicators.length === 1 ? 'soon' : 'routine',
  };
};

const analyzeSymptoms = async (payload) => {
  const prompt = buildSymptomPrompt(payload);

  return runStructuredInference({
    prompt,
    taskLabel: 'symptom-check',
    fallback: () => buildLocalSymptomAnalysis(payload),
    normalize: normalizeSymptomResponse,
  });
};

const analyzeReport = async (payload) => {
  const prompt = buildReportPrompt(payload);

  return runStructuredInference({
    prompt,
    taskLabel: 'report-analysis',
    fallback: () => buildLocalReportAnalysis(payload),
    normalize: normalizeReportResponse,
  });
};

module.exports = {
  analyzeReport,
  analyzeSymptoms,
  runStructuredInference,
};
