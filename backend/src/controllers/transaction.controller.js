/**
 * Transaction, Payment & Expense Controller
 * Enforces integer paise arithmetic, balance updates, and duplicate reference prevention
 */

const Payment = require('../../models/Payment');
const Expense = require('../../models/Expense');
const Order = require('../../models/Order');
const PaymentService = require('../services/payment.service');
const ApiResponse = require('../utils/apiResponse');

class TransactionController {
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
   * GET /api/transactions (and /api/payments)
   */
  static async listTransactions(req, res, next) {
    try {
      const { paymentType, status, search, page = 1, limit = 50 } = req.query;
      const query = {};

      if (paymentType) query.paymentType = paymentType;
      if (status) query.status = status;
      if (search) {
        query.$or = [
          { receiptNumber: { $regex: search, $options: 'i' } },
          { transactionReference: { $regex: search, $options: 'i' } }
        ];
      }

      const skip = (Number(page) - 1) * Number(limit);
      const [items, total] = await Promise.all([
        Payment.find(query)
          .populate('customer')
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
   */
  static async getById(req, res, next) {
    try {
      const payment = await Payment.findById(req.params.id)
        .populate('customer')
        .populate('order');

      if (!payment) {
        return ApiResponse.notFound(res, 'Transaction not found.');
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
