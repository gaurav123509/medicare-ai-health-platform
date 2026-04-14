class AppError extends Error {
  constructor(message, statusCode = 500, details = null) {
    super(message);
    this.name = 'AppError';
    this.statusCode = statusCode;
    this.details = details;
  }
}

const sendSuccess = (res, message = 'Request successful', data = {}, statusCode = 200) => {
  return res.status(statusCode).json({
    success: true,
    message,
    data,
  });
};

const sendError = (res, message = 'Something went wrong', statusCode = 500, details = null) => {
  return res.status(statusCode).json({
    success: false,
    message,
    ...(details ? { details } : {}),
  });
};

const createError = (message, statusCode = 400, details = null) => {
  return new AppError(message, statusCode, details);
};

module.exports = {
  AppError,
  sendSuccess,
  sendError,
  createError,
};
