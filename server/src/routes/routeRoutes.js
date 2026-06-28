const express = require('express');
const router = express.Router();
const Bin = require('../models/Bin');
const Route = require('../models/Route');
const User = require('../models/User');
const { protect, requireRole } = require('../middleware/authMiddleware');
const { optimizeRoute } = require('../services/routing');

// GET /api/route/generate - generate optimized route (admin only)
router.get('/generate', protect, requireRole('admin'), async (req, res) => {
  try {
    const depot = {
      lat: parseFloat(process.env.DEPOT_LAT) || 26.8467,
      lng: parseFloat(process.env.DEPOT_LNG) || 80.9462
    };
    
    // 1. Fetch all bins to calculate baseline (visiting all bins)
    const allBins = await Bin.find();
    if (allBins.length === 0) {
      return res.status(400).json({ message: 'No bins available to route.' });
    }
    
    const baselineResult = optimizeRoute(depot, allBins);
    const baselineDistance = baselineResult.totalDistance;
    
    // 2. Fetch only critical or smell reported bins
    const targetBins = await Bin.find({
      status: { $in: ['critical', 'smell_reported'] }
    });
    
    // If no critical bins, route is just depot (empty)
    let routeResult;
    if (targetBins.length === 0) {
      routeResult = { sequence: [], totalDistance: 0 };
    } else {
      routeResult = optimizeRoute(depot, targetBins);
    }
    
    const optimizedDistance = routeResult.totalDistance;
    
    // Calculate percentage saved
    const percentSaved = baselineDistance > 0 
      ? Math.max(0, Math.round(((baselineDistance - optimizedDistance) / baselineDistance) * 100))
      : 0;
      
    // 3. Find a staff member to assign this route to
    let staffUser = await User.findOne({ role: 'staff' });
    const assignedStaffId = staffUser ? staffUser.uid : 'uid-staff';
    
    const binIdsSequence = routeResult.sequence.map(bin => bin.binId);
    const routeId = `RT-${Date.now()}`;
    
    // 4. Create new Route document in DB
    const newRoute = await Route.create({
      routeId,
      binSequence: binIdsSequence,
      totalDistance: optimizedDistance,
      baselineDistance: baselineDistance,
      status: 'pending',
      assignedStaffId
    });
    
    // 5. Emit real-time notification
    const io = req.app.get('io');
    if (io) {
      io.emit('route_generated', {
        route: newRoute,
        percentSaved,
        assignedStaffId,
        binSequenceDetails: routeResult.sequence // Send full details for drawing path
      });
    }
    
    res.json({
      message: 'Optimized route generated successfully',
      routeId,
      binSequence: binIdsSequence,
      totalDistance: optimizedDistance,
      baselineDistance,
      percentSaved,
      assignedStaffId
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// GET /api/route/current - get current route for staff
router.get('/current', protect, async (req, res) => {
  try {
    // Find the latest pending route assigned to the logged-in staff member
    // If no staff user is logged in, or citizen/admin is looking, fetch the latest pending route
    const query = req.user.role === 'staff' 
      ? { assignedStaffId: req.user.uid, status: 'pending' }
      : { status: 'pending' };
      
    let route = await Route.findOne(query).sort({ createdAt: -1 });
    
    // Fallback: get the absolute latest route regardless of status
    if (!route) {
      route = await Route.findOne({ assignedStaffId: req.user.uid }).sort({ createdAt: -1 });
    }
    if (!route) {
      route = await Route.findOne().sort({ createdAt: -1 });
    }
    
    if (!route) {
      return res.status(404).json({ message: 'No routes found.' });
    }
    
    // Fetch full bin details for the route sequence
    const binDetails = [];
    for (const binId of route.binSequence) {
      const bin = await Bin.findOne({ binId });
      if (bin) {
        binDetails.push(bin);
      }
    }
    
    res.json({
      route,
      bins: binDetails
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
