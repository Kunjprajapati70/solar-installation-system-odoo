const express = require('express');
const router = express.Router();
const SiteSurvey = require('../models/SiteSurvey');
const Enquiry = require('../models/Enquiry');
const { protect, authorize } = require('../middleware/auth');
const upload = require('../middleware/upload');

// @route   GET /api/surveys
router.get('/', protect, async (req, res) => {
  try {
    let query = {};

    // If technician/surveyor is logged in and not admin/sales
    if (req.user.role === 'technician') {
      query.surveyor = req.user.id;
    }

    const { status } = req.query;
    if (status) query.status = status;

    const surveys = await SiteSurvey.find(query)
      .populate('customer', 'name customerCode phone installationAddress')
      .populate('enquiry', 'enquiryNumber proposedCapacityKw customerName')
      .populate('surveyor', 'name email phone')
      .populate('approvalDetails.approvedBy', 'name role')
      .sort({ createdAt: -1 });

    res.json({ success: true, count: surveys.length, data: surveys });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   GET /api/surveys/:id
router.get('/:id', protect, async (req, res) => {
  try {
    const survey = await SiteSurvey.findById(req.params.id)
      .populate('customer')
      .populate('enquiry')
      .populate('surveyor', 'name email phone')
      .populate('approvalDetails.approvedBy', 'name role');

    if (!survey) {
      return res.status(404).json({ success: false, message: 'Site Survey not found' });
    }

    res.json({ success: true, data: survey });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   POST /api/surveys
router.post('/', protect, authorize('admin', 'sales'), async (req, res) => {
  try {
    const count = await SiteSurvey.countDocuments();
    const surveyNumber = `SURV-2026-${String(count + 1).padStart(4, '0')}`;

    const survey = await SiteSurvey.create({
      ...req.body,
      surveyNumber
    });

    res.status(201).json({ success: true, data: survey });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   PUT /api/surveys/:id
router.put('/:id', protect, async (req, res) => {
  try {
    const survey = await SiteSurvey.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });

    if (!survey) {
      return res.status(404).json({ success: false, message: 'Site Survey not found' });
    }

    res.json({ success: true, data: survey });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   POST /api/surveys/:id/approve
// Enforces approval workflow required before quotation creation
router.post('/:id/approve', protect, authorize('admin', 'sales'), async (req, res) => {
  try {
    const survey = await SiteSurvey.findById(req.params.id);
    if (!survey) {
      return res.status(404).json({ success: false, message: 'Site Survey not found' });
    }

    const { recommendedCapacityKw, recommendedSystemType, approvalNotes } = req.body;

    survey.status = 'approved';
    survey.approvalDetails = {
      isApproved: true,
      approvedBy: req.user.id,
      approvedAt: new Date(),
      approvalNotes: approvalNotes || 'Roof and electrical parameters verified. Approved for quotation.',
      recommendedCapacityKw: recommendedCapacityKw || survey.enquiry?.proposedCapacityKw || 3,
      recommendedSystemType: recommendedSystemType || 'on_grid'
    };

    await survey.save();

    // Also update Enquiry status
    if (survey.enquiry) {
      await Enquiry.findByIdAndUpdate(survey.enquiry, { status: 'survey_completed' });
    }

    res.json({
      success: true,
      message: 'Site Survey successfully approved. Quotation generation is now unlocked.',
      data: survey
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   POST /api/surveys/:id/reject
router.post('/:id/reject', protect, authorize('admin', 'sales'), async (req, res) => {
  try {
    const survey = await SiteSurvey.findById(req.params.id);
    if (!survey) {
      return res.status(404).json({ success: false, message: 'Site Survey not found' });
    }

    survey.status = 'rejected';
    survey.approvalDetails = {
      isApproved: false,
      approvedBy: req.user.id,
      approvedAt: new Date(),
      approvalNotes: req.body.reason || 'Roof structural integrity insufficient or severe shading detected.'
    };

    await survey.save();

    res.json({ success: true, message: 'Site Survey marked as rejected', data: survey });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   POST /api/surveys/:id/photo
router.post('/:id/photo', protect, upload.single('photo'), async (req, res) => {
  try {
    const survey = await SiteSurvey.findById(req.params.id);
    if (!survey) {
      return res.status(404).json({ success: false, message: 'Site Survey not found' });
    }

    if (!req.file) {
      return res.status(400).json({ success: false, message: 'Please upload a photo file' });
    }

    const photoUrl = `/uploads/${req.file.filename}`;
    survey.photos.push({
      url: photoUrl,
      caption: req.body.caption || 'Site Survey Roof Photo',
      uploadedAt: new Date()
    });

    await survey.save();

    res.json({ success: true, message: 'Photo uploaded successfully', photoUrl, data: survey });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
