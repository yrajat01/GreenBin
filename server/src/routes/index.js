const express = require('express');
const router = express.Router();

const binRoutes = require('./binRoutes');
const reportRoutes = require('./reportRoutes');
const routeRoutes = require('./routeRoutes');
const leaderboardRoutes = require('./leaderboardRoutes');
const userRoutes = require('./userRoutes');

// Mount domain routes
router.use('/bins', binRoutes);
router.use('/reports', reportRoutes);
router.use('/route', routeRoutes);
router.use('/leaderboard', leaderboardRoutes);
router.use('/users', userRoutes);

// Root API information
router.get('/', (req, res) => {
  res.json({
    name: 'GreenBin Smart Waste System API',
    status: 'Running',
    version: '1.0.0',
    simulations: 'Enabled',
    endpoints: {
      health: '/api/health',
      bins: '/api/bins',
      reports: '/api/reports',
      route: '/api/route',
      leaderboard: '/api/leaderboard',
      users: '/api/users',
    },
  });
});

module.exports = router;

