const mongoose = require('mongoose');

const appointmentSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    doctorName: {
      type: String,
      trim: true,
      required: [true, 'Doctor name is required'],
    },
    specialty: {
      type: String,
      trim: true,
      required: [true, 'Specialty is required'],
    },
    hospitalName: {
      type: String,
      trim: true,
      default: '',
    },
    appointmentDate: {
      type: Date,
      required: [true, 'Appointment date is required'],
    },
    mode: {
      type: String,
      enum: ['online', 'offline'],
      default: 'online',
    },
    symptoms: {
      type: [String],
      default: [],
    },
    notes: {
      type: String,
      trim: true,
      default: '',
    },
    status: {
      type: String,
      enum: ['booked', 'completed', 'cancelled'],
      default: 'booked',
    },
    contactEmail: {
      type: String,
      trim: true,
      default: '',
    },
    contactPhone: {
      type: String,
      trim: true,
      default: '',
    },
    meetingLink: {
      type: String,
      trim: true,
      default: '',
    },
    fee: {
      type: Number,
      min: 0,
      default: 0,
    },
  },
  {
    timestamps: true,
  },
);

module.exports = mongoose.model('Appointment', appointmentSchema);
