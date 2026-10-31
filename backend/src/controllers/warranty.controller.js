/**
 * Automatic Warranty Management Controller
 */

const Warranty = require('../../models/Warranty');
const WarrantyService = require('../services/warranty.service');
const ApiResponse = require('../utils/apiResponse');

class WarrantyController {
  /**
   * GET /api/warranty (and /api/warranties)
   */
  static async listWarranties(req, res, next) {
    try {
      const { search, category, status, page = 1, limit = 50 } = req.query;
      const query = {};

      if (category) query.category = category;
      if (status) query.status = status;
      if (search) {
        query.$or = [
          { certificateNumber: { $regex: search, $options: 'i' } },
          { serialNumber: { $regex: search, $options: 'i' } },
          { brand: { $regex: search, $options: 'i' } }
        ];
      }

      const skip = (Number(page) - 1) * Number(limit);
      const [items, total] = await Promise.all([
        Warranty.find(query)
          .populate('customer', 'name email phone')
          .populate('equipment')
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(Number(limit)),
        Warranty.countDocuments(query)
      ]);

      return ApiResponse.success(res, items, 'Warranties retrieved', 200, {
        total,
        page: Number(page),
        limit: Number(limit),
        pages: Math.ceil(total / Number(limit))
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/warranty/serial/:serialNumber
   */
  static async getBySerial(req, res, next) {
    try {
      const result = await WarrantyService.checkEligibility(req.params.serialNumber);
      if (!result.warranty) {
        return ApiResponse.notFound(res, result.message);
      }
      const responseData = {
        ...result,
        serialNumber: result.warranty?.serialNumber || req.params.serialNumber,
        status: result.status,
        warranty: result.warranty
      };
      return ApiResponse.success(res, responseData, result.message);
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/warranty/summary
   */
  static async getSummary(req, res, next) {
    try {
      const summary = await WarrantyService.getWarrantySummary();
      return ApiResponse.success(res, summary, 'Warranty summary retrieved');
    } catch (err) {
      next(err);
    }
  }

  /**
   * POST /api/warranty/check-eligibility
   */
  static async checkEligibility(req, res, next) {
    try {
      const { serialNumber } = req.body;
      if (!serialNumber) {
        return ApiResponse.badRequest(res, 'Serial number is required to check warranty eligibility.');
      }

      const result = await WarrantyService.checkEligibility(serialNumber);
      return ApiResponse.success(res, result, result.message);
    } catch (err) {
      next(err);
    }
  }
}

module.exports = WarrantyController;
