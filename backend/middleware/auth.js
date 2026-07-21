const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { asyncHandler } = require('./errorHandler');
const { createError } = require('../utils/response');

const protect = asyncHandler(async (req, res, next) => {
  const authorization = req.headers.authorization || '';

  if (!authorization.startsWith('Bearer ')) {
    throw createError('Authorization token is required', 401);
  }

  if (!process.env.JWT_SECRET) {
    throw createError('JWT secret is not configured on the server', 500);
  }

  const token = authorization.split(' ')[1];
  const decoded = jwt.verify(token, process.env.JWT_SECRET);

  if (!decoded?.userId) {
    throw createError('Invalid authentication token payload', 401);
  }

  const user = await User.findById(decoded.userId).select('-password');

  if (!user) {
    throw createError('User not found', 401);
  }

  req.user = user;
  return next();
});

module.exports = protect;
