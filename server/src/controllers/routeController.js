const RouteService = require('../services/routeService');
const ApiResponse = require('../utils/apiResponse');

/**
 * Controller for Route endpoints
 */
class RouteController {
  static async generateRoute(req, res) {
    const io = req.app.get('io');
    const result = await RouteService.generateOptimizedRoute(io);
    return ApiResponse.send(res, result);
  }

  static async getCurrentRoute(req, res) {
    const result = await RouteService.getCurrentRoute(req.user);
    return ApiResponse.send(res, result);
  }
}

module.exports = RouteController;

