const crypto = require('crypto');
const Appointment = require('../models/Appointment');
const User = require('../models/User');
const { createError } = require('../utils/response');
const {
  isFutureDate,
  isValidEmail,
  isValidPhone,
  normalizeNumber,
  normalizeStringArray,
  uniqueStrings,
} = require('../utils/validators');

const JOIN_WINDOW_BEFORE_MS = Math.max(0, Number(process.env.APPOINTMENT_JOIN_BEFORE_MINUTES ?? 0)) * 60 * 1000;
const JOIN_WINDOW_AFTER_MS = Math.max(0, Number(process.env.APPOINTMENT_JOIN_AFTER_MINUTES ?? 45)) * 60 * 1000;
const allowedModes = new Set(['online', 'offline']);
const allowedDemoPaymentMethods = new Set(['demo_upi', 'demo_card', 'demo_wallet']);

const normalizeConsultationModes = (value) => {
  const modes = uniqueStrings(value)
    .map((entry) => entry.toLowerCase())
    .filter((entry) => allowedModes.has(entry));

  return modes.length > 0 ? modes : ['online'];
};

const sanitizeMeetingProvider = (value = '') => {
  return String(value).trim().toLowerCase() === 'custom' ? 'custom' : 'jitsi';
};

const sanitizeDemoPaymentMethod = (value = '') => {
  const normalized = String(value || '').trim().toLowerCase();
  return allowedDemoPaymentMethods.has(normalized) ? normalized : 'demo_upi';
};

const slugify = (value = '') => {
  return String(value)
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40);
};

const toAppointmentDate = (value) => {
  if (!isFutureDate(value)) {
    throw createError('appointmentDate must be a valid future date', 400);
  }

  return new Date(value);
};

const ensureDoctorAccess = (doctor, mode) => {
  const consultationModes = normalizeConsultationModes(doctor.consultationModes);

  if (!consultationModes.includes(mode)) {
    throw createError(`Selected doctor is not available for ${mode} consultations`, 400);
  }
};

const buildMeetingDetails = ({
  preferredProvider,
  roomId,
  customMeetingLink,
}) => {
  const meetingLink = String(customMeetingLink || '').trim();
  if (meetingLink) {
    return {
      meetingProvider: 'custom',
      meetingLink,
    };
  }

  const meetingBaseUrl = String(process.env.MEETING_BASE_URL || '').trim().replace(/\/+$/g, '');
  if (preferredProvider === 'custom' && meetingBaseUrl) {
    return {
      meetingProvider: 'custom',
      meetingLink: `${meetingBaseUrl}/${roomId}`,
    };
  }

  return {
    meetingProvider: 'jitsi',
    meetingLink: `https://meet.jit.si/${roomId}`,
  };
};

const buildRoomId = ({ appointmentDate, patient, doctor }) => {
  const datePart = appointmentDate.toISOString().replace(/[-:.TZ]/g, '').slice(0, 12);
  const patientSlug = slugify(patient?.name || patient?._id || 'patient');
  const doctorSlug = slugify(doctor?.name || doctor?._id || 'doctor');
  const nonce = crypto.randomBytes(3).toString('hex');

  return `medicare-${doctorSlug}-${patientSlug}-${datePart}-${nonce}`;
};

const serializeDoctor = (doctor) => {
  return {
    _id: doctor._id,
    name: doctor.name,
    email: doctor.email,
    phone: doctor.phone,
    specialty: doctor.specialty,
    hospitalName: doctor.hospitalName,
    consultationFee: doctor.consultationFee,
    consultationModes: normalizeConsultationModes(doctor.consultationModes),
    meetingProvider: sanitizeMeetingProvider(doctor.meetingProvider),
    bio: doctor.bio,
  };
};

const resolveDoctor = async (doctorId) => {
  if (!doctorId) {
    return null;
  }

  const doctor = await User.findOne({ _id: String(doctorId).trim(), role: 'doctor' });
  if (!doctor) {
    throw createError('Doctor not found', 404);
  }

  return doctor;
};

