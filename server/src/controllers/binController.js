const BinService = require('../services/binService');
const ApiResponse = require('../utils/apiResponse');

/**
 * Controller for Bin endpoints
 */
class BinController {
  static async getAllBins(req, res) {
    const bins = await BinService.getAllBins();
    return ApiResponse.send(res, bins);
  }

  static async getBinById(req, res) {
    const bin = await BinService.getBinById(req.params.binId);
    return ApiResponse.send(res, bin);
  }

  static async collectBin(req, res) {
    const io = req.app.get('io');
    const result = await BinService.collectBin(req.params.binId, req.user, io);
    return ApiResponse.send(res, result);
  }
}

module.exports = BinController;

