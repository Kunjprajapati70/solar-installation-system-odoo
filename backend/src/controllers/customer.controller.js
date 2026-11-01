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
const ApiResponse = require('../utils/apiResponse');

class CustomerController {
  /**
   * POST /api/customers
   */
  static async createCustomer(req, res, next) {
    try {
      const { name, email, phone, installationAddress, connectionType, sanctionedLoadKw, discomName, consumerNumber, currentPhase, notes } = req.body;

      if (!name || !email || !phone) {
        return ApiResponse.badRequest(res, 'Name, email, and phone number are required.');
      }

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
        user: req.user.role === 'customer' ? req.user._id : req.body.user,
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
      return ApiResponse.created(res, customer, 'Customer record created successfully.');
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

      // If customer role, only return their own customer record
      if (req.user.role === 'customer') {
        query.user = req.user._id;
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

      // Customer ownership validation
      if (req.user.role === 'customer' && customer.user?.toString() !== req.user._id.toString()) {
        return ApiResponse.forbidden(res, 'Access denied: You do not own this customer profile.');
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

      if (req.user.role === 'customer' && customer.user?.toString() !== req.user._id.toString()) {
        return ApiResponse.forbidden(res, 'Access denied: You cannot edit another customer profile.');
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
        Order.find({ customer: customerId }).populate('installation').sort({ createdAt: -1 }),
        Installation.find({ customer: customerId }).sort({ scheduledDate: -1 }),
        Warranty.find({ customer: customerId }).sort({ expiryDate: -1 }),
        Payment.find({ customer: customerId }).sort({ paidAt: -1 }),
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
