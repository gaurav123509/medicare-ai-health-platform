const fs = require('fs/promises');
const path = require('path');

const tokenizeFileName = (fileName = '') => {
  return path.basename(fileName, path.extname(fileName))
    .replace(/[_-]+/g, ' ')
    .split(/\s+/)
    .map((token) => token.trim())
    .filter(Boolean);
};

const parseErrorMessage = (value) => {
  if (Array.isArray(value)) {
    return value.map((entry) => String(entry).trim()).filter(Boolean).join(' ');
  }

  return String(value || '').trim();
};

const callOCRSpace = async (file) => {
  const fileBuffer = await fs.readFile(file.path);
  const providerUrl = process.env.OCR_PROVIDER_URL;
  const formData = new FormData();
  const blob = new Blob([fileBuffer], {
    type: file.mimetype || 'application/octet-stream',
  });

  formData.append('file', blob, file.originalname);
  formData.append('language', 'eng');
  formData.append('isOverlayRequired', 'false');
  formData.append('detectOrientation', 'true');
  formData.append('scale', 'true');
  formData.append('OCREngine', '1');

  const response = await fetch(providerUrl, {
    method: 'POST',
    headers: {
      apikey: process.env.OCR_API_KEY,
    },
    body: formData,
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`OCR.Space request failed: ${response.status} ${errorText}`);
  }

  const payload = await response.json();
  const errorMessage = parseErrorMessage(payload.ErrorMessage || payload.ErrorDetails);

  if (payload.IsErroredOnProcessing || errorMessage) {
    throw new Error(errorMessage || 'OCR.Space failed to process the uploaded file');
  }

  const text = Array.isArray(payload.ParsedResults)
    ? payload.ParsedResults
      .map((result) => String(result.ParsedText || '').trim())
      .filter(Boolean)
      .join('\n')
      .trim()
    : '';

  return {
    text,
    method: 'ocr-space',
    confidence: text ? 0.9 : 0.2,
    metadata: {
      provider: 'ocr.space',
      fileName: file.originalname,
      parsedResults: Array.isArray(payload.ParsedResults) ? payload.ParsedResults.length : 0,
      processingTimeMs: payload.ProcessingTimeInMilliseconds || null,
    },
  };
};

const callGenericOCR = async (file) => {
  const fileBuffer = await fs.readFile(file.path);
  const response = await fetch(process.env.OCR_PROVIDER_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${process.env.OCR_API_KEY}`,
    },
    body: JSON.stringify({
      fileName: file.originalname,
      mimeType: file.mimetype,
      contentBase64: fileBuffer.toString('base64'),
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`External OCR failed: ${response.status} ${errorText}`);
  }

  const payload = await response.json();
  return {
    text: String(payload.text || '').trim(),
    method: 'external-ocr',
    confidence: Number(payload.confidence) || 0.9,
    metadata: payload.metadata || {},
  };
};

const callExternalOCR = async (file) => {
  if (!process.env.OCR_PROVIDER_URL || !process.env.OCR_API_KEY) {
    return null;
  }

  if (process.env.OCR_PROVIDER_URL.toLowerCase().includes('ocr.space')) {
    return callOCRSpace(file);
  }

  return callGenericOCR(file);
};

const extractTextFromFile = async (file) => {
  const mimeType = String(file?.mimetype || '').toLowerCase();

  if (!file) {
    throw new Error('File is required for OCR processing');
  }

  if (mimeType.startsWith('text/')) {
    const text = await fs.readFile(file.path, 'utf8');
    return {
      text,
      method: 'plain-text-reader',
      confidence: 0.98,
      metadata: {
        fileName: file.originalname,
        size: file.size,
      },
    };
  }

  try {
    const externalResult = await callExternalOCR(file);

    if (externalResult?.text) {
      return externalResult;
    }
  } catch (error) {
    console.error(`[ocr] Falling back to local extraction: ${error.message}`);
  }

  const fileNameTokens = tokenizeFileName(file.originalname);
  const labelText = fileNameTokens.length > 0
    ? `Possible text hints from filename: ${fileNameTokens.join(' ')}`
    : '';

  return {
    text: labelText,
    method: 'metadata-fallback',
    confidence: labelText ? 0.35 : 0.1,
    metadata: {
      fileName: file.originalname,
      mimeType,
      size: file.size,
      warning: process.env.OCR_PROVIDER_URL
        ? 'OCR provider did not return usable text. Falling back to metadata-based extraction.'
        : 'No OCR provider configured. Image/PDF text extraction is limited to metadata fallback.',
    },
  };
};

module.exports = {
  extractTextFromFile,
};