const findConflictingAppointment = async ({ doctorId, appointmentDate, excludeAppointmentId }) => {
  if (!doctorId) {
    return null;
  }

  const bookedAppointments = await Appointment.find({
    doctorId,
    status: 'booked',
  }).sort({ appointmentDate: 1 });

  return bookedAppointments.find((appointment) => {
    if (excludeAppointmentId && String(appointment._id) === String(excludeAppointmentId)) {
      return false;
    }

    const existingTime = new Date(appointment.appointmentDate).getTime();
    const nextTime = appointmentDate.getTime();
    return Math.abs(existingTime - nextTime) < 30 * 60 * 1000;
  }) || null;
};

const validateManualDoctorFields = ({ doctorName, specialty, contactEmail, contactPhone }) => {
  if (!doctorName || !specialty) {
    throw createError('doctorId or both doctorName and specialty are required', 400);
  }

  if (contactEmail && !isValidEmail(contactEmail)) {
    throw createError('contactEmail must be valid', 400);
  }

  if (contactPhone && !isValidPhone(contactPhone)) {
    throw createError('contactPhone must be valid', 400);
  }
};

const assertAppointmentAccess = (appointment, user) => {
  const userId = String(user._id);
  const isOwner = String(appointment.user) === userId;
  const isAssignedDoctor = appointment.doctorId && String(appointment.doctorId) === userId;
  const isAdmin = user.role === 'admin';

  if (!isOwner && !isAssignedDoctor && !isAdmin) {
    throw createError('You are not authorized to access this appointment', 403);
  }
};

const assertAppointmentEditable = (appointment) => {
  if (appointment.status === 'cancelled') {
    throw createError('Cancelled appointments cannot be modified', 400);
  }

  if (appointment.status === 'completed') {
    throw createError('Completed appointments cannot be modified', 400);
  }
};

const assertPaymentAllowed = (appointment) => {
  if (appointment.status === 'cancelled') {
    throw createError('Cancelled appointments cannot be paid', 400);
  }

  if (appointment.paymentStatus === 'paid') {
    throw createError('Appointment payment is already completed', 409);
  }

  if ((normalizeNumber(appointment.fee) || 0) <= 0) {
    throw createError('This appointment does not require payment', 400);
  }
};

const loadAppointmentForUser = async (appointmentId, user) => {
  const appointment = await Appointment.findById(String(appointmentId).trim());
  if (!appointment) {
    throw createError('Appointment not found', 404);
  }

  assertAppointmentAccess(appointment, user);
  return appointment;
};

const listDoctors = async () => {
  const doctors = await User.find({ role: 'doctor' }).sort({ createdAt: -1 });
  return doctors.map(serializeDoctor);
};

