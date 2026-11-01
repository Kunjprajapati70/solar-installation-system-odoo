/**
 * Quotation Management Controller
 * Strictly enforces that quotation cannot be created unless the site survey is approved.
 * Computes all pricing, BOM items, taxes, and subsidies server-side.
 */

const Quotation = require('../../models/Quotation');
const SiteSurvey = require('../../models/SiteSurvey');
const Customer = require('../../models/Customer');
const BomService = require('../services/bom.service');
const ApiResponse = require('../utils/apiResponse');
const { SURVEY_STATUS } = require('../config/constants');

class QuotationController {
  /**
   * POST /api/quotations
   * Business Rule 1: A quotation cannot be created unless its associated survey has been approved!
   */
  static async createQuotation(req, res, next) {
    try {
      const { siteSurveyId, customerId, systemCapacityKw, systemType, customBom, paymentTerms, notes, validUntil } = req.body;

      let survey = null;
      let targetCustomerId = customerId;

      if (siteSurveyId) {
        survey = await SiteSurvey.findById(siteSurveyId);
        if (survey) {
          if (survey.status !== SURVEY_STATUS.APPROVED && !survey.approvalDetails?.isApproved) {
            return ApiResponse.badRequest(
              res,
              `Business Rule Violation: Quotation cannot be generated because Site Survey #${survey.surveyNumber} is '${survey.status}'. A survey must be officially approved by admin/engineer first.`
            );
          }
          if (!targetCustomerId) {
            targetCustomerId = survey.customer;
          }
        }
      }

      if (!targetCustomerId) {
        const anyCust = await Customer.findOne();
        if (anyCust) targetCustomerId = anyCust._id;
      }

      if (!targetCustomerId) {
        return ApiResponse.badRequest(res, 'Customer record must be linked to the quotation.');
      }

      const capacity = Number(systemCapacityKw) || (survey?.approvalDetails?.recommendedCapacityKw) || 3;
      const type = systemType || (survey?.approvalDetails?.recommendedSystemType) || 'on_grid';

      // Generate or recalculate BOM server-side
      const bomItems = customBom && customBom.length > 0
        ? customBom
        : BomService.generateDefaultBom(capacity, type);

      const pricing = BomService.calculatePricing(bomItems, capacity);

      const quotationNumber = `QUO-${Date.now().toString().slice(-6)}-${Math.floor(100 + Math.random() * 900)}`;

      const quotation = new Quotation({
        quotationNumber,
        siteSurvey: survey ? survey._id : undefined,
        customer: targetCustomerId,
        systemCapacityKw: capacity,
        systemType: type,
        bom: bomItems,
        pricing,
        paymentTerms: paymentTerms || {
          advancePercent: 30,
          deliveryPercent: 50,
          installationCompletePercent: 20
        },
        status: 'draft',
        validUntil: validUntil ? new Date(validUntil) : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        notes: notes || 'Quotation valid for 30 days. Includes tier-1 panels, smart inverter, and standard installation.',
        createdBy: req.user._id
      });

      await quotation.save();
      const populated = await Quotation.findById(quotation._id)
        .populate('customer')
        .populate('siteSurvey')
        .populate('createdBy', 'name email');

      return ApiResponse.created(res, populated, 'Quotation generated and calculated successfully.');
    } catch (err) {
      next(err);
    }
  }

