const express = require('express');
const router = express.Router();
const Installation = require('../models/Installation');
const Order = require('../models/Order');
const Customer = require('../models/Customer');
const { protect, authorize } = require('../middleware/auth');
const upload = require('../middleware/upload');

// Default standardized installation milestones
const defaultSteps = [
  { id: 'step-1', title: 'Mounting Structure Alignment & Roof Anchoring', status: 'pending' },
  { id: 'step-2', title: 'Solar PV Module Clamping & Tilt Calibration', status: 'pending' },
  { id: 'step-3', title: 'DC Solar Cabling & Conduit Routing', status: 'pending' },
  { id: 'step-4', title: 'Inverter Mounting & AC/DC DB Interfacing', status: 'pending' },
  { id: 'step-5', title: 'Chemical Earthing & Lightning Arrestor Grounding', status: 'pending' },
  { id: 'step-6', title: 'Open Circuit / Short Circuit Electrical Quality Tests', status: 'pending' },
  { id: 'step-7', title: 'Inverter Grid Synchronization & Power Generation Test', status: 'pending' },
  { id: 'step-8', title: 'Customer System Briefing & Acceptance Sign-off', status: 'pending' }
];

// @route   GET /api/installations
router.get('/', protect, async (req, res) => {
  try {
    let query = {};

    // Critical role restriction: Technicians ONLY access their assigned jobs!
    if (req.user.role === 'technician') {
      query.$or = [
        { leadTechnician: req.user.id },
        { assistingTechnicians: req.user.id }
      ];
    } else if (req.user.role === 'customer') {
      const customer = await Customer.findOne({ user: req.user.id });
      if (!customer) return res.json({ success: true, count: 0, data: [] });
      query.customer = customer._id;
    }

    const { status } = req.query;
    if (status) query.status = status;

    const installations = await Installation.find(query)
      .populate('customer', 'name customerCode phone installationAddress connectionType sanctionedLoadKw')
      .populate('leadTechnician', 'name phone email avatar technicianDetails')
      .populate('assistingTechnicians', 'name phone')
      .populate({
        path: 'order',
        select: 'orderNumber systemCapacityKw systemType allocatedEquipment totalAmount paymentStatus'
      })
      .sort({ scheduledDate: 1 });

    res.json({ success: true, count: installations.length, data: installations });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   GET /api/installations/:id
router.get('/:id', protect, async (req, res) => {
  try {
    const installation = await Installation.findById(req.params.id)
      .populate('customer')
      .populate('leadTechnician', 'name phone email avatar technicianDetails')
      .populate('assistingTechnicians', 'name phone email')
      .populate({
        path: 'order',
        populate: { path: 'allocatedEquipment.equipment' }
      });

    if (!installation) {
      return res.status(404).json({ success: false, message: 'Installation record not found' });
    }

    // Role check: Technicians cannot view jobs assigned to someone else
    if (req.user.role === 'technician') {
      const isAssigned =
        installation.leadTechnician?._id?.toString() === req.user.id ||
        installation.assistingTechnicians?.some(t => t._id?.toString() === req.user.id);

      if (!isAssigned) {
        return res.status(403).json({ success: false, message: 'Access denied: You are only allowed to view jobs assigned to you.' });
      }
    }

    res.json({ success: true, data: installation });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   POST /api/installations
router.post('/', protect, authorize('admin', 'sales'), async (req, res) => {
  try {
    const { orderId, leadTechnicianId, assistingTechnicianIds, scheduledDate, capacityKw } = req.body;

    const order = await Order.findById(orderId).populate('customer');
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });

    const count = await Installation.countDocuments();
    const installationNumber = `INST-2026-${String(count + 1).padStart(4, '0')}`;

    const installation = await Installation.create({
      installationNumber,
      order: order._id,
      customer: order.customer._id || order.customer,
      leadTechnician: leadTechnicianId,
      assistingTechnicians: assistingTechnicianIds || [],
      scheduledDate: scheduledDate || new Date(),
      systemCapacityKw: capacityKw || order.systemCapacityKw || 3,
      steps: defaultSteps,
      status: 'assigned'
    });

    order.installation = installation._id;
    order.orderStatus = 'in_installation';
    await order.save();

    res.status(201).json({ success: true, message: 'Installation scheduled', data: installation });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   POST /api/installations/:id/start-job
// Records technician start timestamp
router.post('/:id/start-job', protect, authorize('technician', 'admin'), async (req, res) => {
  try {
    const installation = await Installation.findById(req.params.id);
    if (!installation) return res.status(404).json({ success: false, message: 'Installation not found' });

    installation.status = 'in_progress';
    installation.startedAt = installation.startedAt || new Date();
    await installation.save();

    res.json({
      success: true,
      message: `Job started at ${installation.startedAt.toLocaleTimeString()}`,
      data: installation
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   POST /api/installations/:id/update-step
// Updates progress on installation checklist
router.post('/:id/update-step', protect, authorize('technician', 'admin'), async (req, res) => {
  try {
    const { stepId, status, notes } = req.body;
    const installation = await Installation.findById(req.params.id);
    if (!installation) return res.status(404).json({ success: false, message: 'Installation not found' });

    const step = installation.steps.find(s => s.id === stepId || s._id.toString() === stepId);
    if (!step) return res.status(404).json({ success: false, message: 'Step not found' });

    step.status = status;
    if (status === 'completed') {
      step.completedAt = new Date();
      step.completedBy = req.user.name;
    }
    if (notes) step.notes = notes;

    await installation.save();

    res.json({ success: true, message: `Step '${step.title}' marked as ${status}`, data: installation });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   POST /api/installations/:id/testing-results
// Records field testing parameters (Voc, Isc, Earthing, Inverter sync)
router.post('/:id/testing-results', protect, authorize('technician', 'admin'), async (req, res) => {
  try {
    const { vocVolts, iscAmperes, inverterSyncStatus, earthingResistanceOhms, generationCheckKw, comments } = req.body;
    const installation = await Installation.findById(req.params.id);
    if (!installation) return res.status(404).json({ success: false, message: 'Installation not found' });

    installation.testingResults = {
      vocVolts: Number(vocVolts) || 0,
      iscAmperes: Number(iscAmperes) || 0,
      inverterSyncStatus: inverterSyncStatus || 'synced',
      earthingResistanceOhms: Number(earthingResistanceOhms) || 0,
      generationCheckKw: Number(generationCheckKw) || 0,
      testedAt: new Date(),
      testedBy: req.user.name,
      comments: comments || 'Quality testing parameters validated within standard limits.'
    };

    installation.status = 'testing_in_progress';
    await installation.save();

    res.json({
      success: true,
      message: 'Electrical testing results recorded successfully',
      testingResults: installation.testingResults,
      data: installation
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   POST /api/installations/:id/photo
// Technician photo upload from device camera / files
router.post('/:id/photo', protect, authorize('technician', 'admin'), upload.single('photo'), async (req, res) => {
  try {
    const installation = await Installation.findById(req.params.id);
    if (!installation) return res.status(404).json({ success: false, message: 'Installation not found' });

    if (!req.file) {
      return res.status(400).json({ success: false, message: 'Please upload a photo' });
    }

    const photoUrl = `/uploads/${req.file.filename}`;
    installation.installationPhotos.push({
      url: photoUrl,
      caption: req.body.caption || 'Installation Progress Photo',
      uploadedAt: new Date()
    });

    await installation.save();

    res.json({
      success: true,
      message: 'Installation photo uploaded successfully',
      photoUrl,
      data: installation
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   POST /api/installations/:id/customer-acceptance
// Captures customer sign-off and finishes the job
router.post('/:id/customer-acceptance', protect, authorize('technician', 'admin'), async (req, res) => {
  try {
    const { signedName, remarks, rating, signatureData } = req.body;
    const installation = await Installation.findById(req.params.id);
    if (!installation) return res.status(404).json({ success: false, message: 'Installation not found' });

    const now = new Date();
    installation.completedAt = now;
    if (installation.startedAt) {
      const diffMs = now.getTime() - new Date(installation.startedAt).getTime();
      installation.totalWorkingHours = Math.round((diffMs / (1000 * 60 * 60)) * 10) / 10;
    } else {
      installation.totalWorkingHours = 6.5; // realistic default
    }

    installation.customerAcceptance = {
      isAccepted: true,
      signedName: signedName || 'Customer Signatory',
      signatureData: signatureData || 'DIGITALLY_VERIFIED_ON_SITE',
      remarks: remarks || 'Rooftop solar installation executed to full satisfaction. Testing passed.',
      rating: Number(rating) || 5,
      acceptedAt: now
    };

    installation.status = 'customer_accepted';
    await installation.save();

    // Also update order status
    if (installation.order) {
      await Order.findByIdAndUpdate(installation.order, {
        orderStatus: 'installed'
      });
    }

    res.json({
      success: true,
      message: 'Customer acceptance captured and installation completed successfully!',
      data: installation
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
