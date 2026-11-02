const express = require('express');
const router = express.Router();
const RouteController = require('../controllers/routeController');
const { protect, requireRole } = require('../middleware/authMiddleware');
const asyncHandler = require('../middleware/asyncHandler');
const { ROLES } = require('../constants/roles');

// GET /api/route/generate - generate optimized route (admin only)
router.get(
  '/generate',
  protect,
  requireRole(ROLES.ADMIN),
  asyncHandler(RouteController.generateRoute)
);

// GET /api/route/current - get current route for staff or overall
router.get('/current', protect, asyncHandler(RouteController.getCurrentRoute));

module.exports = router;
