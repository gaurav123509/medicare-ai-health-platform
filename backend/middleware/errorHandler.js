const mongoose = require('mongoose');
const { sendError } = require('../utils/response');

const asyncHandler = (handler) => {
  return (req, res, next) => {
    Promise.resolve(handler(req, res, next)).catch(next);
  };
};

const notFoundHandler = (req, res) => {
  return sendError(res, `Route not found: ${req.method} ${req.originalUrl}`, 404);
};

const errorHandler = (error, req, res, next) => {
  let statusCode = error.statusCode || 500;
  let message = error.message || 'Internal server error';
  let details = error.details || null;

  if (error.name === 'ValidationError') {
    statusCode = 400;
    message = 'Validation failed';
    details = Object.values(error.errors).map((entry) => entry.message);
  }

  if (error.code === 11000) {
    statusCode = 409;
    const duplicateField = Object.keys(error.keyValue || {})[0] || 'field';
    message = `${duplicateField} already exists`;
  }

  if (error.name === 'CastError') {
    statusCode = 400;
    message = `Invalid ${error.path}`;
  }

  if (error.name === 'JsonWebTokenError') {
    statusCode = 401;
    message = 'Invalid authentication token';
  }

  if (error.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Authentication token has expired';
  }

  if (error.name === 'MulterError') {
    statusCode = 400;
    message = error.message;
  }

  if (
    error instanceof mongoose.Error
    && typeof error.message === 'string'
    && (
      error.message.includes('buffering timed out')
      || error.message.includes('initial connection is complete')
      || error.message.includes('bufferCommands')
    )
  ) {
    statusCode = 503;
    message = 'Database is not connected. Configure a valid MongoDB Atlas URI to use this endpoint.';
  }

  if (res.headersSent) {
    return next(error);
  }

  return sendError(
    res,
    message,
    statusCode,
    process.env.NODE_ENV === 'development'
      ? details || error.stack
      : details,
  );
};

module.exports = {
  asyncHandler,
  errorHandler,
  notFoundHandler,
};
