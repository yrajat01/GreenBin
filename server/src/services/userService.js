const User = require('../models/User');
const ApiError = require('../utils/apiError');

/**
 * Service managing user authentication, registration, and profile querying
 */
class UserService {
  /**
   * Authenticate user credentials
   * Maintains anti-enumeration security by returning generic 401 on mismatch
   */
  static async login({ email, password, role }) {
    if (!email || !password) {
      throw ApiError.badRequest('Email and password are required');
    }

    const query = { email: email.toLowerCase().trim() };
    if (role) {
      query.role = role;
    }

    const user = await User.findOne(query);

    // Generic error to prevent account or role enumeration
    if (!user || user.password !== password) {
      throw ApiError.unauthorized('Invalid email or password');
    }

    const token = `local-${user.uid}`;

    return {
      message: 'Login successful',
      token,
      user,
    };
  }

  /**
   * Register a new citizen account
   * Staff and Admin registration through API is strictly forbidden
   */
  static async signupCitizen({ name, email, password, role, zone }) {
    if (!name || !email || !password) {
      throw ApiError.badRequest('Name, email, and password are required');
    }

    // Role protection
    if (role && role !== 'citizen') {
      throw ApiError.forbidden(
        'Self-registration is restricted to Citizens only. Staff and Administrator accounts must be created directly in the database.'
      );
    }

    const normalizedEmail = email.toLowerCase().trim();
    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      throw ApiError.badRequest('Email is already registered');
    }

    const uid = `uid-user-${Date.now()}`;
    const newUser = await User.create({
      uid,
      name,
      email: normalizedEmail,
      password,
      role: 'citizen',
      zone: zone || 'Zone-A',
      points: 0,
      badgesEarned: [],
      reportCount: 0,
    });

    const token = `local-${uid}`;

    return {
      message: 'Citizen account registered successfully',
      token,
      user: newUser,
    };
  }

  /**
   * Retrieve profile of the currently authenticated user
   */
  static async getCurrentProfile(user) {
    if (!user) {
      throw ApiError.unauthorized('Not authenticated');
    }
    return user;
  }
}

module.exports = UserService;

