const express = require('express');
const router = express.Router();
const Enquiry = require('../models/Enquiry');
const SiteSurvey = require('../models/SiteSurvey');
const Customer = require('../models/Customer');
const { protect, authorize } = require('../middleware/auth');

// @route   GET /api/enquiries
router.get('/', protect, authorize('admin', 'sales'), async (req, res) => {
  try {
    const { status, search } = req.query;
    let query = {};

    if (status) query.status = status;
    if (search) {
      query.$or = [
        { customerName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } },
        { enquiryNumber: { $regex: search, $options: 'i' } }
      ];
    }

    const enquiries = await Enquiry.find(query)
      .populate('assignedSales', 'name email')
      .populate('linkedCustomer', 'name customerCode')
      .sort({ createdAt: -1 });

    res.json({ success: true, count: enquiries.length, data: enquiries });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   POST /api/enquiries
router.post('/', async (req, res) => {
  try {
    const count = await Enquiry.countDocuments();
    const enquiryNumber = `ENQ-2026-${String(count + 1).padStart(4, '0')}`;

    const enquiry = await Enquiry.create({
      ...req.body,
      enquiryNumber
    });

    res.status(201).json({ success: true, data: enquiry });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   PUT /api/enquiries/:id
router.put('/:id', protect, authorize('admin', 'sales'), async (req, res) => {
  try {
    const enquiry = await Enquiry.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });

    if (!enquiry) {
      return res.status(404).json({ success: false, message: 'Enquiry not found' });
    }

    res.json({ success: true, data: enquiry });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   POST /api/enquiries/:id/schedule-survey
router.post('/:id/schedule-survey', protect, authorize('admin', 'sales'), async (req, res) => {
  try {
    const enquiry = await Enquiry.findById(req.params.id);
    if (!enquiry) {
      return res.status(404).json({ success: false, message: 'Enquiry not found' });
    }

    const { surveyorId, scheduledDate, notes } = req.body;
    if (!surveyorId || !scheduledDate) {
      return res.status(400).json({ success: false, message: 'Surveyor and scheduled date are required' });
    }

    // Auto-create or link customer if needed
    let customerId = enquiry.linkedCustomer;
    if (!customerId) {
      const custCount = await Customer.countDocuments();
      const customer = await Customer.create({
        customerCode: `CUST-2026-${String(custCount + 1).padStart(4, '0')}`,
        name: enquiry.customerName,
        email: enquiry.email,
        phone: enquiry.phone,
        installationAddress: {
          street: enquiry.address?.street || 'Site Address',
          city: enquiry.address?.city || 'City',
          state: enquiry.address?.state || 'State',
          pincode: enquiry.address?.pincode || '400001'
        },
        connectionType: enquiry.systemType || 'on_grid',
        sanctionedLoadKw: enquiry.proposedCapacityKw || 3
      });
      customerId = customer._id;
      enquiry.linkedCustomer = customerId;
    }

    const surveyCount = await SiteSurvey.countDocuments();
    const surveyNumber = `SURV-2026-${String(surveyCount + 1).padStart(4, '0')}`;

    const survey = await SiteSurvey.create({
      surveyNumber,
      enquiry: enquiry._id,
      customer: customerId,
      surveyor: surveyorId,
      scheduledDate,
      surveyorNotes: notes || 'Site survey scheduled from enquiry pipeline'
    });

    enquiry.status = 'survey_scheduled';
    await enquiry.save();

    res.status(201).json({
      success: true,
      message: 'Site survey scheduled successfully',
      data: { enquiry, survey }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
