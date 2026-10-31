const express = require('express');
const router = express.Router();
const Setting = require('../models/Setting');
const { protect, authorize } = require('../middleware/auth');

// @route   GET /api/settings
router.get('/', async (req, res) => {
  try {
    let settings = await Setting.findOne();
    if (!settings) {
      settings = await Setting.create({
        companyName: 'SunPower Solutions',
        tagline: 'Engineering High-Efficiency Solar Rooftops',
        contactEmail: 'contact@sunpowersolutions.com',
        contactPhone: '+91 98765 43210',
        warrantyDurationsYears: {
          panel: 25,
          inverter: 5,
          battery: 3,
          structure: 10
        },
        subsidySlabs: [
          { minKw: 1, maxKw: 1, subsidyAmount: 30000, scheme: 'PM Surya Ghar: 1 kW Rooftop Slab' },
          { minKw: 2, maxKw: 2, subsidyAmount: 60000, scheme: 'PM Surya Ghar: 2 kW Rooftop Slab' },
          { minKw: 3, maxKw: 10, subsidyAmount: 78000, scheme: 'PM Surya Ghar: 3 kW+ Maximum National Cap' }
        ]
      });
    }
    res.json({ success: true, data: settings });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   PUT /api/settings
router.put('/', protect, authorize('admin'), async (req, res) => {
  try {
    let settings = await Setting.findOne();
    if (!settings) {
      settings = await Setting.create(req.body);
    } else {
      Object.assign(settings, req.body);
      await settings.save();
    }
    res.json({ success: true, message: 'Settings updated successfully', data: settings });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
