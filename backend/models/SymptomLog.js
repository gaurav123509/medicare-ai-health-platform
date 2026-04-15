const {
  CompatibleModel,
  DataTypes,
  createObjectId,
  jsonField,
  sequelize,
} = require('./_sequelize');

class SymptomLog extends CompatibleModel {}

SymptomLog.init(
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
    source: {
      type: DataTypes.ENUM('symptom-check', 'disease-predict'),
      allowNull: false,
      defaultValue: 'symptom-check',
    },
    symptoms: jsonField('symptoms', []),
    duration: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: '',
    },
    severity: {
      type: DataTypes.ENUM('mild', 'moderate', 'severe'),
      allowNull: false,
      defaultValue: 'mild',
    },
    age: {
      type: DataTypes.INTEGER,
      allowNull: true,
      validate: {
        min: 0,
        max: 120,
      },
    },
    gender: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: '',
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: false,
      defaultValue: '',
    },
    aiResponse: jsonField('aiResponse', {
      summary: '',
      triageLevel: 'low',
      possibleConditions: [],
      recommendations: [],
      redFlags: [],
      provider: 'local-fallback',
      rawText: '',
    }),
  },
  {
    sequelize,
    modelName: 'SymptomLog',
    tableName: 'symptom_logs',
    timestamps: true,
  },
);

module.exports = SymptomLog;
