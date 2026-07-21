const express = require('express');
const {
  createReminderController,
  deleteReminderController,
  listReminderController,
} = require('../controllers/reminder.controller');
const protect = require('../middleware/auth');

const router = express.Router();

router.post('/create', protect, createReminderController);
router.get('/list', protect, listReminderController);
router.delete('/:id', protect, deleteReminderController);

module.exports = router;
