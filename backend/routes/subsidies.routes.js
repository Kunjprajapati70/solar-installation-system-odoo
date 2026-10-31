const express = require('express');
const router = express.Router();
const Subsidy = require('../models/Subsidy');
const Customer = require('../models/Customer');
const { protect, authorize } = require('../middleware/auth');
const upload = require('../middleware/upload');

// @route   GET /api/subsidies
router.get('/', protect, async (req, res) => {
  try {
    let query = {};
    if (req.user.role === 'customer') {
      const customer = await Customer.findOne({ user: req.user.id });
      if (!customer) return res.json({ success: true, count: 0, data: [] });
      query.customer = customer._id;
    }

    const { status } = req.query;
    if (status) query.status = status;

    const subsidies = await Subsidy.find(query)
      .populate('customer', 'name customerCode phone email installationAddress')
      .populate('order', 'orderNumber systemCapacityKw deliveryConfirmedAt')
      .sort({ createdAt: -1 });

    res.json({ success: true, count: subsidies.length, data: subsidies });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   POST /api/subsidies
router.post('/', protect, authorize('admin', 'sales'), async (req, res) => {
  try {
    const count = await Subsidy.countDocuments();
    const applicationNumber = `SUB-2026-${String(count + 1).padStart(5, '0')}`;

    const subsidy = await Subsidy.create({
      ...req.body,
      applicationNumber
    });

    res.status(201).json({ success: true, data: subsidy });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   PUT /api/subsidies/:id/status
router.put('/:id/status', protect, authorize('admin', 'sales'), async (req, res) => {
  try {
    const { status, disbursedAmount, disbursementDate, discomOfficerNotes } = req.body;
    const subsidy = await Subsidy.findById(req.params.id);
    if (!subsidy) return res.status(404).json({ success: false, message: 'Subsidy record not found' });

    if (status) subsidy.status = status;
    if (disbursedAmount) subsidy.subsidyDisbursedAmount = Number(disbursedAmount);
    if (disbursementDate) subsidy.disbursementDate = disbursementDate;
    if (discomOfficerNotes) subsidy.discomOfficerNotes = discomOfficerNotes;

    await subsidy.save();
    res.json({ success: true, data: subsidy });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
