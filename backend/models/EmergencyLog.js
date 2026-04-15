const {
  CompatibleModel,
  DataTypes,
  createObjectId,
  jsonField,
  sequelize,
} = require('./_sequelize');

class EmergencyLog extends CompatibleModel {}

EmergencyLog.init(
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
    emergencyType: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    message: {
      type: DataTypes.TEXT,
      allowNull: false,
      defaultValue: '',
    },
    location: jsonField('location', {
      latitude: null,
      longitude: null,
      address: '',
    }),
    contactNumber: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: '',
    },
    contactsNotified: jsonField('contactsNotified', []),
    status: {
      type: DataTypes.ENUM('triggered', 'acknowledged', 'resolved'),
      allowNull: false,
      defaultValue: 'triggered',
    },
    assessment: jsonField('assessment', {
      priority: 'high',
      priorityScore: 70,
      immediateActions: [],
      escalationAdvice: '',
    }),
  },
  {
    sequelize,
    modelName: 'EmergencyLog',
    tableName: 'emergency_logs',
    timestamps: true,
  },
);

module.exports = EmergencyLog;
