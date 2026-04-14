const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { asyncHandler } = require('../middleware/errorHandler');
const { createError, sendSuccess } = require('../utils/response');
const { isStrongPassword, isValidEmail, isValidPhone, requireFields } = require('../utils/validators');

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
  } = req.body;

  if (!isValidEmail(email)) {
    throw createError('Please provide a valid email address', 400);
  }

  if (!isStrongPassword(password)) {
    throw createError('Password must be at least 8 characters and include letters and numbers', 400);
  }

  if (phone && !isValidPhone(phone)) {
    throw createError('Please provide a valid phone number', 400);
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

module.exports = {
  login,
  profile,
  signup,
};
