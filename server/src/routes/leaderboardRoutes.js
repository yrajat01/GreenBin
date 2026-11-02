const express = require('express');
const router = express.Router();
const LeaderboardController = require('../controllers/leaderboardController');
const asyncHandler = require('../middleware/asyncHandler');

// GET /api/leaderboard - top citizens by zone + global
router.get('/', asyncHandler(LeaderboardController.getLeaderboard));

module.exports = router;
