const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { asyncHandler } = require('../middleware/errorHandler');
const { createError, sendSuccess } = require('../utils/response');
const {
  isStrongPassword,
  isValidEmail,
  isValidPhone,
  normalizeNumber,
  normalizeStringArray,
  requireFields,
} = require('../utils/validators');

const normalizeConsultationModes = (value) => {
  const modes = normalizeStringArray(value)
    .map((entry) => entry.toLowerCase())
    .filter((entry) => ['online', 'offline'].includes(entry));

  return modes.length > 0 ? [...new Set(modes)] : ['online'];
};

const generateToken = (userId) => {
  if (!process.env.JWT_SECRET) {
    throw createError('JWT secret is not configured on the server', 500);
  }

  return jwt.sign(
    { userId },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' },
  );
};

const signup = asyncHandler(async (req, res) => {
  const missingFields = requireFields(req.body, ['name', 'email', 'password']);
  if (missingFields.length > 0) {
    throw createError(`Missing required fields: ${missingFields.join(', ')}`, 400);
  }

  const {
    name,
    email,
    password,
    phone,
    age,
    gender,
    bloodGroup,
    emergencyContact,
    specialty,
    hospitalName,
    consultationFee,
    consultationModes,
    meetingProvider,
    bio,
  } = req.body;
  const requestedRole = String(req.body.role || 'patient').trim().toLowerCase();
  const role = requestedRole === 'doctor' ? 'doctor' : 'patient';

  if (!isValidEmail(email)) {
    throw createError('Please provide a valid email address', 400);
  }

  if (!isStrongPassword(password)) {
    throw createError('Password must be at least 8 characters and include letters and numbers', 400);
  }

  if (phone && !isValidPhone(phone)) {
    throw createError('Please provide a valid phone number', 400);
  }

  if (requestedRole === 'admin') {
    throw createError('Admin signup is not allowed from this endpoint', 403);
  }

  if (role === 'doctor' && !String(specialty || '').trim()) {
    throw createError('specialty is required for doctor accounts', 400);
  }

  const existingUser = await User.findOne({ email: String(email).trim().toLowerCase() });
  if (existingUser) {
    throw createError('Email already registered', 409);
  }

  const user = await User.create({
    name: String(name).trim(),
    email: String(email).trim().toLowerCase(),
    password,
    phone: phone ? String(phone).trim() : '',
    age: age ? Number(age) : undefined,
    gender: gender || undefined,
    bloodGroup: bloodGroup ? String(bloodGroup).trim() : '',
    role,
    specialty: role === 'doctor' ? String(specialty || '').trim() : '',
    hospitalName: role === 'doctor' ? String(hospitalName || '').trim() : '',
    consultationFee: role === 'doctor' ? normalizeNumber(consultationFee) || 0 : 0,
    consultationModes: role === 'doctor' ? normalizeConsultationModes(consultationModes) : ['online'],
    meetingProvider: role === 'doctor' && String(meetingProvider || '').trim().toLowerCase() === 'custom'
      ? 'custom'
      : 'jitsi',
    bio: role === 'doctor' ? String(bio || '').trim() : '',
    emergencyContact: emergencyContact && typeof emergencyContact === 'object'
      ? {
        name: String(emergencyContact.name || '').trim(),
        phone: String(emergencyContact.phone || '').trim(),
        relation: String(emergencyContact.relation || '').trim(),
      }
      : undefined,
  });

  const token = generateToken(user._id);

  return sendSuccess(
    res,
    'User registered successfully',
    {
      token,
      user,
    },
    201,
  );
});

