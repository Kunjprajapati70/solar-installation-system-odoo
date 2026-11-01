/**
 * Payment & Transaction Processing Service
 * Enforces integer paise arithmetic, order balance reconciliation, and financial auditing
 */

const Payment = require('../../models/Payment');
const Order = require('../../models/Order');
const Expense = require('../../models/Expense');
const { rupeesToPaise, paiseToRupees } = require('../utils/currency');
const { PAYMENT_STATUS, ORDER_STATUS } = require('../config/constants');

class PaymentService {
  /**
   * Records a confirmed transaction and updates order financials
   */
  static async recordTransaction({
    orderId,
    customerId,
    amount, // In INR Rupees
    paymentType,
    paymentMethod = 'bank_transfer',
    transactionReference,
    notes = ''
  }) {
    const rupeeAmount = Number(amount);
    if (!rupeeAmount || rupeeAmount <= 0) {
      throw new Error('Transaction amount must be a positive number.');
    }

    // Check duplicate reference
    if (transactionReference) {
      const existingTx = await Payment.findOne({
        transactionReference: transactionReference.trim()
      });
      if (existingTx) {
        throw new Error(`Transaction with reference '${transactionReference}' has already been processed.`);
      }
    }

    const order = await Order.findById(orderId).populate('customer');
    if (!order) {
      throw new Error('Order associated with transaction not found.');
    }

    const receiptNumber = `RCP-${Date.now().toString().slice(-6)}-${Math.floor(100 + Math.random() * 900)}`;

    const payment = new Payment({
      receiptNumber,
      order: order._id,
      customer: customerId || order.customer._id,
      amount: rupeeAmount,
      paymentType,
      paymentMethod,
      transactionReference: transactionReference ? transactionReference.trim() : `TXN-${Date.now()}`,
      status: 'completed',
      paidAt: new Date(),
      notes
    });

    await payment.save();

    // Reconcile Order balances using integer paise arithmetic
    const totalOrderPaise = rupeesToPaise(order.totalAmount);
    const advancePaidPaise = rupeesToPaise(order.advancePaid || 0);
    const newTxPaise = rupeesToPaise(rupeeAmount);

    const updatedPaidPaise = advancePaidPaise + newTxPaise;
    const remainingPaise = Math.max(totalOrderPaise - updatedPaidPaise, 0);

    order.advancePaid = paiseToRupees(updatedPaidPaise);
    order.balanceAmount = paiseToRupees(remainingPaise);

    if (remainingPaise === 0) {
      order.paymentStatus = PAYMENT_STATUS.FULLY_PAID;
    } else if (updatedPaidPaise >= rupeesToPaise(order.advanceRequired)) {
      order.paymentStatus = PAYMENT_STATUS.ADVANCE_PAID;
    } else {
      order.paymentStatus = PAYMENT_STATUS.PARTIALLY_PAID;
    }

    await order.save();

    return {
      payment,
      order: {
        orderNumber: order.orderNumber,
        totalAmount: order.totalAmount,
        advancePaid: order.advancePaid,
        balanceAmount: order.balanceAmount,
        paymentStatus: order.paymentStatus
      }
    };
  }

