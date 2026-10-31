const jwt = require('jsonwebtoken');
const User = require('../../models/User');
const ApiResponse = require('../utils/apiResponse');

/**
 * Protect routes - Verifies JWT and attaches authenticated user to req.user
 * Never trusts role or user IDs supplied by frontend
 */
const protect = async (req, res, next) => {
  let token = null;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return ApiResponse.unauthorized(res, 'Access denied. Authentication token missing.');
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'sunpower_super_secret_jwt_key_2026');
    const user = await User.findById(decoded.id).select('-password');

    if (!user) {
      return ApiResponse.unauthorized(res, 'Invalid token: User no longer exists.');
    }

    if (user.isActive === false) {
      return ApiResponse.forbidden(res, 'Account deactivated. Please contact administrator.');
    }

    req.user = user;
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return ApiResponse.unauthorized(res, 'Authentication token has expired. Please log in again.');
    }
    return ApiResponse.unauthorized(res, 'Authentication failed. Invalid token.');
  }
};

module.exports = { protect };