const login = asyncHandler(async (req, res) => {
  const missingFields = requireFields(req.body, ['email', 'password']);
  if (missingFields.length > 0) {
    throw createError(`Missing required fields: ${missingFields.join(', ')}`, 400);
  }

  const { email, password } = req.body;

  if (!isValidEmail(email)) {
    throw createError('Please provide a valid email address', 400);
  }

  const user = await User.findOne({ email: String(email).trim().toLowerCase() }).select('+password');
  if (!user) {
    throw createError('Invalid email or password', 401);
  }

  const isPasswordCorrect = await user.comparePassword(password);
  if (!isPasswordCorrect) {
    throw createError('Invalid email or password', 401);
  }

  const token = generateToken(user._id);
  user.password = undefined;

  return sendSuccess(res, 'Login successful', { token, user });
});

const profile = asyncHandler(async (req, res) => {
  return sendSuccess(res, 'Profile fetched successfully', { user: req.user });
});

const updateProfile = asyncHandler(async (req, res) => {
  const user = req.user;
  const allowedGenders = ['male', 'female', 'other', 'prefer_not_to_say'];

  if (req.body.name !== undefined) {
    const nextName = String(req.body.name || '').trim();

    if (nextName.length < 2) {
      throw createError('Name must be at least 2 characters long', 400);
    }

    user.name = nextName;
  }

  if (req.body.phone !== undefined) {
    const nextPhone = String(req.body.phone || '').trim();

    if (nextPhone && !isValidPhone(nextPhone)) {
      throw createError('Please provide a valid phone number', 400);
    }

    user.phone = nextPhone;
  }

  if (req.body.age !== undefined) {
    if (req.body.age === '' || req.body.age === null) {
      user.age = null;
    } else {
      const nextAge = normalizeNumber(req.body.age);

      if (nextAge === undefined || nextAge < 0 || nextAge > 120) {
        throw createError('Please provide a valid age', 400);
      }

      user.age = nextAge;
    }
  }

  if (req.body.gender !== undefined) {
    const nextGender = String(req.body.gender || '').trim().toLowerCase();

    if (!allowedGenders.includes(nextGender)) {
      throw createError('Please provide a valid gender option', 400);
    }

    user.gender = nextGender;
  }

  if (req.body.bloodGroup !== undefined) {
    user.bloodGroup = String(req.body.bloodGroup || '').trim();
  }

  if (req.body.emergencyContact !== undefined) {
    if (typeof req.body.emergencyContact !== 'object' || req.body.emergencyContact === null) {
      throw createError('Emergency contact must be an object', 400);
    }

    const nextEmergencyContact = {
      name: String(req.body.emergencyContact.name || '').trim(),
      phone: String(req.body.emergencyContact.phone || '').trim(),
      relation: String(req.body.emergencyContact.relation || '').trim(),
    };

    if (nextEmergencyContact.phone && !isValidPhone(nextEmergencyContact.phone)) {
      throw createError('Please provide a valid emergency contact phone number', 400);
    }

    user.emergencyContact = nextEmergencyContact;
  }

  if (user.role === 'doctor') {
    if (req.body.specialty !== undefined) {
      const nextSpecialty = String(req.body.specialty || '').trim();

      if (!nextSpecialty) {
        throw createError('specialty is required for doctor accounts', 400);
      }

      user.specialty = nextSpecialty;
    }

    if (req.body.hospitalName !== undefined) {
      user.hospitalName = String(req.body.hospitalName || '').trim();
    }

    if (req.body.consultationFee !== undefined) {
      if (req.body.consultationFee === '' || req.body.consultationFee === null) {
        user.consultationFee = 0;
      } else {
        const nextFee = normalizeNumber(req.body.consultationFee);

        if (nextFee === undefined || nextFee < 0) {
          throw createError('Please provide a valid consultation fee', 400);
        }

        user.consultationFee = nextFee;
      }
    }

    if (req.body.consultationModes !== undefined) {
      user.consultationModes = normalizeConsultationModes(req.body.consultationModes);
    }

    if (req.body.bio !== undefined) {
      user.bio = String(req.body.bio || '').trim();
    }
  }

  await user.save();

  return sendSuccess(res, 'Profile updated successfully', { user });
});

module.exports = {
  login,
  profile,
  updateProfile,
  signup,
};