const createAppointment = async ({ user, payload }) => {
  const doctor = await resolveDoctor(payload.doctorId);
  const mode = String(payload.mode || 'online').trim().toLowerCase() === 'offline'
    ? 'offline'
    : 'online';
  const appointmentDate = toAppointmentDate(payload.appointmentDate);

  let doctorName = String(payload.doctorName || '').trim();
  let specialty = String(payload.specialty || '').trim();
  let hospitalName = String(payload.hospitalName || '').trim();
  let contactEmail = String(payload.contactEmail || '').trim().toLowerCase();
  let contactPhone = String(payload.contactPhone || '').trim();
  let fee = normalizeNumber(payload.fee) || 0;
  let doctorId = '';
  let meetingProvider = sanitizeMeetingProvider(payload.meetingProvider);

  if (doctor) {
    ensureDoctorAccess(doctor, mode);

    const conflictingAppointment = await findConflictingAppointment({
      doctorId: doctor._id,
      appointmentDate,
    });

    if (conflictingAppointment) {
      throw createError('Doctor already has another appointment in this time slot', 409);
    }

    doctorId = doctor._id;
    doctorName = doctor.name;
    specialty = doctor.specialty || specialty;
    hospitalName = doctor.hospitalName || hospitalName;
    contactEmail = doctor.email;
    contactPhone = doctor.phone;
    fee = normalizeNumber(payload.fee ?? doctor.consultationFee) || 0;
    meetingProvider = sanitizeMeetingProvider(doctor.meetingProvider);
  } else {
    validateManualDoctorFields({
      doctorName,
      specialty,
      contactEmail,
      contactPhone,
    });
  }

  if (!specialty) {
    throw createError('specialty is required to book a consultation', 400);
  }

  let meetingRoomId = '';
  let meetingLink = '';

  if (mode === 'online') {
    meetingRoomId = buildRoomId({
      appointmentDate,
      patient: user,
      doctor: doctor || { name: doctorName },
    });

    const meetingDetails = buildMeetingDetails({
      preferredProvider: meetingProvider,
      roomId: meetingRoomId,
      customMeetingLink: payload.meetingLink,
    });

    meetingProvider = meetingDetails.meetingProvider;
    meetingLink = meetingDetails.meetingLink;
  } else {
    meetingProvider = '';
  }

  return Appointment.create({
    user: user._id,
    doctorId,
    doctorName,
    specialty,
    hospitalName,
    appointmentDate,
    mode,
    symptoms: normalizeStringArray(payload.symptoms),
    notes: String(payload.notes || '').trim(),
    contactEmail,
    contactPhone,
    meetingLink,
    meetingProvider,
    meetingRoomId,
    fee,
    paymentStatus: fee > 0 ? 'pending' : 'paid',
    paymentMethod: fee > 0 ? '' : 'free',
    paymentReference: fee > 0 ? '' : `FREE-${Date.now()}`,
    paymentAmount: fee,
    paymentPaidAt: fee > 0 ? null : new Date(),
  });
};

const listAppointmentsForUser = async (user) => {
  if (user.role === 'doctor') {
    return Appointment.find({ doctorId: user._id }).sort({ appointmentDate: 1 });
  }

  if (user.role === 'admin') {
    return Appointment.find({}).sort({ appointmentDate: 1 });
  }

  return Appointment.find({ user: user._id }).sort({ appointmentDate: 1 });
};

const getAppointmentForUser = async (appointmentId, user) => {
  return loadAppointmentForUser(appointmentId, user);
};

const rescheduleAppointment = async ({ appointmentId, user, payload }) => {
  const appointment = await loadAppointmentForUser(appointmentId, user);
  assertAppointmentEditable(appointment);

  const appointmentDate = toAppointmentDate(payload.appointmentDate);
  const nextMode = String(payload.mode || appointment.mode).trim().toLowerCase() === 'offline'
    ? 'offline'
    : 'online';

  if (appointment.doctorId) {
    const doctor = await resolveDoctor(appointment.doctorId);
    ensureDoctorAccess(doctor, nextMode);

    const conflictingAppointment = await findConflictingAppointment({
      doctorId: appointment.doctorId,
      appointmentDate,
      excludeAppointmentId: appointment._id,
    });

    if (conflictingAppointment) {
      throw createError('Doctor already has another appointment in this time slot', 409);
    }

    if (nextMode === 'online' && !appointment.meetingRoomId) {
      appointment.meetingRoomId = buildRoomId({
        appointmentDate,
        patient: { _id: appointment.user },
        doctor,
      });
    }

    if (nextMode === 'online') {
      const meetingDetails = buildMeetingDetails({
        preferredProvider: sanitizeMeetingProvider(doctor.meetingProvider),
        roomId: appointment.meetingRoomId || buildRoomId({
          appointmentDate,
          patient: { _id: appointment.user },
          doctor,
        }),
        customMeetingLink: payload.meetingLink || appointment.meetingLink,
      });

      appointment.meetingProvider = meetingDetails.meetingProvider;
      appointment.meetingLink = meetingDetails.meetingLink;
    }
  } else if (nextMode === 'online' && !appointment.meetingRoomId) {
    appointment.meetingRoomId = buildRoomId({
      appointmentDate,
      patient: { _id: appointment.user },
      doctor: { name: appointment.doctorName },
    });

    const meetingDetails = buildMeetingDetails({
      preferredProvider: sanitizeMeetingProvider(payload.meetingProvider || appointment.meetingProvider),
      roomId: appointment.meetingRoomId,
      customMeetingLink: payload.meetingLink || appointment.meetingLink,
    });

    appointment.meetingProvider = meetingDetails.meetingProvider;
    appointment.meetingLink = meetingDetails.meetingLink;
  }

  appointment.appointmentDate = appointmentDate;
  appointment.mode = nextMode;

  if (nextMode === 'offline') {
    appointment.meetingLink = '';
    appointment.meetingProvider = '';
    appointment.meetingRoomId = '';
  }

  await appointment.save();
  return appointment;
};

