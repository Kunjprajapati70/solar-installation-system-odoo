const ApiResponse = require('../utils/apiResponse');
const { hasPermission } = require('../config/permissions');

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

/**
 * Authorize by centralized permission key
 * Usage: requirePermission('finance.read')
 */
const requirePermission = (permission) => {
  return (req, res, next) => {
    if (!req.user) {
      return ApiResponse.unauthorized(res, 'Authentication required.');
    }
    if (!hasPermission(req.user.role, permission)) {
      return ApiResponse.forbidden(res, `Access denied. Missing permission: ${permission}.`);
    }
    next();
  };
};

module.exports = { authorize, requirePermission };
