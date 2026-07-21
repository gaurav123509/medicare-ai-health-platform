const {
  CompatibleModel,
  DataTypes,
  createObjectId,
  jsonField,
  sequelize,
} = require('./_sequelize');

class Report extends CompatibleModel {}

Report.init(
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
    title: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: '',
    },
    reportType: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: 'general',
    },
    filePath: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    originalName: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    mimeType: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: '',
    },
    size: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
    extractedText: {
      type: DataTypes.TEXT,
      allowNull: false,
      defaultValue: '',
    },
    analysis: jsonField('analysis', {
      summary: '',
      keyObservations: [],
      abnormalIndicators: [],
      recommendations: [],
      followUpLevel: 'routine',
      provider: 'local-fallback',
    }),
  },
  {
    sequelize,
    modelName: 'Report',
    tableName: 'reports',
    timestamps: true,
  },
);

module.exports = Report;
