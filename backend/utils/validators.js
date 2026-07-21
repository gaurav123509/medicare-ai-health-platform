const mongoose = require('mongoose');

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const phoneRegex = /^\+?[0-9\s\-()]{7,20}$/;
const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;

const isValidEmail = (value = '') => emailRegex.test(String(value).trim().toLowerCase());

const isStrongPassword = (password = '') => {
  return typeof password === 'string'
    && password.length >= 8
    && /[A-Za-z]/.test(password)
    && /\d/.test(password);
};

const isValidPhone = (value = '') => phoneRegex.test(String(value).trim());

const requireFields = (payload = {}, fields = []) => {
  return fields.filter((field) => {
    const value = payload[field];

    if (Array.isArray(value)) {
      return value.length === 0;
    }

    return value === undefined || value === null || String(value).trim() === '';
  });
};

const normalizeStringArray = (value) => {
  if (Array.isArray(value)) {
    return value
      .map((item) => String(item).trim())
      .filter(Boolean);
  }

  if (typeof value === 'string') {
    return value
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean);
  }

  return [];
};

const uniqueStrings = (values = []) => [...new Set(normalizeStringArray(values))];

const isValidDate = (value) => {
  if (!value) {
    return false;
  }

  return !Number.isNaN(new Date(value).getTime());
};

const isFutureDate = (value) => {
  if (!isValidDate(value)) {
    return false;
  }

  return new Date(value).getTime() > Date.now();
};

const isValidMongoId = (value) => mongoose.Types.ObjectId.isValid(value);

const normalizeBoolean = (value) => {
  if (typeof value === 'boolean') {
    return value;
  }

  if (typeof value === 'string') {
    return value.toLowerCase() === 'true';
  }

  return Boolean(value);
};

const normalizeNumber = (value) => {
  if (value === undefined || value === null || value === '') {
    return undefined;
  }

  const parsed = Number(value);
  return Number.isNaN(parsed) ? undefined : parsed;
};

const normalizeTimeArray = (value) => {
  return uniqueStrings(value).filter((time) => timeRegex.test(time));
};

const areValidTimes = (times = []) => {
  return Array.isArray(times) && times.length > 0 && times.every((time) => timeRegex.test(time));
};

module.exports = {
  areValidTimes,
  isFutureDate,
  isStrongPassword,
  isValidDate,
  isValidEmail,
  isValidMongoId,
  isValidPhone,
  normalizeBoolean,
  normalizeNumber,
  normalizeStringArray,
  normalizeTimeArray,
  requireFields,
  uniqueStrings,
};
