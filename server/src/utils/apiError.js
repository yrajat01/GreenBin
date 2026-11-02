/**
 * Standard Operational API Error Class
 * Extends Error to carry HTTP status code and operational indicators.
 */

class ApiError extends Error {
  /**
   * @param {number} statusCode - HTTP status code
   * @param {string} message - Error description
   * @param {Array|Object} [details] - Optional validation or error details
   */
  constructor(statusCode, message, details = null) {
    super(message);
    this.name = this.constructor.name;
    this.statusCode = statusCode;
    this.isOperational = true;
    this.details = details;
    Error.captureStackTrace(this, this.constructor);
  }

  static badRequest(message = 'Bad Request', details = null) {
    return new ApiError(400, message, details);
  }

  static unauthorized(message = 'Unauthorized', details = null) {
    return new ApiError(401, message, details);
  }

  static forbidden(message = 'Forbidden', details = null) {
    return new ApiError(403, message, details);
  }

  static notFound(message = 'Resource not found', details = null) {
    return new ApiError(404, message, details);
  }

  static conflict(message = 'Conflict with existing resource', details = null) {
    return new ApiError(409, message, details);
  }

  static tooManyRequests(message = 'Too many requests, please try again later', details = null) {
    return new ApiError(429, message, details);
  }

  static internal(message = 'Internal server error', details = null) {
    const error = new ApiError(500, message, details);
    error.isOperational = false;
    return error;
  }
}

module.exports = ApiError;

