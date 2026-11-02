const LeaderboardService = require('../services/leaderboardService');
const ApiResponse = require('../utils/apiResponse');

/**
 * Controller for Leaderboard endpoints
 */
class LeaderboardController {
  static async getLeaderboard(req, res) {
    const data = await LeaderboardService.getLeaderboard();
    return ApiResponse.send(res, data);
  }
}

module.exports = LeaderboardController;

