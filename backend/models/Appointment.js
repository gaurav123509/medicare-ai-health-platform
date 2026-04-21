const {
  CompatibleModel,
  DataTypes,
  createObjectId,
  jsonField,
  sequelize,
} = require('./_sequelize');

class Appointment extends CompatibleModel {}

Appointment.init(
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
    doctorId: {
      type: DataTypes.STRING(24),
      allowNull: false,
      defaultValue: '',
    },
    doctorName: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    specialty: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    hospitalName: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: '',
    },
    appointmentDate: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    mode: {
      type: DataTypes.ENUM('online', 'offline'),
      allowNull: false,
      defaultValue: 'online',
    },
    symptoms: jsonField('symptoms', []),
    notes: {
      type: DataTypes.TEXT,
      allowNull: false,
      defaultValue: '',
    },
    status: {
      type: DataTypes.ENUM('booked', 'completed', 'cancelled'),
      allowNull: false,
      defaultValue: 'booked',
    },
    contactEmail: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: '',
    },
    contactPhone: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: '',
    },
    meetingLink: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: '',
    },
    meetingProvider: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: '',
    },
    meetingRoomId: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: '',
    },
    fee: {
      type: DataTypes.FLOAT,
      allowNull: false,
      defaultValue: 0,
    },
    paymentStatus: {
      type: DataTypes.ENUM('pending', 'paid', 'failed', 'refunded'),
      allowNull: false,
      defaultValue: 'pending',
    },
    paymentMethod: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: '',
    },
    paymentReference: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: '',
    },
    paymentAmount: {
      type: DataTypes.FLOAT,
      allowNull: false,
      defaultValue: 0,
    },
    paymentPaidAt: {
      type: DataTypes.DATE,
      allowNull: true,
      defaultValue: null,
    },
    cancelReason: {
      type: DataTypes.TEXT,
      allowNull: false,
      defaultValue: '',
    },
    cancelledAt: {
      type: DataTypes.DATE,
      allowNull: true,
      defaultValue: null,
    },
  },
  {
    sequelize,
    modelName: 'Appointment',
    tableName: 'appointments',
    timestamps: true,
  },
);

module.exports = Appointment;
