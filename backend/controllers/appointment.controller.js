const { asyncHandler } = require('../middleware/errorHandler');
const { sendSuccess } = require('../utils/response');
const {
  cancelAppointment,
  createAppointment,
  getAppointmentForUser,
  getJoinDetails,
  listAppointmentsForUser,
  listDoctors,
  payDemoAppointment,
  rescheduleAppointment,
} = require('../services/appointment.service');

const bookAppointment = asyncHandler(async (req, res) => {
  const appointment = await createAppointment({
    user: req.user,
    payload: req.body,
  });

  return sendSuccess(res, 'Appointment booked successfully', { appointment }, 201);
});

const listAppointments = asyncHandler(async (req, res) => {
  const appointments = await listAppointmentsForUser(req.user);
  return sendSuccess(res, 'Appointments fetched successfully', { appointments });
});

const listDoctorsController = asyncHandler(async (req, res) => {
  const doctors = await listDoctors();
  return sendSuccess(res, 'Doctors fetched successfully', { doctors });
});

const getAppointmentController = asyncHandler(async (req, res) => {
  const appointment = await getAppointmentForUser(req.params.id, req.user);
  return sendSuccess(res, 'Appointment fetched successfully', { appointment });
});

const rescheduleAppointmentController = asyncHandler(async (req, res) => {
  const appointment = await rescheduleAppointment({
    appointmentId: req.params.id,
    user: req.user,
    payload: req.body,
  });

  return sendSuccess(res, 'Appointment rescheduled successfully', { appointment });
});

const cancelAppointmentController = asyncHandler(async (req, res) => {
  const appointment = await cancelAppointment({
    appointmentId: req.params.id,
    user: req.user,
    payload: req.body,
  });

  return sendSuccess(res, 'Appointment cancelled successfully', { appointment });
});

const joinAppointmentController = asyncHandler(async (req, res) => {
  const joinDetails = await getJoinDetails({
    appointmentId: req.params.id,
    user: req.user,
  });

  return sendSuccess(res, 'Join details fetched successfully', { joinDetails });
});

const payDemoAppointmentController = asyncHandler(async (req, res) => {
  const appointment = await payDemoAppointment({
    appointmentId: req.params.id,
    user: req.user,
    payload: req.body,
  });

  return sendSuccess(res, 'Demo payment completed successfully', { appointment });
});

module.exports = {
  bookAppointment,
  cancelAppointmentController,
  getAppointmentController,
  joinAppointmentController,
  listAppointments,
  listDoctorsController,
  payDemoAppointmentController,
  rescheduleAppointmentController,
};
