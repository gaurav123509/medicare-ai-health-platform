const mongoose = require('mongoose');

const emergencyAssessmentSchema = new mongoose.Schema(
  {
    priority: {
      type: String,
      enum: ['medium', 'high', 'critical'],
      default: 'high',
    },
    priorityScore: {
      type: Number,
      min: 0,
      max: 100,
      default: 70,
    },
    immediateActions: {
      type: [String],
      default: [],
    },
    escalationAdvice: {
      type: String,
      trim: true,
      default: '',
    },
  },
  { _id: false },
);

const locationSchema = new mongoose.Schema(
  {
    latitude: { type: Number },
    longitude: { type: Number },
    address: { type: String, trim: true, default: '' },
  },
  { _id: false },
);

const emergencyLogSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    emergencyType: {
      type: String,
      trim: true,
      required: [true, 'Emergency type is required'],
    },
    message: {
      type: String,
      trim: true,
      default: '',
    },
    location: {
      type: locationSchema,
      default: () => ({}),
    },
    contactNumber: {
      type: String,
      trim: true,
      default: '',
    },
    contactsNotified: {
      type: [String],
      default: [],
    },
    status: {
      type: String,
      enum: ['triggered', 'acknowledged', 'resolved'],
      default: 'triggered',
    },
    assessment: {
      type: emergencyAssessmentSchema,
      default: () => ({}),
    },
  },
  {
    timestamps: true,
  },
);

module.exports = mongoose.model('EmergencyLog', emergencyLogSchema);
