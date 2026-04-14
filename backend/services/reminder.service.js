const Reminder = require('../models/Reminder');
const { createError } = require('../utils/response');
const {
  areValidTimes,
  isValidDate,
  normalizeStringArray,
  normalizeTimeArray,
  uniqueStrings,
} = require('../utils/validators');

const setTimeOnDate = (date, time) => {
  const [hours, minutes] = time.split(':').map(Number);
  const nextDate = new Date(date);
  nextDate.setHours(hours, minutes, 0, 0);
  return nextDate;
};

const shouldRunOnDate = (scheduleType, daysOfWeek, date) => {
  if (scheduleType === 'daily') {
    return true;
  }

  if (!Array.isArray(daysOfWeek) || daysOfWeek.length === 0) {
    return true;
  }

  return daysOfWeek.includes(date.getDay());
};

const calculateNextTrigger = (payload, referenceDate = new Date()) => {
  const times = normalizeTimeArray(payload.times).sort();
  const startDate = new Date(payload.startDate);
  const endDate = payload.endDate ? new Date(payload.endDate) : null;
  const daysOfWeek = Array.isArray(payload.daysOfWeek)
    ? payload.daysOfWeek.map(Number).filter((value) => Number.isInteger(value) && value >= 0 && value <= 6)
    : [];
  const scheduleType = payload.scheduleType || 'daily';

  if (!times.length) {
    return null;
  }

  const searchStart = new Date(Math.max(referenceDate.getTime(), startDate.getTime()));

  for (let offset = 0; offset < 60; offset += 1) {
    const dayCandidate = new Date(searchStart);
    dayCandidate.setHours(0, 0, 0, 0);
    dayCandidate.setDate(searchStart.getDate() + offset);

    if (endDate && dayCandidate > endDate) {
      break;
    }

    if (!shouldRunOnDate(scheduleType, daysOfWeek, dayCandidate)) {
      continue;
    }

    for (const time of times) {
      const candidate = setTimeOnDate(dayCandidate, time);

      if (candidate >= searchStart && candidate >= startDate && (!endDate || candidate <= endDate)) {
        return candidate;
      }
    }
  }

  return null;
};

const createReminder = async (userId, payload) => {
  const times = normalizeTimeArray(payload.times);

  if (!payload.medicineName || !payload.dosage || !payload.startDate) {
    throw createError('medicineName, dosage, and startDate are required', 400);
  }

  if (!isValidDate(payload.startDate)) {
    throw createError('startDate must be a valid date', 400);
  }

  if (payload.endDate && !isValidDate(payload.endDate)) {
    throw createError('endDate must be a valid date', 400);
  }

  if (!areValidTimes(times)) {
    throw createError('times must contain at least one valid HH:MM entry', 400);
  }

  const daysOfWeek = normalizeStringArray(payload.daysOfWeek)
    .map((value) => Number(value))
    .filter((value) => Number.isInteger(value) && value >= 0 && value <= 6);

  const reminderPayload = {
    user: userId,
    medicineName: String(payload.medicineName).trim(),
    dosage: String(payload.dosage).trim(),
    instructions: String(payload.instructions || '').trim(),
    scheduleType: payload.scheduleType || 'daily',
    times,
    daysOfWeek: uniqueStrings(daysOfWeek).map(Number),
    startDate: new Date(payload.startDate),
    endDate: payload.endDate ? new Date(payload.endDate) : undefined,
    notes: String(payload.notes || '').trim(),
  };

  reminderPayload.nextTriggerAt = calculateNextTrigger(reminderPayload);

  const reminder = await Reminder.create(reminderPayload);
  return reminder;
};

const listReminders = async (userId) => {
  return Reminder.find({ user: userId }).sort({ nextTriggerAt: 1, createdAt: -1 });
};

const deleteReminder = async (userId, reminderId) => {
  const reminder = await Reminder.findOneAndDelete({ _id: reminderId, user: userId });

  if (!reminder) {
    throw createError('Reminder not found', 404);
  }

  return reminder;
};

module.exports = {
  calculateNextTrigger,
  createReminder,
  deleteReminder,
  listReminders,
};
