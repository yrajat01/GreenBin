/**
 * Standardized API Response Helper
 */

class ApiResponse {
  /**
   * Send JSON response preserving payload structure for client compatibility
   * @param {import('express').Response} res
   * @param {any} data
   * @param {number} [statusCode=200]
   */
  static send(res, data, statusCode = 200) {
    return res.status(statusCode).json(data);
  }

  static success(res, payload = {}, statusCode = 200) {
    return res.status(statusCode).json(payload);
  }

  static created(res, payload = {}) {
    return res.status(201).json(payload);
  }
}

module.exports = ApiResponse;

