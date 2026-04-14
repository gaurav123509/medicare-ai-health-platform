const mongoose = require('mongoose');

const possibleConditionSchema = new mongoose.Schema(
  {
    name: { type: String, trim: true, required: true },
    probability: { type: Number, min: 0, max: 1, default: 0 },
    rationale: { type: String, trim: true, default: '' },
  },
  { _id: false },
);

const aiResponseSchema = new mongoose.Schema(
  {
    summary: { type: String, trim: true, default: '' },
    triageLevel: {
      type: String,
      enum: ['low', 'medium', 'high', 'critical'],
      default: 'low',
    },
    possibleConditions: {
      type: [possibleConditionSchema],
      default: [],
    },
    recommendations: {
      type: [String],
      default: [],
    },
    redFlags: {
      type: [String],
      default: [],
    },
    provider: {
      type: String,
      default: 'local-fallback',
    },
    rawText: {
      type: String,
      default: '',
    },
  },
  { _id: false },
);

const symptomLogSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    source: {
      type: String,
      enum: ['symptom-check', 'disease-predict'],
      default: 'symptom-check',
    },
    symptoms: {
      type: [String],
      required: true,
      validate: {
        validator: (items) => Array.isArray(items) && items.length > 0,
        message: 'At least one symptom is required',
      },
    },
    duration: {
      type: String,
      trim: true,
      default: '',
    },
    severity: {
      type: String,
      enum: ['mild', 'moderate', 'severe'],
      default: 'mild',
    },
    age: {
      type: Number,
      min: 0,
      max: 120,
    },
    gender: {
      type: String,
      trim: true,
      default: '',
    },
    notes: {
      type: String,
      trim: true,
      default: '',
    },
    aiResponse: {
      type: aiResponseSchema,
      default: () => ({}),
    },
  },
  {
    timestamps: true,
  },
);

module.exports = mongoose.model('SymptomLog', symptomLogSchema);
