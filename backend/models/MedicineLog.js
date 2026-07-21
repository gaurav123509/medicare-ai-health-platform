const {
  CompatibleModel,
  DataTypes,
  createObjectId,
  jsonField,
  sequelize,
} = require('./_sequelize');

class MedicineLog extends CompatibleModel {}

MedicineLog.init(
  {
    _id: {
      type: DataTypes.STRING(24),
      primaryKey: true,
      allowNull: false,
      defaultValue: createObjectId,
    },
    user: {
      type: DataTypes.STRING(24),
      allowNull: false,
    },
    medicineName: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    batchNumber: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: '',
    },
    manufacturer: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: '',
    },
    expiryDate: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    purchaseSource: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: '',
    },
    packagingCondition: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: '',
    },
    uploadedImagePath: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: '',
    },
    uploadedImageOriginalName: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: '',
    },
    verificationResult: jsonField('verificationResult', {
      isLikelyAuthentic: true,
      confidence: 0.5,
      riskLevel: 'low',
      indicators: [],
      recommendations: [],
      extractedText: [],
      provider: 'rule-engine',
    }),
  },
  {
    sequelize,
    modelName: 'MedicineLog',
    tableName: 'medicine_logs',
    timestamps: true,
  },
);

module.exports = MedicineLog;
