const mongoose = require('mongoose');

const reportAnalysisSchema = new mongoose.Schema(
  {
    summary: { type: String, trim: true, default: '' },
    keyObservations: { type: [String], default: [] },
    abnormalIndicators: { type: [String], default: [] },
    recommendations: { type: [String], default: [] },
    followUpLevel: {
      type: String,
      enum: ['routine', 'soon', 'urgent'],
      default: 'routine',
    },
    provider: { type: String, default: 'local-fallback' },
  },
  { _id: false },
);

const reportSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    title: {
      type: String,
      trim: true,
      default: '',
    },
    reportType: {
      type: String,
      trim: true,
      default: 'general',
    },
    filePath: {
      type: String,
      required: true,
      trim: true,
    },
    originalName: {
      type: String,
      trim: true,
      required: true,
    },
    mimeType: {
      type: String,
      trim: true,
      default: '',
    },
    size: {
      type: Number,
      default: 0,
    },
    extractedText: {
      type: String,
      default: '',
    },
    analysis: {
      type: reportAnalysisSchema,
      default: () => ({}),
    },
  },
  {
    timestamps: true,
  },
);

module.exports = mongoose.model('Report', reportSchema);
