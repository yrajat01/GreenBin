const User = require('../models/User');
const { ZONES } = require('../constants/roles');

/**
 * Service providing citizen ranking and leaderboard aggregation
 */
class LeaderboardService {
  /**
   * Fetch global top 10 and per-zone top 5 citizen rankings
   */
  static async getLeaderboard() {
    // Global ranking
    const globalTop = await User.find({ role: 'citizen' })
      .sort({ points: -1 })
      .limit(10)
      .select('uid name points zone badgesEarned reportCount');

    // Zone rankings
    const zoneTop = {};
    for (const zone of ZONES) {
      zoneTop[zone] = await User.find({ role: 'citizen', zone })
        .sort({ points: -1 })
        .limit(5)
        .select('uid name points zone badgesEarned reportCount');
    }

    return {
      global: globalTop,
      zones: zoneTop,
    };
  }
}

module.exports = LeaderboardService;

