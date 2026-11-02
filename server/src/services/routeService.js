const Bin = require('../models/Bin');
const Route = require('../models/Route');
const User = require('../models/User');
const ApiError = require('../utils/apiError');
const env = require('../config/env');
const { optimizeRoute } = require('./routing');

/**
 * Service managing dynamic route generation, nearest-neighbor optimization and dispatch
 */
class RouteService {
  /**
   * Generate an optimized collection route based on critical and smell-reported bins
   * @param {Object} [io]
   */
  static async generateOptimizedRoute(io) {
    const depot = env.depot;

    // 1. Fetch all bins to calculate baseline (visiting all bins)
    const allBins = await Bin.find();
    if (allBins.length === 0) {
      throw ApiError.badRequest('No bins available to route.');
    }

    const baselineResult = optimizeRoute(depot, allBins);
    const baselineDistance = baselineResult.totalDistance;

    // 2. Fetch only critical or smell reported bins
    const targetBins = await Bin.find({
      status: { $in: ['critical', 'smell_reported'] },
    });

    let routeResult;
    if (targetBins.length === 0) {
      routeResult = { sequence: [], totalDistance: 0 };
    } else {
      routeResult = optimizeRoute(depot, targetBins);
    }

    const optimizedDistance = routeResult.totalDistance;

    // Percentage distance saved vs full loop
    const percentSaved = baselineDistance > 0
      ? Math.max(0, Math.round(((baselineDistance - optimizedDistance) / baselineDistance) * 100))
      : 0;

    // 3. Find a staff member to assign this route to
    const staffUser = await User.findOne({ role: 'staff' });
    const assignedStaffId = staffUser ? staffUser.uid : 'uid-staff';

    const binIdsSequence = routeResult.sequence.map((bin) => bin.binId);
    const routeId = `RT-${Date.now()}`;

    // 4. Create new Route document in DB
    const newRoute = await Route.create({
      routeId,
      binSequence: binIdsSequence,
      totalDistance: optimizedDistance,
      baselineDistance,
      status: 'pending',
      assignedStaffId,
    });

    // 5. Broadcast real-time notification
    if (io) {
      io.emit('route_generated', {
        route: newRoute,
        percentSaved,
        assignedStaffId,
        binSequenceDetails: routeResult.sequence,
      });
    }

    return {
      message: 'Optimized route generated successfully',
      routeId,
      binSequence: binIdsSequence,
      totalDistance: optimizedDistance,
      baselineDistance,
      percentSaved,
      assignedStaffId,
      route: newRoute,
    };
  }

  /**
   * Retrieve current route for the active user / staff member
   */
  static async getCurrentRoute(user) {
    const query = user && user.role === 'staff'
      ? { assignedStaffId: user.uid, status: 'pending' }
      : { status: 'pending' };

    let route = await Route.findOne(query).sort({ createdAt: -1 });

    if (!route && user) {
      route = await Route.findOne({ assignedStaffId: user.uid }).sort({ createdAt: -1 });
    }
    if (!route) {
      route = await Route.findOne().sort({ createdAt: -1 });
    }

    if (!route) {
      throw ApiError.notFound('No routes found.');
    }

    // Fetch full bin details for route sequence
    const binDetails = [];
    for (const binId of route.binSequence) {
      const bin = await Bin.findOne({ binId });
      if (bin) {
        binDetails.push(bin);
      }
    }

    return {
      route,
      bins: binDetails,
    };
  }
}

module.exports = RouteService;

