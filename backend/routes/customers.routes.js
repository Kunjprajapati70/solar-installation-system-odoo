const express = require('express');
const router = express.Router();
const Customer = require('../models/Customer');
const Order = require('../models/Order');
const Installation = require('../models/Installation');
const Warranty = require('../models/Warranty');
const Payment = require('../models/Payment');
const ServiceTicket = require('../models/ServiceTicket');
const Quotation = require('../models/Quotation');
const { protect, authorize } = require('../middleware/auth');

// @route   GET /api/customers
router.get('/', protect, async (req, res) => {
  try {
    if (req.user.role === 'customer') {
      const customer = await Customer.findOne({ user: req.user.id });
      return res.json({ success: true, count: customer ? 1 : 0, data: customer ? [customer] : [] });
    }

    const { search, connectionType } = req.query;
    let query = {};

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } },
        { customerCode: { $regex: search, $options: 'i' } }
      ];
    }

    if (connectionType) {
      query.connectionType = connectionType;
    }

    const customers = await Customer.find(query).sort({ createdAt: -1 });
    res.json({ success: true, count: customers.length, data: customers });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   GET /api/customers/:id
router.get('/:id', protect, async (req, res) => {
  try {
    const customer = await Customer.findById(req.params.id);
    if (!customer) {
      return res.status(404).json({ success: false, message: 'Customer not found' });
    }

    // Role check: customer can only view own record
    if (req.user.role === 'customer' && customer.user && customer.user.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    res.json({ success: true, data: customer });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   GET /api/customers/:id/summary
router.get('/:id/summary', protect, async (req, res) => {
  try {
    const customerId = req.params.id;
    const customer = await Customer.findById(customerId);
    if (!customer) {
      return res.status(404).json({ success: false, message: 'Customer not found' });
    }

    if (req.user.role === 'customer' && customer.user && customer.user.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    const [orders, installations, warranties, payments, tickets, quotations] = await Promise.all([
      Order.find({ customer: customerId }).sort({ createdAt: -1 }),
      Installation.find({ customer: customerId }).populate('leadTechnician', 'name phone').sort({ createdAt: -1 }),
      Warranty.find({ customer: customerId }).populate('equipment').sort({ expiryDate: 1 }),
      Payment.find({ customer: customerId }).sort({ paidAt: -1 }),
      ServiceTicket.find({ customer: customerId }).sort({ createdAt: -1 }),
      Quotation.find({ customer: customerId }).sort({ createdAt: -1 })
    ]);

    res.json({
      success: true,
      data: {
        customer,
        orders,
        installations,
        warranties,
        payments,
        tickets,
        quotations
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   POST /api/customers
router.post('/', protect, authorize('admin', 'sales'), async (req, res) => {
  try {
    const customerCount = await Customer.countDocuments();
    const customerCode = req.body.customerCode || `CUST-2026-${String(customerCount + 1).padStart(4, '0')}`;

    const customer = await Customer.create({
      ...req.body,
      customerCode
    });

    res.status(201).json({ success: true, data: customer });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   PUT /api/customers/:id
router.put('/:id', protect, authorize('admin', 'sales'), async (req, res) => {
  try {
    const customer = await Customer.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });

    if (!customer) {
      return res.status(404).json({ success: false, message: 'Customer not found' });
    }

    res.json({ success: true, data: customer });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
