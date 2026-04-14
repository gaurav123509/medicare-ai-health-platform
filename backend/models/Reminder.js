const mongoose = require('mongoose');

const reminderSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    medicineName: {
      type: String,
      trim: true,
      required: [true, 'Medicine name is required'],
    },
    dosage: {
      type: String,
      trim: true,
      required: [true, 'Dosage is required'],
    },
    instructions: {
      type: String,
      trim: true,
      default: '',
    },
    scheduleType: {
      type: String,
      enum: ['daily', 'weekly', 'custom'],
      default: 'daily',
    },
    times: {
      type: [String],
      required: true,
      validate: {
        validator: (items) => Array.isArray(items) && items.length > 0,
        message: 'At least one reminder time is required',
      },
    },
    daysOfWeek: {
      type: [Number],
      default: [],
    },
    startDate: {
      type: Date,
      required: true,
    },
    endDate: {
      type: Date,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    nextTriggerAt: {
      type: Date,
      default: null,
    },
    notes: {
      type: String,
      trim: true,
      default: '',
    },
  },
  {
    timestamps: true,
  },
);

module.exports = mongoose.model('Reminder', reminderSchema);
