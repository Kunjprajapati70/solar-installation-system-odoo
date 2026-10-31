const express = require('express');
const router = express.Router();
const Warranty = require('../models/Warranty');
const Equipment = require('../models/Equipment');
const Customer = require('../models/Customer');
const { protect, authorize } = require('../middleware/auth');

// @route   GET /api/warranties
router.get('/', protect, async (req, res) => {
  try {
    let query = {};
    if (req.user.role === 'customer') {
      const customer = await Customer.findOne({ user: req.user.id });
      if (!customer) return res.json({ success: true, count: 0, data: [] });
      query.customer = customer._id;
    }

    const { status, category, search } = req.query;
    if (status) query.status = status;
    if (category) query.category = category;

    if (search) {
      query.$or = [
        { serialNumber: { $regex: search, $options: 'i' } },
        { certificateNumber: { $regex: search, $options: 'i' } },
        { brand: { $regex: search, $options: 'i' } },
        { model: { $regex: search, $options: 'i' } }
      ];
    }

    const warranties = await Warranty.find(query)
      .populate('customer', 'name customerCode phone email installationAddress')
      .populate('equipment', 'serialNumber category status brand model specifications')
      .populate('order', 'orderNumber systemCapacityKw systemType deliveryConfirmedAt')
      .sort({ expiryDate: 1 });

    // Calculate dynamic state breakdown
    const now = new Date();
    const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

    const enriched = warranties.map(w => {
      const isExpired = now > w.expiryDate;
      const isUpcomingExpiry = !isExpired && w.expiryDate <= thirtyDaysFromNow;
      const remainingDays = Math.max(0, Math.ceil((w.expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));

      return {
        ...w.toObject(),
        isExpired,
        isUpcomingExpiry,
        remainingDays,
        currentStatusLabel: isExpired ? 'Expired' : isUpcomingExpiry ? 'Expiring Soon' : 'Active'
      };
    });

    res.json({
      success: true,
      count: enriched.length,
      data: enriched,
      summary: {
        total: enriched.length,
        active: enriched.filter(w => !w.isExpired).length,
        expired: enriched.filter(w => w.isExpired).length,
        expiringSoon: enriched.filter(w => w.isUpcomingExpiry).length
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   GET /api/warranties/lookup/:serial
// Serial-number warranty lookup with eligibility assessment
router.get('/lookup/:serial', protect, async (req, res) => {
  try {
    const serial = req.params.serial.toUpperCase().trim();
    const warranty = await Warranty.findOne({ serialNumber: serial })
      .populate('customer')
      .populate('equipment')
      .populate('order');

    if (!warranty) {
      return res.status(404).json({
        success: false,
        message: `No active warranty certificate found for serial number '${serial}'.`
      });
    }

    const now = new Date();
    const isEligibleForFreeRepair = warranty.status === 'active' && now <= warranty.expiryDate;
    const remainingDays = Math.max(0, Math.ceil((warranty.expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));

    res.json({
      success: true,
      data: {
        warranty,
        isEligibleForFreeRepair,
        statusLabel: isEligibleForFreeRepair ? 'In-Warranty (Zero Repair Cost)' : 'Out-of-Warranty (Paid Service)',
        remainingDays,
        terms: warranty.coverageDetails
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   POST /api/warranties
// Manual or admin certificate generation
router.post('/', protect, authorize('admin'), async (req, res) => {
  try {
    const { equipmentId, serialNumber, customerId, orderId, category, durationYears, startDate } = req.body;

    const start = startDate ? new Date(startDate) : new Date();
    const years = Number(durationYears) || 5;
    const expiry = new Date(start.getTime());
    expiry.setFullYear(expiry.getFullYear() + years);

    const count = await Warranty.countDocuments();
    const certificateNumber = `WAR-2026-${String(count + 1).padStart(5, '0')}`;

    const warranty = await Warranty.create({
      certificateNumber,
      equipment: equipmentId,
      serialNumber: serialNumber.toUpperCase().trim(),
      customer: customerId,
      order: orderId,
      category,
      durationYears: years,
      startDate: start,
      expiryDate: expiry,
      status: 'active'
    });

    res.status(201).json({ success: true, data: warranty });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
