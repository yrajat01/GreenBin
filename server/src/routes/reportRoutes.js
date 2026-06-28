const express = require('express');
const router = express.Router();
const Report = require('../models/Report');
const Bin = require('../models/Bin');
const User = require('../models/User');
const { protect, requireRole } = require('../middleware/authMiddleware');

// POST /api/reports - submit citizen report (citizen and admin)
router.post('/', protect, requireRole('citizen', 'admin'), async (req, res) => {
  const { binId, issueType, photoUrl, description } = req.body;
  
  if (!binId || !issueType) {
    return res.status(400).json({ message: 'Bin ID and Issue Type are required.' });
  }
  
  try {
    // 1. Validate bin exists
    const bin = await Bin.findOne({ binId });
    if (!bin) {
      return res.status(404).json({ message: `Bin code ${binId} does not exist.` });
    }
    
    // 2. Rate limit check: Max 5 reports/hour/user
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const hourlyReportCount = await Report.countDocuments({
      userId: req.user.uid,
      createdAt: { $gte: oneHourAgo }
    });
    
    if (hourlyReportCount >= 5) {
      return res.status(429).json({ message: 'Rate limit exceeded. Maximum 5 reports per hour.' });
    }
    
    // 3. Create report document
    const reportId = `TK-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`;
    const newReport = await Report.create({
      reportId,
      binId,
      userId: req.user.uid,
      issueType,
      photoUrl: photoUrl || '',
      description: description || '',
      status: 'pending'
    });
    
    // 4. Update Bin status to smell_reported
    bin.status = 'smell_reported';
    bin.lastReported = new Date();
    await bin.save();
    
    // 5. Award 10 points to citizen's account + badge updates
    const user = await User.findOne({ uid: req.user.uid });
    if (user) {
      user.points += 10;
      user.reportCount += 1;
      
      // Badge rewards check
      if (user.reportCount === 1 && !user.badgesEarned.includes('First Report')) {
        user.badgesEarned.push('First Report');
      }
      if (user.reportCount === 5 && !user.badgesEarned.includes('Eco Regular')) {
        user.badgesEarned.push('Eco Regular');
      }
      if (user.reportCount === 10 && !user.badgesEarned.includes('Eco Champion')) {
        user.badgesEarned.push('Eco Champion');
      }
      
      await user.save();
    }
    
    // 6. Push to real-time maps immediately
    const io = req.app.get('io');
    if (io) {
      io.emit('bin_update', bin);
      io.emit('new_report', {
        report: newReport,
        userName: user ? user.name : 'Citizen'
      });
      io.emit('user_update', { uid: req.user.uid, points: user ? user.points : 0 });
    }
    
    res.status(201).json({
      message: 'Report submitted successfully!',
      report: newReport,
      pointsEarned: 10,
      badges: user ? user.badgesEarned : []
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// GET /api/reports/my - get current user's reports (citizen and admin)
router.get('/my', protect, async (req, res) => {
  try {
    const reports = await Report.find({ userId: req.user.uid }).sort({ createdAt: -1 });
    res.json(reports);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// GET /api/reports - all reports (admin only)
router.get('/', protect, requireRole('admin'), async (req, res) => {
  try {
    const reports = await Report.find().sort({ createdAt: -1 });
    res.json(reports);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// PATCH /api/reports/:id - update report status/resolution (admin only)
router.patch('/:id', protect, requireRole('admin'), async (req, res) => {
  const { status, notes } = req.body;
  try {
    const report = await Report.findOne({ reportId: req.params.id });
    if (!report) {
      return res.status(404).json({ message: 'Report not found' });
    }
    
    if (status) report.status = status;
    if (notes) report.notes = notes;
    if (status === 'resolved') {
      report.resolvedAt = new Date();
    }
    
    await report.save();
    
    // If resolved, see if we should reset the bin status if no other pending reports exist
    const pendingCount = await Report.countDocuments({ binId: report.binId, status: 'pending' });
    if (pendingCount === 0) {
      const bin = await Bin.findOne({ binId: report.binId });
      if (bin && bin.status === 'smell_reported') {
        bin.status = 'normal';
        await bin.save();
        
        const io = req.app.get('io');
        if (io) {
          io.emit('bin_update', bin);
        }
      }
    }
    
    res.json({ message: 'Report updated successfully', report });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