const cancelAppointment = async ({ appointmentId, user, payload }) => {
  const appointment = await loadAppointmentForUser(appointmentId, user);
  assertAppointmentEditable(appointment);

  appointment.status = 'cancelled';
  appointment.cancelReason = String(payload.reason || '').trim();
  appointment.cancelledAt = new Date();

  await appointment.save();
  return appointment;
};

const payDemoAppointment = async ({ appointmentId, user, payload }) => {
  const appointment = await loadAppointmentForUser(appointmentId, user);
  assertPaymentAllowed(appointment);

  const amount = normalizeNumber(payload.amount) || normalizeNumber(appointment.fee) || 0;
  const expectedAmount = normalizeNumber(appointment.fee) || 0;

  if (expectedAmount > 0 && Math.abs(amount - expectedAmount) > 0.01) {
    throw createError(`Demo payment amount must match the consultation fee of Rs. ${expectedAmount}`, 400);
  }

  appointment.paymentStatus = 'paid';
  appointment.paymentMethod = sanitizeDemoPaymentMethod(payload.paymentMethod);
  appointment.paymentAmount = expectedAmount || amount;
  appointment.paymentReference = `DEMO-${Date.now()}-${crypto.randomBytes(3).toString('hex').toUpperCase()}`;
  appointment.paymentPaidAt = new Date();

  await appointment.save();
  return appointment;
};

const getJoinDetails = async ({ appointmentId, user }) => {
  const appointment = await loadAppointmentForUser(appointmentId, user);

  if (appointment.mode !== 'online') {
    throw createError('Join details are only available for online consultations', 400);
  }

  if (appointment.status !== 'booked') {
    throw createError('Only booked appointments can be joined', 400);
  }

  const appointmentTime = new Date(appointment.appointmentDate).getTime();
  const availableFrom = new Date(appointmentTime - JOIN_WINDOW_BEFORE_MS);
  const availableUntil = new Date(appointmentTime + JOIN_WINDOW_AFTER_MS);
  const now = Date.now();

  return {
    appointmentId: appointment._id,
    doctorName: appointment.doctorName,
    specialty: appointment.specialty,
    appointmentDate: appointment.appointmentDate,
    meetingProvider: appointment.meetingProvider || 'jitsi',
    meetingLink: appointment.meetingLink,
    meetingRoomId: appointment.meetingRoomId,
    canJoinNow: now >= availableFrom.getTime() && now <= availableUntil.getTime(),
    availableFrom,
    availableUntil,
  };
};

module.exports = {
  createAppointment,
  getAppointmentForUser,
  getJoinDetails,
  listAppointmentsForUser,
  listDoctors,
  normalizeConsultationModes,
  payDemoAppointment,
  rescheduleAppointment,
  cancelAppointment,
};
