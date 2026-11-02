const express = require('express');
const router = express.Router();
const BinController = require('../controllers/binController');
const { protect, requireRole } = require('../middleware/authMiddleware');
const asyncHandler = require('../middleware/asyncHandler');
const { ROLES } = require('../constants/roles');

// GET /api/bins - all bins with current status
router.get('/', asyncHandler(BinController.getAllBins));

// GET /api/bins/:binId - single bin details
router.get('/:binId', asyncHandler(BinController.getBinById));

// PATCH /api/bins/:binId/collect - mark as collected (staff and admin only)
router.patch(
  '/:binId/collect',
  protect,
  requireRole(ROLES.STAFF, ROLES.ADMIN),
  asyncHandler(BinController.collectBin)
);

module.exports = router;