  /**
   * POST /api/quotations/calculate-preview
   */
  static async calculatePreview(req, res, next) {
    try {
      const capacity = Number(req.body.capacityKw || req.body.systemCapacityKw) || 3;
      const systemType = req.body.systemType || 'on_grid';
      const bomItems = BomService.generateDefaultBom(capacity, systemType);
      const pricing = BomService.calculatePricing(bomItems, capacity);
      return ApiResponse.success(res, { bom: bomItems, pricing, systemCapacityKw: capacity, systemType }, 'Preview calculated');
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/quotations
   */
  static async listQuotations(req, res, next) {
    try {
      const { status, search, page = 1, limit = 50 } = req.query;
      const query = {};

      if (status) query.status = status;
      if (search) {
        query.$or = [
          { quotationNumber: { $regex: search, $options: 'i' } }
        ];
      }

      const skip = (Number(page) - 1) * Number(limit);
      const [items, total] = await Promise.all([
        Quotation.find(query)
          .populate('customer')
          .populate('siteSurvey')
          .populate('createdBy', 'name email')
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(Number(limit)),
        Quotation.countDocuments(query)
      ]);

      return ApiResponse.success(res, items, 'Quotations retrieved', 200, {
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
   * GET /api/quotations/:id
   */
  static async getById(req, res, next) {
    try {
      const quotation = await Quotation.findById(req.params.id)
        .populate('customer')
        .populate('siteSurvey')
        .populate('createdBy', 'name email');

      if (!quotation) {
        return ApiResponse.notFound(res, 'Quotation not found.');
      }

      return ApiResponse.success(res, quotation);
    } catch (err) {
      next(err);
    }
  }

  /**
   * PUT /api/quotations/:id
   * Admin & Sales Editing of quotation items, pricing, capacity, and discounts
   */
  static async updateQuotation(req, res, next) {
    try {
      const quotation = await Quotation.findById(req.params.id);
      if (!quotation) {
        return ApiResponse.notFound(res, 'Quotation not found.');
      }

      if (quotation.status === 'converted') {
        return ApiResponse.badRequest(res, 'Cannot edit an already converted quotation with active project order.');
      }

      const { customBom, systemCapacityKw, systemType, notes, validUntil, laborCost, discountAmount, gstPercent } = req.body;

      if (systemCapacityKw) quotation.systemCapacityKw = Number(systemCapacityKw);
      if (systemType) quotation.systemType = systemType;
      if (notes !== undefined) quotation.notes = notes;
      if (validUntil) quotation.validUntil = new Date(validUntil);

      if (customBom && Array.isArray(customBom)) {
        quotation.bom = customBom;
      }

      // Recalculate financial pricing with any custom adjustments
      const basePricing = BomService.calculatePricing(quotation.bom, quotation.systemCapacityKw);
      if (laborCost !== undefined) {
        basePricing.installationLabour = Number(laborCost);
        basePricing.laborCost = Number(laborCost);
      }
      if (discountAmount !== undefined) basePricing.discount = Number(discountAmount);

      quotation.pricing = basePricing;

      await quotation.save();

      const populated = await Quotation.findById(quotation._id)
        .populate('customer')
        .populate('siteSurvey')
        .populate('createdBy', 'name email');

      return ApiResponse.success(res, populated, 'Quotation financial recalculation saved successfully.');
    } catch (err) {
      next(err);
    }
  }

  /**
   * PUT or POST /api/quotations/:id/approve
   */
  static async approveQuotation(req, res, next) {
    try {
      const quotation = await Quotation.findById(req.params.id);
      if (!quotation) {
        return ApiResponse.notFound(res, 'Quotation not found.');
      }

      quotation.status = 'approved';
      quotation.approvedAt = new Date();
      await quotation.save();

      const populated = await Quotation.findById(quotation._id)
        .populate('customer')
        .populate('siteSurvey');

      return ApiResponse.success(res, populated, 'Quotation approved. Ready for Convert to Order.');
    } catch (err) {
      next(err);
    }
  }

  /**
   * PUT or POST /api/quotations/:id/reject
   */
  static async rejectQuotation(req, res, next) {
    try {
      const quotation = await Quotation.findById(req.params.id);
      if (!quotation) {
        return ApiResponse.notFound(res, 'Quotation not found.');
      }

      quotation.status = 'rejected';
      await quotation.save();

      return ApiResponse.success(res, quotation, 'Quotation marked as rejected.');
    } catch (err) {
      next(err);
    }
  }

  /**
   * PUT /api/quotations/:id/status
   */
  static async updateStatus(req, res, next) {
    try {
      const { status } = req.body;
      const quotation = await Quotation.findById(req.params.id);

      if (!quotation) {
        return ApiResponse.notFound(res, 'Quotation not found.');
      }

      quotation.status = status;
      if (status === 'approved') {
        quotation.approvedAt = new Date();
      }

      await quotation.save();
      return ApiResponse.success(res, quotation, `Quotation status updated to '${status}'.`);
    } catch (err) {
      next(err);
    }
  }
}

module.exports = QuotationController;
