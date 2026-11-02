const express = require('express');
const router = express.Router();
const UserController = require('../controllers/userController');
const { protect } = require('../middleware/authMiddleware');
const asyncHandler = require('../middleware/asyncHandler');

// GET /api/users/me - get current user profile + points
router.get('/me', protect, asyncHandler(UserController.getMe));

// POST /api/users/login - Local login for users and sample accounts
router.post('/login', asyncHandler(UserController.login));

// POST /api/users/signup - Citizen self-registration only
router.post('/signup', asyncHandler(UserController.signup));

module.exports = router;
