const express = require('express');
const {
  bookAppointment,
  cancelAppointmentController,
  getAppointmentController,
  joinAppointmentController,
  listAppointments,
  listDoctorsController,
  payDemoAppointmentController,
  rescheduleAppointmentController,
} = require('../controllers/appointment.controller');
const protect = require('../middleware/auth');

const router = express.Router();

router.get('/doctors', protect, listDoctorsController);
router.post('/book', protect, bookAppointment);
router.get('/list', protect, listAppointments);
router.get('/:id', protect, getAppointmentController);
router.post('/:id/pay-demo', protect, payDemoAppointmentController);
router.patch('/:id/reschedule', protect, rescheduleAppointmentController);
router.patch('/:id/cancel', protect, cancelAppointmentController);
router.get('/:id/join', protect, joinAppointmentController);

module.exports = router;
