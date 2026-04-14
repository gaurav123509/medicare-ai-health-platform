const mongoose = require('mongoose');

const verificationResultSchema = new mongoose.Schema(
  {
    isLikelyAuthentic: { type: Boolean, default: true },
    confidence: { type: Number, min: 0, max: 1, default: 0.5 },
    riskLevel: {
      type: String,
      enum: ['low', 'medium', 'high'],
      default: 'low',
    },
    indicators: { type: [String], default: [] },
    recommendations: { type: [String], default: [] },
    extractedText: { type: [String], default: [] },
    provider: { type: String, default: 'rule-engine' },
  },
  { _id: false },
);

const medicineLogSchema = new mongoose.Schema(
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
    batchNumber: {
      type: String,
      trim: true,
      default: '',
    },
    manufacturer: {
      type: String,
      trim: true,
      default: '',
    },
    expiryDate: {
      type: Date,
    },
    purchaseSource: {
      type: String,
      trim: true,
      default: '',
    },
    packagingCondition: {
      type: String,
      trim: true,
      default: '',
    },
    uploadedImagePath: {
      type: String,
      trim: true,
      default: '',
    },
    uploadedImageOriginalName: {
      type: String,
      trim: true,
      default: '',
    },
    verificationResult: {
      type: verificationResultSchema,
      default: () => ({}),
    },
  },
  {
    timestamps: true,
  },
);

module.exports = mongoose.model('MedicineLog', medicineLogSchema);
