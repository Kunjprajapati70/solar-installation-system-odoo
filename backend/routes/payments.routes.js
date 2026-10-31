const express = require('express');
const router = express.Router();
const Payment = require('../models/Payment');
const Order = require('../models/Order');
const Customer = require('../models/Customer');
const { protect, authorize } = require('../middleware/auth');

// @route   GET /api/payments
router.get('/', protect, async (req, res) => {
  try {
    let query = {};
    if (req.user.role === 'customer') {
      const customer = await Customer.findOne({ user: req.user.id });
      if (!customer) return res.json({ success: true, count: 0, data: [] });
      query.customer = customer._id;
    }

    const payments = await Payment.find(query)
      .populate('customer', 'name customerCode phone email')
      .populate('order', 'orderNumber totalAmount paymentStatus')
      .sort({ paidAt: -1 });

    res.json({ success: true, count: payments.length, data: payments });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   POST /api/payments
router.post('/', protect, authorize('admin', 'sales'), async (req, res) => {
  try {
    const { orderId, customerId, amount, paymentType, paymentMethod, transactionReference, notes } = req.body;

    const count = await Payment.countDocuments();
    const receiptNumber = `RCPT-2026-${String(count + 1).padStart(5, '0')}`;

    const payment = await Payment.create({
      receiptNumber,
      order: orderId,
      customer: customerId,
      amount: Number(amount),
      paymentType: paymentType || 'advance',
      paymentMethod: paymentMethod || 'bank_transfer',
      transactionReference: transactionReference || `TXN-${Date.now()}`,
      status: 'completed',
      paidAt: new Date(),
      notes
    });

    // Update Order advancePaid and balance
    if (orderId) {
      const order = await Order.findById(orderId);
      if (order) {
        order.advancePaid = (order.advancePaid || 0) + Number(amount);
        order.balanceAmount = Math.max(0, order.totalAmount - order.advancePaid);
        if (order.balanceAmount === 0) {
          order.paymentStatus = 'fully_paid';
        } else if (order.advancePaid > 0) {
          order.paymentStatus = 'partially_paid';
        }
        await order.save();
      }
    }

    res.status(201).json({ success: true, message: 'Payment recorded successfully', data: payment });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
