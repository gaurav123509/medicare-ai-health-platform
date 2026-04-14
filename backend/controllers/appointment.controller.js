const Appointment = require('../models/Appointment');
const { asyncHandler } = require('../middleware/errorHandler');
const { createError, sendSuccess } = require('../utils/response');
const { isFutureDate, isValidEmail, isValidPhone, normalizeNumber, normalizeStringArray } = require('../utils/validators');

const bookAppointment = asyncHandler(async (req, res) => {
  const doctorName = String(req.body.doctorName || '').trim();
  const specialty = String(req.body.specialty || '').trim();
  const appointmentDate = req.body.appointmentDate;

  if (!doctorName || !specialty || !appointmentDate) {
    throw createError('doctorName, specialty, and appointmentDate are required', 400);
  }

  if (!isFutureDate(appointmentDate)) {
    throw createError('appointmentDate must be a valid future date', 400);
  }

  if (req.body.contactEmail && !isValidEmail(req.body.contactEmail)) {
    throw createError('contactEmail must be valid', 400);
  }

  if (req.body.contactPhone && !isValidPhone(req.body.contactPhone)) {
    throw createError('contactPhone must be valid', 400);
  }

  const appointment = await Appointment.create({
    user: req.user._id,
    doctorName,
    specialty,
    hospitalName: String(req.body.hospitalName || '').trim(),
    appointmentDate: new Date(appointmentDate),
    mode: req.body.mode === 'offline' ? 'offline' : 'online',
    symptoms: normalizeStringArray(req.body.symptoms),
    notes: String(req.body.notes || '').trim(),
    contactEmail: String(req.body.contactEmail || '').trim().toLowerCase(),
    contactPhone: String(req.body.contactPhone || '').trim(),
    meetingLink: String(req.body.meetingLink || '').trim(),
    fee: normalizeNumber(req.body.fee) || 0,
  });

  return sendSuccess(res, 'Appointment booked successfully', { appointment }, 201);
});

const listAppointments = asyncHandler(async (req, res) => {
  const appointments = await Appointment.find({ user: req.user._id }).sort({ appointmentDate: 1 });
  return sendSuccess(res, 'Appointments fetched successfully', { appointments });
});

module.exports = {
  bookAppointment,
  listAppointments,
};
