const EmergencyLog = require('../models/EmergencyLog');
const { assessEmergency } = require('../services/emergency.service');
const { asyncHandler } = require('../middleware/errorHandler');
const { createError, sendSuccess } = require('../utils/response');
const { normalizeNumber, normalizeStringArray } = require('../utils/validators');

const triggerSOS = asyncHandler(async (req, res) => {
  const emergencyType = String(req.body.emergencyType || '').trim();

  if (!emergencyType) {
    throw createError('emergencyType is required', 400);
  }

  const payload = {
    emergencyType,
    message: String(req.body.message || '').trim(),
    symptoms: normalizeStringArray(req.body.symptoms),
    contactsNotified: normalizeStringArray(req.body.contactsNotified),
    contactNumber: String(req.body.contactNumber || req.user.phone || '').trim(),
    location: {
      latitude: normalizeNumber(req.body.location?.latitude ?? req.body.latitude),
      longitude: normalizeNumber(req.body.location?.longitude ?? req.body.longitude),
      address: String(req.body.location?.address || req.body.address || '').trim(),
    },
  };

  const assessment = await assessEmergency(payload, req.user);

  const emergencyLog = await EmergencyLog.create({
    user: req.user._id,
    emergencyType,
    message: payload.message,
    location: payload.location,
    contactNumber: payload.contactNumber,
    contactsNotified: assessment.contactsNotified,
    assessment: {
      priority: assessment.priority,
      priorityScore: assessment.priorityScore,
      immediateActions: assessment.immediateActions,
      escalationAdvice: assessment.escalationAdvice,
      responderSummary: assessment.responderSummary,
      responderAlerts: assessment.responderAlerts,
      shareableLocation: assessment.shareableLocation,
      locationMapLink: assessment.locationMapLink,
    },
  });

  return sendSuccess(
    res,
    'SOS alert recorded successfully',
    {
      emergency: emergencyLog,
      assessment,
    },
    201,
  );
});

module.exports = {
  triggerSOS,
};
