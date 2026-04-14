const express = require('express');
const { bookAppointment, listAppointments } = require('../controllers/appointment.controller');
const protect = require('../middleware/auth');

const router = express.Router();

router.post('/book', protect, bookAppointment);
router.get('/list', protect, listAppointments);

module.exports = router;
