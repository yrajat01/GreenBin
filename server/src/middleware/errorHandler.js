/**
 * Centralized Express Error Handling Middleware
 */

const ApiError = require('../utils/apiError');
const logger = require('../utils/logger');

const errorHandler = (err, req, res, next) => {
  let statusCode = err.statusCode || 500;
  let message = err.message || 'Internal Server Error';
  let details = err.details || null;

  // Handle Mongoose Validation Errors
  if (err.name === 'ValidationError') {
    statusCode = 400;
    message = Object.values(err.errors)
      .map((val) => val.message)
      .join(', ');
  }

  // Handle Mongoose CastError (e.g. invalid ObjectId)
  if (err.name === 'CastError') {
    statusCode = 400;
    message = `Invalid value for parameter '${err.path}'`;
  }

  // Handle Duplicate Key Error (E11000)
  if (err.code === 11000) {
    statusCode = 409;
    const field = Object.keys(err.keyValue || {})[0] || 'field';
    message = `Duplicate value for field '${field}'. It must be unique.`;
  }

  // Log non-operational (server/crash) errors
  if (statusCode >= 500) {
    logger.error(`[Unhandled Server Error] ${req.method} ${req.originalUrl}: ${err.message}`, err.stack);
  } else {
    logger.warn(`[Client Error ${statusCode}] ${req.method} ${req.originalUrl}: ${message}`);
  }

  const responsePayload = {
    message,
    ...(details ? { details } : {}),
    ...(process.env.NODE_ENV !== 'production' && statusCode >= 500 ? { stack: err.stack } : {})
  };

  return res.status(statusCode).json(responsePayload);
};

module.exports = errorHandler;

