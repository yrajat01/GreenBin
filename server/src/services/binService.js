const Bin = require('../models/Bin');
const Collection = require('../models/Collection');
const Report = require('../models/Report');
const ApiError = require('../utils/apiError');

/**
 * Service handling Smart Bin queries and operations
 */
class BinService {
  /**
   * Retrieve all bins in the system
   * @returns {Promise<Array>}
   */
  static async getAllBins() {
    return Bin.find().sort({ binId: 1 });
  }

  /**
   * Retrieve single bin by ID
   * @param {string} binId
   * @returns {Promise<Object>}
   */
  static async getBinById(binId) {
    const bin = await Bin.findOne({ binId });
    if (!bin) {
      throw ApiError.notFound(`Bin ${binId} not found`);
    }
    return bin;
  }

  /**
   * Collect a bin and reset its capacity to normal
   * @param {string} binId
   * @param {Object} user - Logged in staff/admin user
   * @param {Object} [io] - Socket.io instance
   */
  static async collectBin(binId, user, io) {
    const bin = await Bin.findOne({ binId });
    if (!bin) {
      throw ApiError.notFound(`Bin ${binId} not found`);
    }

    const previousFill = bin.fillLevel;

    // Reset bin fill level and status
    bin.fillLevel = 5;
    bin.status = 'normal';
    bin.lastCollected = new Date();
    await bin.save();

    // Log collection record
    await Collection.create({
      binId: bin.binId,
      staffId: user.uid,
      collectedAt: new Date(),
      fillLevelAtCollection: previousFill,
    });

    // Resolve any pending reports for this bin
    await Report.updateMany(
      { binId: bin.binId, status: 'pending' },
      { $set: { status: 'resolved', resolvedAt: new Date(), notes: `Collected by staff ${user.name || user.email}` } }
    );

    // Broadcast live telemetry update
    if (io) {
      io.emit('bin_update', bin);
      io.emit('bin_collected', { binId: bin.binId, staffName: user.name || user.email });
    }

    return {
      message: 'Bin successfully collected',
      bin,
    };
  }
}

module.exports = BinService;

