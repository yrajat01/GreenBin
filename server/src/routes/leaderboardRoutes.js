const express = require('express');
const router = express.Router();
const User = require('../models/User');

// GET /api/leaderboard - top citizens by zone + global
router.get('/', async (req, res) => {
  try {
    // Global ranking
    const globalTop = await User.find({ role: 'citizen' })
      .sort({ points: -1 })
      .limit(10)
      .select('name points zone badgesEarned reportCount');
      
    // Zone rankings
    const zones = ['Zone-A', 'Zone-B', 'Zone-C'];
    const zoneTop = {};
    
    for (const zone of zones) {
      zoneTop[zone] = await User.find({ role: 'citizen', zone })
        .sort({ points: -1 })
        .limit(5)
        .select('name points badgesEarned reportCount');
    }
    
    res.json({
      global: globalTop,
      zones: zoneTop
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
