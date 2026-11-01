/**
 * Transaction, Payment & Expense Controller
 * Enforces integer paise arithmetic, balance updates, and duplicate reference prevention
 */

const Payment = require('../../models/Payment');
const Expense = require('../../models/Expense');
const Order = require('../../models/Order');
const Customer = require('../../models/Customer');
const PaymentService = require('../services/payment.service');
const ApiResponse = require('../utils/apiResponse');

class TransactionController {
  /**
   * Helper to resolve customer for authenticated user
   */
  static async getCustomerForUser(userId, userEmail) {
    let customer = await Customer.findOne({ user: userId });
    if (!customer && userEmail) {
      customer = await Customer.findOne({ email: userEmail });
    }
    return customer;
  }

  /**
   * POST /api/transactions (and /api/payments)
   */
  static async recordTransaction(req, res, next) {
    try {
      const { orderId, order, customerId, customer, amount, paymentType, paymentMethod, transactionReference, notes } = req.body;

      const targetOrderId = orderId || order;
      const targetCustomerId = customerId || customer;

      if (!targetOrderId) {
        return ApiResponse.badRequest(res, 'Associated Order ID is required for recording transactions.');
      }

      const result = await PaymentService.recordTransaction({
        orderId: targetOrderId,
        customerId: targetCustomerId,
        amount,
        paymentType: paymentType || 'advance',
        paymentMethod: paymentMethod || 'bank_transfer',
        transactionReference,
        notes
      });

      return ApiResponse.created(res, result, 'Payment transaction verified and recorded successfully.');
    } catch (err) {
      next(err);
    }
  }

  /**
   * POST /api/transactions/demo (and /api/payments/demo)
   * Dedicated Demo Payment for Hackathon Demonstration
   */
  static async recordDemoPayment(req, res, next) {
    try {
      const { orderId, order, amount, paymentMethod = 'demo_upi', demoScenario = 'success', notes = '' } = req.body;
      const targetOrderId = orderId || order;

      if (!targetOrderId) {
        return ApiResponse.badRequest(res, 'Target Order ID is required for processing demo payment.');
      }

      // If called by customer, verify customer ownership of order
      if (req.user?.role === 'customer') {
        const customer = await TransactionController.getCustomerForUser(req.user._id, req.user.email);
        if (!customer) {
          return ApiResponse.forbidden(res, 'No customer profile linked to your user account.');
        }

        const ord = await Order.findById(targetOrderId);
        if (!ord || ord.customer.toString() !== customer._id.toString()) {
          return ApiResponse.forbidden(res, 'Security Policy: You can only execute demo payments on your own orders.');
        }
      }

      const result = await PaymentService.processDemoPayment({
        orderId: targetOrderId,
        amount,
        paymentMethod,
        demoScenario,
        notes,
        userId: req.user?._id,
        userRole: req.user?.role
      });

      if (!result.success) {
        return ApiResponse.badRequest(res, result.message, result.payment);
      }

      return ApiResponse.created(res, result, result.message);
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/transactions (and /api/payments)
   * Strictly enforces customer data privacy
   */
  static async listTransactions(req, res, next) {
    try {
      const { paymentType, status, isDemo, search, page = 1, limit = 50 } = req.query;
      const query = {};

      // Privacy Check: customer can ONLY see their own transactions
      if (req.user?.role === 'customer') {
        const customer = await TransactionController.getCustomerForUser(req.user._id, req.user.email);
        if (!customer) {
          return ApiResponse.success(res, [], 'No transactions found', 200, { total: 0, page: 1, limit, pages: 0 });
        }
        query.customer = customer._id;
      }

      if (paymentType) query.paymentType = paymentType;
      if (status) query.status = status;
      if (isDemo !== undefined) query.isDemo = isDemo === 'true';

      if (search) {
        query.$or = [
          { receiptNumber: { $regex: search, $options: 'i' } },
          { transactionReference: { $regex: search, $options: 'i' } }
        ];
      }

      const skip = (Number(page) - 1) * Number(limit);
      const [items, total] = await Promise.all([
        Payment.find(query)
          .populate('customer', 'name customerCode email phone')
          .populate('order', 'orderNumber totalAmount balanceAmount paymentStatus')
          .sort({ paidAt: -1 })
          .skip(skip)
          .limit(Number(limit)),
        Payment.countDocuments(query)
      ]);

      return ApiResponse.success(res, items, 'Transactions retrieved', 200, {
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
   * GET /api/transactions/:id
   * Strictly enforces customer ownership
   */
  static async getById(req, res, next) {
    try {
      const payment = await Payment.findById(req.params.id)
        .populate('customer')
        .populate('order');

      if (!payment) {
        return ApiResponse.notFound(res, 'Transaction not found.');
      }

      // Privacy check
      if (req.user?.role === 'customer') {
        const customer = await TransactionController.getCustomerForUser(req.user._id, req.user.email);
        if (!customer || payment.customer?._id?.toString() !== customer._id.toString()) {
          return ApiResponse.forbidden(res, 'Security Policy Violation: Access denied to another customer’s transaction record.');
        }
      }

      return ApiResponse.success(res, payment);
    } catch (err) {
      next(err);
    }
  }

  /**
   * POST /api/expenses
   */
  static async recordExpense(req, res, next) {
    try {
      const { category, amount, payee, description, orderId, order, receiptUrl, expenseDate } = req.body;

      if (!category || !amount || !payee || !description) {
        return ApiResponse.badRequest(res, 'Category, amount, payee, and description are required for logging expenses.');
      }

      const expenseNumber = `EXP-${Date.now().toString().slice(-6)}-${Math.floor(100 + Math.random() * 900)}`;

      const expense = new Expense({
        expenseNumber,
        category,
        amount: Number(amount),
        payee,
        description,
        order: orderId || order || undefined,
        receiptUrl: receiptUrl || '',
        expenseDate: expenseDate ? new Date(expenseDate) : new Date(),
        loggedBy: req.user._id
      });

      await expense.save();
      return ApiResponse.created(res, expense, 'Expense recorded successfully.');
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/expenses
   */
  static async listExpenses(req, res, next) {
    try {
      const { category, search, page = 1, limit = 50 } = req.query;
      const query = {};

      if (category) query.category = category;
      if (search) {
        query.$or = [
          { expenseNumber: { $regex: search, $options: 'i' } },
          { payee: { $regex: search, $options: 'i' } },
          { description: { $regex: search, $options: 'i' } }
        ];
      }

      const skip = (Number(page) - 1) * Number(limit);
      const [items, total] = await Promise.all([
        Expense.find(query)
          .populate('order', 'orderNumber')
          .populate('loggedBy', 'name email')
          .sort({ expenseDate: -1 })
          .skip(skip)
          .limit(Number(limit)),
        Expense.countDocuments(query)
      ]);

      return ApiResponse.success(res, items, 'Expenses retrieved', 200, {
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
   * GET /api/finance/summary
   */
  static async getFinanceSummary(req, res, next) {
    try {
      const summary = await PaymentService.getFinancialSummary();
      return ApiResponse.success(res, summary, 'Financial summary calculated from verified transactions.');
    } catch (err) {
      next(err);
    }
  }
}

module.exports = TransactionController;
