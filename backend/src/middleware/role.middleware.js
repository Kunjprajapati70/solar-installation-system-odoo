const ApiResponse = require('../utils/apiResponse');

/**
 * Authorize specified roles
 * Usage: authorize('admin', 'sales')
 */
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return ApiResponse.unauthorized(res, 'Authentication required.');
    }

    if (!roles.includes(req.user.role)) {
      return ApiResponse.forbidden(
        res,
        `Access denied. Required role: [${roles.join(', ')}]. Your role: [${req.user.role}]`
      );
    }

    next();
  };
};

module.exports = { authorize };
