/**
 * Customer Management Controller
 * Supports CRUD, search, pagination, filtering, and complete lifecycle history
 */

const Customer = require('../../models/Customer');
const Order = require('../../models/Order');
const Quotation = require('../../models/Quotation');
const SiteSurvey = require('../../models/SiteSurvey');
const Installation = require('../../models/Installation');
const Warranty = require('../../models/Warranty');
const Payment = require('../../models/Payment');
const ServiceTicket = require('../../models/ServiceTicket');
const ApprovalRequest = require('../../models/ApprovalRequest');
const Notification = require('../../models/Notification');
const ApiResponse = require('../utils/apiResponse');
const { resolveOwnedCustomer } = require('../utils/customerScope');
const User = require('../../models/User');
const {
  normalizeUserId,
  validateUserId,
  validatePassword,
  assertUniqueLogin
} = require('../utils/loginCredentials');

class CustomerController {
  /**
   * POST /api/customers
   */
  static async createCustomer(req, res, next) {
    try {
      const { name, email, phone, installationAddress, connectionType, sanctionedLoadKw, discomName, consumerNumber, currentPhase, notes, userId, password } = req.body;

      if (!name || !email || !phone) {
        return ApiResponse.badRequest(res, 'Name, email, and phone number are required.');
      }

      if (req.user.role === 'sales') {
        const existing = await Customer.findOne({
          $or: [{ email: email.toLowerCase().trim() }, { phone: phone.trim() }]
        });
        if (existing) {
          return ApiResponse.badRequest(res, 'A customer with this email or phone already exists.');
        }

        const approvalReq = new ApprovalRequest({
          requestType: 'customer_creation',
          title: `New Customer Request: ${name}`,
          description: `Sales Representative ${req.user.name} submitted a customer onboarding request.`,
          payload: {
            name,
            email: email.toLowerCase().trim(),
            phone: phone.trim(),
            userId: userId ? normalizeUserId(userId) : undefined,
            password: password || undefined,
            installationAddress,
            connectionType,
            sanctionedLoadKw,
            discomName,
            consumerNumber,
            currentPhase,
            notes
          },
          requestedBy: req.user._id,
          requestedByName: req.user.name,
          requestedByRole: req.user.role,
          status: 'pending',
          auditTrail: [{
            action: 'CREATED',
            fromStatus: 'none',
            toStatus: 'pending',
            performedBy: req.user._id,
            performedByName: req.user.name,
            notes: 'Customer request submitted for Admin approval'
          }]
        });
        await approvalReq.save();
        await Notification.create({
          targetRole: 'admin',
          title: `Pending customer request ${approvalReq.requestNumber}`,
          message: `${req.user.name} requested a customer account for ${name}.`,
          type: 'approval_request',
          link: '/approvals'
        });
        return ApiResponse.created(res, {
          requestId: approvalReq._id,
          requestNumber: approvalReq.requestNumber,
          status: 'pending_approval'
        }, 'Customer request submitted. Awaiting Administrator approval.');
      }

      const portalUserId = normalizeUserId(userId);
      const userIdError = validateUserId(portalUserId);
      const passwordError = validatePassword(password);
      if (userIdError) return ApiResponse.badRequest(res, `Portal login: ${userIdError}`);
      if (passwordError) return ApiResponse.badRequest(res, `Portal login: ${passwordError}`);
      try {
        await assertUniqueLogin({ userId: portalUserId, email: email.toLowerCase().trim() });
      } catch (dupErr) {
        return ApiResponse.badRequest(res, dupErr.message);
      }

      const portalUser = new User({
        userId: portalUserId,
        name,
        email: email.toLowerCase().trim(),
        password,
        role: 'customer',
        department: 'Customer Portal',
        phone: phone.trim(),
        mustChangePassword: true,
        status: 'active',
        isActive: true,
        createdBy: req.user._id
      });
      await portalUser.save();

      // Generate unique customer code
      const customerCode = `CUST-${Date.now().toString().slice(-6)}-${Math.floor(100 + Math.random() * 900)}`;

      const connectionMap = {
        residential: 'on_grid',
        commercial: 'on_grid',
        industrial: 'on_grid',
        agricultural: 'hybrid'
      };
      const phaseMap = { 1: 'single', 3: 'three', single: 'single', three: 'three' };

      const customer = new Customer({
        customerCode,
        user: portalUser._id,
        name,
        email: email.toLowerCase().trim(),
        phone: phone.trim(),
        installationAddress: installationAddress || {
          street: 'Main Street',
          city: 'Ahmedabad',
          state: 'Gujarat',
          pincode: '380015'
        },
        connectionType: connectionMap[connectionType] || connectionType || 'on_grid',
        sanctionedLoadKw: Number(sanctionedLoadKw) || 3,
        discomName: discomName || 'State Electricity Distribution Co.',
        consumerNumber,
        currentPhase: phaseMap[currentPhase] || currentPhase || 'single',
        notes: notes || ''
      });

      await customer.save();
      return ApiResponse.created(res, {
        ...customer.toObject(),
        portalLogin: {
          userId: portalUser.userId,
          email: portalUser.email,
          temporaryPassword: password,
          mustChangePassword: true
        }
      }, 'Customer record and portal login created successfully.');
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/customers
   */
  static async listCustomers(req, res, next) {
    try {
      const { search, city, connectionType, page = 1, limit = 200 } = req.query;
      const query = {};

      if (city) query['installationAddress.city'] = new RegExp(city, 'i');
      if (connectionType) query.connectionType = connectionType;
      if (search) {
        query.$or = [
          { name: { $regex: search, $options: 'i' } },
          { email: { $regex: search, $options: 'i' } },
          { phone: { $regex: search, $options: 'i' } },
          { customerCode: { $regex: search, $options: 'i' } }
        ];
      }

      if (req.user.role === 'customer') {
        const owned = await resolveOwnedCustomer(req.user);
        if (!owned) {
          return ApiResponse.success(res, [], 'Customers retrieved', 200, { total: 0, page: 1, limit: Number(limit), pages: 0 });
        }
        query._id = owned._id;
      }

      const skip = (Number(page) - 1) * Number(limit);
      const [items, total] = await Promise.all([
        Customer.find(query)
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(Number(limit)),
        Customer.countDocuments(query)
      ]);

      return ApiResponse.success(res, items, 'Customers retrieved', 200, {
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
   * GET /api/customers/:id
   */
  static async getById(req, res, next) {
    try {
      const customer = await Customer.findById(req.params.id);
      if (!customer) {
        return ApiResponse.notFound(res, 'Customer not found.');
      }

      if (req.user.role === 'customer') {
        const owned = await resolveOwnedCustomer(req.user);
        if (!owned || owned._id.toString() !== customer._id.toString()) {
          return ApiResponse.forbidden(res, 'Access denied: You do not own this customer profile.');
        }
      }

      return ApiResponse.success(res, customer);
    } catch (err) {
      next(err);
    }
  }

  /**
   * PUT /api/customers/:id
   */
  static async updateCustomer(req, res, next) {
    try {
      const customer = await Customer.findById(req.params.id);
      if (!customer) {
        return ApiResponse.notFound(res, 'Customer not found.');
      }

      if (req.user.role === 'customer') {
        const owned = await resolveOwnedCustomer(req.user);
        if (!owned || owned._id.toString() !== customer._id.toString()) {
          return ApiResponse.forbidden(res, 'Access denied: You cannot edit another customer profile.');
        }
      }

      const { name, phone, installationAddress, connectionType, sanctionedLoadKw, discomName, consumerNumber, currentPhase, notes } = req.body;
      if (name) customer.name = name;
      if (phone) customer.phone = phone;
      if (installationAddress) customer.installationAddress = { ...customer.installationAddress.toObject(), ...installationAddress };
      if (connectionType) customer.connectionType = connectionType;
      if (sanctionedLoadKw !== undefined) customer.sanctionedLoadKw = Number(sanctionedLoadKw);
      if (discomName) customer.discomName = discomName;
      if (consumerNumber) customer.consumerNumber = consumerNumber;
      if (currentPhase) customer.currentPhase = currentPhase;
      if (notes !== undefined) customer.notes = notes;

      await customer.save();
      return ApiResponse.success(res, customer, 'Customer record updated.');
    } catch (err) {
      next(err);
    }
  }

  /**
   * DELETE /api/customers/:id
   */
  static async deleteCustomer(req, res, next) {
    try {
      const customer = await Customer.findById(req.params.id);
      if (!customer) {
        return ApiResponse.notFound(res, 'Customer not found.');
      }

      await Customer.findByIdAndDelete(req.params.id);
      return ApiResponse.success(res, null, 'Customer record deleted.');
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/customers/:id/history (and /api/customers/:id/summary)
   * Returns aggregated lifecycle history for this customer
   */
  static async getCustomerHistory(req, res, next) {
    try {
      const customerId = req.params.id;
      const customer = await Customer.findById(customerId);
      if (!customer) {
        return ApiResponse.notFound(res, 'Customer not found.');
      }

      const [surveys, quotations, orders, installations, warranties, payments, tickets] = await Promise.all([
        SiteSurvey.find({ customer: customerId }).sort({ createdAt: -1 }),
        Quotation.find({ customer: customerId }).sort({ createdAt: -1 }),
        Order.find({ customer: customerId }).populate('installation').populate('quotation').sort({ createdAt: -1 }),
        Installation.find({ customer: customerId }).sort({ scheduledDate: -1 }),
        Warranty.find({ customer: customerId }).sort({ expiryDate: -1 }),
        Payment.find({ customer: customerId })
          .populate('customer', 'name customerCode email phone installationAddress')
          .populate('order', 'orderNumber totalAmount advancePaid balanceAmount paymentStatus systemCapacityKw systemType')
          .sort({ paidAt: -1 }),
        ServiceTicket.find({ customer: customerId }).sort({ createdAt: -1 })
      ]);

      return ApiResponse.success(res, {
        customer,
        surveys,
        quotations,
        orders,
        installations,
        warranties,
        payments,
        tickets
      }, 'Customer lifecycle history retrieved');
    } catch (err) {
      next(err);
    }
  }
}

module.exports = CustomerController;
