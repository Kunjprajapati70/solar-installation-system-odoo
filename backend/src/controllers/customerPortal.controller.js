/**
 * Customer Portal Controller
 * Strictly enforces that all data queries identify the customer via authenticated req.user
 * Never trusts customerId supplied in frontend requests
 */

const Customer = require('../../models/Customer');
const Order = require('../../models/Order');
const Quotation = require('../../models/Quotation');
const Installation = require('../../models/Installation');
const Equipment = require('../../models/Equipment');
const Warranty = require('../../models/Warranty');
const Payment = require('../../models/Payment');
const ServiceTicket = require('../../models/ServiceTicket');
const Notification = require('../../models/Notification');
const ServiceTicketService = require('../services/serviceTicket.service');
const ApiResponse = require('../utils/apiResponse');

class CustomerPortalController {
  /**
   * Helper to resolve authenticated customer profile
   */
  static async getAuthenticatedCustomer(userId) {
    let customer = await Customer.findOne({ user: userId });
    if (!customer) {
      // Fallback: check if customer email matches user email
      const user = await require('../../models/User').findById(userId);
      if (user) {
        customer = await Customer.findOne({ email: user.email });
      }
    }
    return customer;
  }

  /**
   * GET /api/customer-portal/profile
   */
  static async getProfile(req, res, next) {
    try {
      const customer = await CustomerPortalController.getAuthenticatedCustomer(req.user._id);
      if (!customer) {
        return ApiResponse.notFound(res, 'No customer profile linked to this user account.');
      }
      return ApiResponse.success(res, customer, 'Customer profile retrieved');
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/customer-portal/orders
   */
  static async getOrders(req, res, next) {
    try {
      const customer = await CustomerPortalController.getAuthenticatedCustomer(req.user._id);
      if (!customer) return ApiResponse.success(res, []);

      const orders = await Order.find({ customer: customer._id })
        .populate('installation')
        .populate('allocatedEquipment.equipment')
        .sort({ createdAt: -1 });

      return ApiResponse.success(res, orders);
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/customer-portal/quotations
   */
  static async getQuotations(req, res, next) {
    try {
      const customer = await CustomerPortalController.getAuthenticatedCustomer(req.user._id);
      if (!customer) return ApiResponse.success(res, []);

      const quotations = await Quotation.find({ customer: customer._id }).sort({ createdAt: -1 });
      return ApiResponse.success(res, quotations);
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/customer-portal/payments
   */
  static async getPayments(req, res, next) {
    try {
      const customer = await CustomerPortalController.getAuthenticatedCustomer(req.user._id);
      if (!customer) return ApiResponse.success(res, []);

      const payments = await Payment.find({ customer: customer._id })
        .populate('order', 'orderNumber systemCapacityKw totalAmount')
        .sort({ paidAt: -1 });

      return ApiResponse.success(res, payments);
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/customer-portal/installations
   */
  static async getInstallations(req, res, next) {
    try {
      const customer = await CustomerPortalController.getAuthenticatedCustomer(req.user._id);
      if (!customer) return ApiResponse.success(res, []);

      const installations = await Installation.find({ customer: customer._id })
        .populate('leadTechnician', 'name phone')
        .sort({ scheduledDate: -1 });

      return ApiResponse.success(res, installations);
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/customer-portal/equipment
   */
  static async getEquipment(req, res, next) {
    try {
      const customer = await CustomerPortalController.getAuthenticatedCustomer(req.user._id);
      if (!customer) return ApiResponse.success(res, []);

      const equipment = await Equipment.find({ installedAtCustomer: customer._id }).sort({ createdAt: -1 });
      return ApiResponse.success(res, equipment);
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/customer-portal/warranties
   */
  static async getWarranties(req, res, next) {
    try {
      const customer = await CustomerPortalController.getAuthenticatedCustomer(req.user._id);
      if (!customer) return ApiResponse.success(res, []);

      const warranties = await Warranty.find({ customer: customer._id })
        .populate('equipment')
        .sort({ expiryDate: -1 });

      return ApiResponse.success(res, warranties);
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/customer-portal/service-tickets
   */
  static async getServiceTickets(req, res, next) {
    try {
      const customer = await CustomerPortalController.getAuthenticatedCustomer(req.user._id);
      if (!customer) return ApiResponse.success(res, []);

      const tickets = await ServiceTicket.find({ customer: customer._id })
        .populate('assignedTechnician', 'name phone')
        .sort({ createdAt: -1 });

      return ApiResponse.success(res, tickets);
    } catch (err) {
      next(err);
    }
  }

  /**
   * POST /api/customer-portal/service-tickets
   */
  static async raiseServiceTicket(req, res, next) {
    try {
      const customer = await CustomerPortalController.getAuthenticatedCustomer(req.user._id);
      if (!customer) {
        return ApiResponse.forbidden(res, 'Only verified customers can raise service complaints.');
      }

      const { equipmentSerialNumber, issueCategory, priority, title, description, photos } = req.body;

      const ticket = await ServiceTicketService.createTicket({
        equipmentSerialNumber,
        issueCategory,
        priority: priority || 'medium',
        title,
        description,
        photos: photos || [],
        userId: req.user._id,
        customerId: customer._id
      });

      return ApiResponse.created(res, ticket, 'Service complaint ticket submitted successfully.');
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/customer-portal/documents
   * Own quotations, receipts, warranties, surveys, and installations only
   */
  static async getDocuments(req, res, next) {
    try {
      const customer = await CustomerPortalController.getAuthenticatedCustomer(req.user._id);
      if (!customer) return ApiResponse.success(res, []);

      const SiteSurvey = require('../../models/SiteSurvey');
      const [quotations, payments, warranties, installations, surveys] = await Promise.all([
        Quotation.find({ customer: customer._id }).select('quotationNumber status createdAt systemCapacityKw pricing').sort({ createdAt: -1 }),
        Payment.find({ customer: customer._id }).select('receiptNumber amount status isDemo paidAt paymentMethod').sort({ paidAt: -1 }),
        Warranty.find({ customer: customer._id }).select('certificateNumber serialNumber status expiryDate').sort({ createdAt: -1 }),
        Installation.find({ customer: customer._id }).select('installationNumber status scheduledDate systemCapacityKw').sort({ scheduledDate: -1 }),
        SiteSurvey.find({ customer: customer._id }).select('surveyNumber status scheduledDate').sort({ scheduledDate: -1 })
      ]);

      return ApiResponse.success(res, {
        quotations,
        receipts: payments,
        warranties,
        installations,
        surveys
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/customer-portal/notifications
   */
  static async getNotifications(req, res, next) {
    try {
      const notifications = await Notification.find({
        $or: [
          { recipient: req.user._id },
          { targetRole: 'customer' },
          { targetRole: 'all' }
        ]
      }).sort({ createdAt: -1 }).limit(30);

      return ApiResponse.success(res, notifications);
    } catch (err) {
      next(err);
    }
  }
}

module.exports = CustomerPortalController;
