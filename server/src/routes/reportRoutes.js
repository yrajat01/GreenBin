const express = require('express');
const router = express.Router();
const ReportController = require('../controllers/reportController');
const { protect, requireRole } = require('../middleware/authMiddleware');
const asyncHandler = require('../middleware/asyncHandler');
const { ROLES } = require('../constants/roles');

// POST /api/reports - submit citizen report (citizen and admin)
router.post(
  '/',
  protect,
  requireRole(ROLES.CITIZEN, ROLES.ADMIN),
  asyncHandler(ReportController.submitReport)
);

// GET /api/reports/my - get current user's reports (citizen and admin)
router.get('/my', protect, asyncHandler(ReportController.getMyReports));

// GET /api/reports - all reports (admin only)
router.get('/', protect, requireRole(ROLES.ADMIN), asyncHandler(ReportController.getAllReports));

// PATCH /api/reports/:id - update report status/resolution (admin only)
router.patch(
  '/:id',
  protect,
  requireRole(ROLES.ADMIN),
  asyncHandler(ReportController.updateReport)
);

module.exports = router;
