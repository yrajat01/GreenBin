import apiClient from './apiClient';

/**
 * Service for Citizen Leaderboard & Gamification Ranking
 */
export const leaderboardService = {
  getRankings: () => apiClient.get('/api/leaderboard'),
};

export default leaderboardService;

