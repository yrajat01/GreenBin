const express = require('express');
const router = express.Router();
const Bin = require('../models/Bin');
const Collection = require('../models/Collection');
const Report = require('../models/Report');
const { protect, requireRole } = require('../middleware/authMiddleware');

// GET /api/bins - all bins with current status
router.get('/', async (req, res) => {
  try {
    const bins = await Bin.find();
    res.json(bins);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// GET /api/bins/:binId - single bin details
router.get('/:binId', async (req, res) => {
  try {
    const bin = await Bin.findOne({ binId: req.params.binId });
    if (!bin) {
      return res.status(404).json({ message: 'Bin not found' });
    }
    res.json(bin);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// PATCH /api/bins/:binId/collect - mark as collected (staff and admin only)
router.patch('/:binId/collect', protect, requireRole('staff', 'admin'), async (req, res) => {
  try {
    const bin = await Bin.findOne({ binId: req.params.binId });
    if (!bin) {
      return res.status(404).json({ message: 'Bin not found' });
    }
    
    const previousFill = bin.fillLevel;
    
    // Reset bin values
    bin.fillLevel = 5;
    bin.status = 'normal';
    bin.lastCollected = new Date();
    await bin.save();
    
    // Log collection event
    await Collection.create({
      binId: bin.binId,
      staffId: req.user.uid,
      collectedAt: new Date(),
      fillLevelAtCollection: previousFill
    });
    
    // Resolve any pending reports for this bin
    await Report.updateMany(
      { binId: bin.binId, status: 'pending' },
      { $set: { status: 'resolved', resolvedAt: new Date(), notes: `Collected by staff ${req.user.name}` } }
    );
    
    // Emit updates to clients in real-time
    const io = req.app.get('io');
    if (io) {
      io.emit('bin_update', bin);
      io.emit('bin_collected', { binId: bin.binId, staffName: req.user.name });
    }
    
    res.json({ message: 'Bin successfully collected', bin });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
