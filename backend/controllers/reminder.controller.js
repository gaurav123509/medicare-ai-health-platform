const { asyncHandler } = require('../middleware/errorHandler');
const { sendSuccess } = require('../utils/response');
const { createReminder, deleteReminder, listReminders } = require('../services/reminder.service');

const createReminderController = asyncHandler(async (req, res) => {
  const reminder = await createReminder(req.user._id, req.body);
  return sendSuccess(res, 'Reminder created successfully', { reminder }, 201);
});

const listReminderController = asyncHandler(async (req, res) => {
  const reminders = await listReminders(req.user._id);
  return sendSuccess(res, 'Reminders fetched successfully', { reminders });
});

const deleteReminderController = asyncHandler(async (req, res) => {
  const reminder = await deleteReminder(req.user._id, req.params.id);
  return sendSuccess(res, 'Reminder deleted successfully', { reminder });
});

module.exports = {
  createReminderController,
  deleteReminderController,
  listReminderController,
};
