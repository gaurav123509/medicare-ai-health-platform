const { normalizeBoolean } = require('../utils/validators');

const suspiciousSources = ['street vendor', 'unknown', 'social media', 'unverified seller', 'unauthorized'];
const suspiciousPackagingTerms = ['damaged', 'open', 'tampered', 'broken seal', 'spelling issue'];
const suspiciousOcrTerms = ['replica', 'copy', 'fake', 'duplicate'];

const verifyMedicine = async (payload) => {
  const indicators = [];
  const recommendations = [];
  const extractedTextTokens = String(payload.extractedText || '')
    .split(/\s+/)
    .map((entry) => entry.trim())
    .filter(Boolean);

  let riskScore = 0;
  const batchNumber = String(payload.batchNumber || '').trim();
  const manufacturer = String(payload.manufacturer || '').trim();
  const purchaseSource = String(payload.purchaseSource || '').trim().toLowerCase();
  const packagingCondition = String(payload.packagingCondition || '').trim().toLowerCase();

  if (!batchNumber || batchNumber.length < 5) {
    riskScore += 12;
    indicators.push('Batch number is missing or unusually short.');
  }

  if (!manufacturer) {
    riskScore += 10;
    indicators.push('Manufacturer details are missing.');
  }

  if (suspiciousSources.some((source) => purchaseSource.includes(source))) {
    riskScore += 25;
    indicators.push('Purchase source appears unofficial or difficult to verify.');
  }

  if (suspiciousPackagingTerms.some((term) => packagingCondition.includes(term))) {
    riskScore += 20;
    indicators.push('Packaging condition suggests possible tampering or quality issues.');
  }

  if (payload.expiryDate && new Date(payload.expiryDate).getTime() < Date.now()) {
    riskScore += 40;
    indicators.push('Medicine appears to be past its expiry date.');
  }

  if (payload.qrCodePresent !== undefined && !normalizeBoolean(payload.qrCodePresent)) {
    riskScore += 8;
    indicators.push('QR code or traceability marker was not confirmed.');
  }

  const suspiciousTextHits = suspiciousOcrTerms.filter((term) => String(payload.extractedText || '').toLowerCase().includes(term));
  if (suspiciousTextHits.length > 0) {
    riskScore += 25;
    indicators.push('OCR detected suspicious wording on the packaging.');
  }

  const riskLevel = riskScore >= 60 ? 'high' : riskScore >= 25 ? 'medium' : 'low';
  const isLikelyAuthentic = riskScore < 40;
  const confidence = Math.min(0.95, 0.56 + indicators.length * 0.08);

  if (riskLevel === 'high') {
    recommendations.push('Do not consume this medicine until a pharmacist or manufacturer verifies it.');
    recommendations.push('Purchase only from a licensed pharmacy and retain the bill or invoice.');
  } else if (riskLevel === 'medium') {
    recommendations.push('Cross-check the batch number and packaging with the official manufacturer if possible.');
    recommendations.push('Consult a pharmacist if packaging or labeling looks unusual.');
  } else {
    recommendations.push('Packaging looks reasonably consistent, but continue buying from trusted pharmacies.');
    recommendations.push('Always verify expiry date and manufacturer details before use.');
  }

  return {
    isLikelyAuthentic,
    confidence,
    riskLevel,
    indicators,
    recommendations,
    extractedText: extractedTextTokens.slice(0, 30),
    provider: 'rule-engine',
  };
};

module.exports = {
  verifyMedicine,
};
