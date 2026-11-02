const UserService = require('../services/userService');
const ApiResponse = require('../utils/apiResponse');

/**
 * Controller for User and Authentication endpoints
 */
class UserController {
  static async getMe(req, res) {
    const user = await UserService.getCurrentProfile(req.user);
    return ApiResponse.send(res, user);
  }

  static async login(req, res) {
    const { email, password, role } = req.body;
    const result = await UserService.login({ email, password, role });
    return ApiResponse.send(res, result);
  }

  static async signup(req, res) {
    const { name, email, password, role, zone } = req.body;
    const result = await UserService.signupCitizen({ name, email, password, role, zone });
    return ApiResponse.created(res, result);
  }
}

module.exports = UserController;

