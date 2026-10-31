/**
 * Standardized API Response Helpers
 */

class ApiResponse {
  static success(res, data = null, message = 'Success', statusCode = 200, meta = null) {
    const payload = {
      success: true,
      message,
      data
    };
    if (meta) {
      payload.meta = meta;
      payload.pagination = {
        totalItems: meta.total !== undefined ? meta.total : (meta.totalItems || 0),
        totalPages: meta.pages !== undefined ? meta.pages : (meta.totalPages || 0),
        currentPage: meta.page !== undefined ? meta.page : (meta.currentPage || 1),
        limit: meta.limit || 50,
        total: meta.total !== undefined ? meta.total : (meta.totalItems || 0),
        pages: meta.pages !== undefined ? meta.pages : (meta.totalPages || 0),
        page: meta.page !== undefined ? meta.page : (meta.currentPage || 1)
      };
    }
    return res.status(statusCode).json(payload);
  }

  static created(res, data = null, message = 'Resource created successfully') {
    return ApiResponse.success(res, data, message, 201);
  }

  static error(res, message = 'An error occurred', statusCode = 500, errors = null) {
    const payload = {
      success: false,
      message
    };
    if (errors) payload.errors = errors;
    return res.status(statusCode).json(payload);
  }

  static badRequest(res, message = 'Bad request', errors = null) {
    return ApiResponse.error(res, message, 400, errors);
  }

  static unauthorized(res, message = 'Unauthorized access') {
    return ApiResponse.error(res, message, 401);
  }

  static forbidden(res, message = 'Access forbidden: Insufficient permissions') {
    return ApiResponse.error(res, message, 403);
  }

  static notFound(res, message = 'Resource not found') {
    return ApiResponse.error(res, message, 404);
  }
}

module.exports = ApiResponse;
