/**
 * Express Async Handler Wrapper
 * Eliminates repetitive try-catch blocks in controller methods.
 * Any rejected promise or thrown error is automatically routed to next(error).
 */

const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

module.exports = asyncHandler;

