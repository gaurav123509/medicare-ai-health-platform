const {
  CompatibleModel,
  DataTypes,
  createObjectId,
  jsonField,
  sequelize,
} = require('./_sequelize');

class Reminder extends CompatibleModel {}

Reminder.init(
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
    dosage: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    instructions: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: '',
    },
    scheduleType: {
      type: DataTypes.ENUM('daily', 'weekly', 'custom'),
      allowNull: false,
      defaultValue: 'daily',
    },
    times: jsonField('times', []),
    daysOfWeek: jsonField('daysOfWeek', []),
    startDate: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    endDate: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
    nextTriggerAt: {
      type: DataTypes.DATE,
      allowNull: true,
      defaultValue: null,
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: false,
      defaultValue: '',
    },
  },
  {
    sequelize,
    modelName: 'Reminder',
    tableName: 'reminders',
    timestamps: true,
  },
);

module.exports = Reminder;