  /**
   * Process Demo Payment for Hackathon Demonstration
   * Explicitly flagged as non-bank simulated transaction
   */
  static async processDemoPayment({
    orderId,
    amount,
    paymentMethod = 'demo_upi',
    demoScenario = 'success',
    notes = '',
    userId,
    userRole
  }) {
    const rupeeAmount = Number(amount);
    if (!rupeeAmount || rupeeAmount <= 0) {
      throw new Error('Demo transaction amount must be greater than zero.');
    }

    const order = await Order.findById(orderId).populate('customer');
    if (!order) {
      throw new Error('Order associated with demo payment was not found.');
    }

    // Backend validation of remaining balance
    if (rupeeAmount > order.balanceAmount) {
      throw new Error(`Payment amount (₹${rupeeAmount.toLocaleString('en-IN')}) exceeds the outstanding balance of ₹${order.balanceAmount.toLocaleString('en-IN')}.`);
    }

    const methodPrefix = (paymentMethod || 'demo_upi').replace('demo_', '').toUpperCase();
    const demoTxnRef = `DEMO-${methodPrefix}-${Date.now().toString().slice(-6)}-${Math.floor(100 + Math.random() * 900)}`;
    const receiptNumber = `RCP-DEMO-${Date.now().toString().slice(-6)}-${Math.floor(1000 + Math.random() * 9000)}`;

    const isSuccessful = demoScenario === 'success';
    const failureReasons = {
      insufficient_funds: 'Simulated decline: Insufficient balance in demo bank account.',
      network_failure: 'Simulated failure: Bank gateway communication timeout.',
      card_declined: 'Simulated decline: Card expired or security check failed.'
    };

    const payment = new Payment({
      receiptNumber,
      order: order._id,
      customer: order.customer._id,
      amount: rupeeAmount,
      paymentType: order.advancePaid === 0 ? 'advance' : 'milestone',
      paymentMethod,
      isDemo: true,
      demoScenario,
      transactionReference: demoTxnRef,
      status: isSuccessful ? 'completed' : 'failed',
      paidAt: new Date(),
      notes: isSuccessful
        ? `DEMO PAYMENT – NOT A REAL BANK TRANSACTION. Method: ${paymentMethod}. ${notes}`
        : `DEMO PAYMENT FAILED: ${failureReasons[demoScenario] || 'Transaction rejected.'}`
    });

    await payment.save();

    if (!isSuccessful) {
      return {
        success: false,
        isDemo: true,
        message: failureReasons[demoScenario] || 'Demo transaction was rejected by simulated gateway.',
        payment
      };
    }

    // Reconcile order balances using integer paise arithmetic
    const totalOrderPaise = rupeesToPaise(order.totalAmount);
    const advancePaidPaise = rupeesToPaise(order.advancePaid || 0);
    const newTxPaise = rupeesToPaise(rupeeAmount);

    const updatedPaidPaise = advancePaidPaise + newTxPaise;
    const remainingPaise = Math.max(totalOrderPaise - updatedPaidPaise, 0);

    order.advancePaid = paiseToRupees(updatedPaidPaise);
    order.balanceAmount = paiseToRupees(remainingPaise);

    if (remainingPaise === 0) {
      order.paymentStatus = PAYMENT_STATUS.FULLY_PAID;
    } else if (updatedPaidPaise >= rupeesToPaise(order.advanceRequired)) {
      order.paymentStatus = PAYMENT_STATUS.ADVANCE_PAID;
    } else {
      order.paymentStatus = PAYMENT_STATUS.PARTIALLY_PAID;
    }

    await order.save();

    return {
      success: true,
      isDemo: true,
      message: 'Demo payment completed successfully. Non-bank simulated transaction recorded.',
      payment,
      order: {
        orderNumber: order.orderNumber,
        totalAmount: order.totalAmount,
        advancePaid: order.advancePaid,
        balanceAmount: order.balanceAmount,
        paymentStatus: order.paymentStatus
      }
    };
  }

  /**
   * Computes financial summary from stored transactions and expenses
   * Strictly counts confirmed real revenue, with demo payments separately identified
   */
  static async getFinancialSummary() {
    // 1. Confirmed Real Revenue (isDemo !== true)
    const revenueAgg = await Payment.aggregate([
      { $match: { status: 'completed', isDemo: { $ne: true } } },
      { $group: { _id: null, totalRevenue: { $sum: '$amount' }, count: { $sum: 1 } } }
    ]);
    const totalRevenue = revenueAgg[0]?.totalRevenue || 0;

    // 2. Demo Payments separately identified
    const demoAgg = await Payment.aggregate([
      { $match: { status: 'completed', isDemo: true } },
      { $group: { _id: null, totalDemoRevenue: { $sum: '$amount' }, count: { $sum: 1 } } }
    ]);
    const totalDemoRevenue = demoAgg[0]?.totalDemoRevenue || 0;

    // 3. Confirmed Expenses Total
    const expenseAgg = await Expense.aggregate([
      { $group: { _id: null, totalExpenses: { $sum: '$amount' }, count: { $sum: 1 } } }
    ]);
    const totalExpenses = expenseAgg[0]?.totalExpenses || 0;

    // 4. Pending Order Balances
    const pendingOrdersAgg = await Order.aggregate([
      { $match: { paymentStatus: { $ne: PAYMENT_STATUS.FULLY_PAID } } },
      { $group: { _id: null, totalPending: { $sum: '$balanceAmount' } } }
    ]);
    const totalPending = pendingOrdersAgg[0]?.totalPending || 0;

    // 5. Net Profit (real revenue - expenses)
    const revPaise = rupeesToPaise(totalRevenue);
    const expPaise = rupeesToPaise(totalExpenses);
    const netProfitPaise = revPaise - expPaise;
    const netProfit = paiseToRupees(netProfitPaise);

    return {
      totalRevenue,
      totalExpenses,
      netProfit,
      totalPending,
      totalDemoRevenue,
      paymentCount: revenueAgg[0]?.count || 0,
      demoPaymentCount: demoAgg[0]?.count || 0,
      expenseCount: expenseAgg[0]?.count || 0
    };
  }
}

module.exports = PaymentService;
