const express = require('express');
const router = express.Router();
const Quotation = require('../models/Quotation');
const SiteSurvey = require('../models/SiteSurvey');
const Customer = require('../models/Customer');
const Enquiry = require('../models/Enquiry');
const { protect, authorize } = require('../middleware/auth');

// Helper to auto-calculate Bill of Materials (BOM) based on kW capacity & system type
const calculateBOM = (capacityKw, systemType) => {
  const panelWattage = 540; // 540W Monocrystalline PERC Half-Cut
  const panelCount = Math.ceil((capacityKw * 1000) / panelWattage);
  const panelUnitPrice = 11500; // ~₹21.3/watt
  const panelTotal = panelCount * panelUnitPrice;

  let inverterName = `${capacityKw}kW Solar Grid-Tie Smart Inverter`;
  let inverterPrice = 28000 + (capacityKw - 1) * 7000;
  if (systemType === 'off_grid' || systemType === 'hybrid') {
    inverterName = `${capacityKw}kW Solar Hybrid Inverter with MPPT & Battery Charger`;
    inverterPrice = 42000 + (capacityKw - 1) * 9500;
  }

  const bom = [
    {
      category: 'panel',
      itemName: '540W Monocrystalline PERC Solar Panel',
      specs: '540W, 24V, Tier-1 Mono PERC, 21.3% Efficiency',
      quantity: panelCount,
      unit: 'pcs',
      unitPrice: panelUnitPrice,
      totalPrice: panelTotal
    },
    {
      category: 'inverter',
      itemName: inverterName,
      specs: `${capacityKw}kW rating, Dual MPPT, WiFi Remote Monitoring, IP65`,
      quantity: 1,
      unit: 'pcs',
      unitPrice: inverterPrice,
      totalPrice: inverterPrice
    },
    {
      category: 'structure',
      itemName: 'Hot Dip Galvanized Elevating Module Mounting Structure',
      specs: 'HDG 80 Micron, Wind Resistance 160 km/h, Rust-proof Hardware',
      quantity: capacityKw,
      unit: 'kW set',
      unitPrice: 4200,
      totalPrice: capacityKw * 4200
    },
    {
      category: 'cables',
      itemName: '4 sq mm TUV Certified Copper Solar DC Cable (Red & Black)',
      specs: 'UV Resistant, Double Insulated, Cross-linked Polyolefin',
      quantity: capacityKw * 30,
      unit: 'meters',
      unitPrice: 65,
      totalPrice: capacityKw * 30 * 65
    },
    {
      category: 'accessories',
      itemName: 'ACDB & DCDB Distribution Protection Enclosures',
      specs: 'With Type II Surge Protection Device (SPD) & MCB/Fuses',
      quantity: 1,
      unit: 'set',
      unitPrice: 7500,
      totalPrice: 7500
    },
    {
      category: 'accessories',
      itemName: 'Chemical Earthing Pit & Copper Bonded Electrodes',
      specs: 'Dual Pit (Inverter & Structure Earthing) with BFC Compound',
      quantity: 2,
      unit: 'pits',
      unitPrice: 3800,
      totalPrice: 7600
    }
  ];

  // If Off-Grid or Hybrid: calculate LiFePO4 / Gel battery bank
  if (systemType === 'off_grid' || systemType === 'hybrid') {
    const batteryCount = capacityKw <= 3 ? 1 : 2;
    const batteryUnitPrice = 58000;
    bom.push({
      category: 'battery',
      itemName: '48V 100Ah LiFePO4 Solar Lithium Battery Storage',
      specs: '5.12 kWh usable storage, 6000 cycles @ 80% DOD, Built-in Smart BMS',
      quantity: batteryCount,
      unit: 'units',
      unitPrice: batteryUnitPrice,
      totalPrice: batteryCount * batteryUnitPrice
    });
  }

  const equipmentTotal = bom.reduce((sum, item) => sum + item.totalPrice, 0);
  const installationLabour = capacityKw * 5000 + 3500;
  const transportAndLiaison = 4500;
  const grossTotal = equipmentTotal + installationLabour + transportAndLiaison;

  // Government Subsidy Calculation (PM Surya Ghar scheme)
  let estimatedSubsidy = 0;
  if (systemType === 'on_grid') {
    if (capacityKw === 1) estimatedSubsidy = 30000;
    else if (capacityKw === 2) estimatedSubsidy = 60000;
    else if (capacityKw >= 3) estimatedSubsidy = 78000; // max cap
  }

  const netPayable = Math.max(0, grossTotal - estimatedSubsidy);

  return {
    bom,
    pricing: {
      equipmentTotal,
      installationLabour,
      transportAndLiaison,
      grossTotal,
      estimatedSubsidy,
      netPayable
    }
  };
};

// @route   GET /api/quotations
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

    const quotations = await Quotation.find(query)
      .populate('customer', 'name customerCode phone email installationAddress')
      .populate('siteSurvey', 'surveyNumber status roofDetails')
      .sort({ createdAt: -1 });

    res.json({ success: true, count: quotations.length, data: quotations });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   GET /api/quotations/:id
router.get('/:id', protect, async (req, res) => {
  try {
    const quotation = await Quotation.findById(req.params.id)
      .populate('customer')
      .populate({
        path: 'siteSurvey',
        populate: { path: 'surveyor', select: 'name email phone' }
      })
      .populate('createdBy', 'name email');

    if (!quotation) {
      return res.status(404).json({ success: false, message: 'Quotation not found' });
    }

    if (req.user.role === 'customer' && quotation.customer?.user?.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    res.json({ success: true, data: quotation });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   POST /api/quotations
// Enforces Rule 1: Quotation can only be generated after site survey is approved!
// Enforces Rule 2: Required equipment is calculated from approved quotation.
router.post('/', protect, authorize('admin', 'sales'), async (req, res) => {
  try {
    const { siteSurveyId, customerId, systemCapacityKw, systemType, customBOM, notes } = req.body;

    if (!siteSurveyId) {
      return res.status(400).json({
        success: false,
        message: 'A site survey ID is required to generate a quotation'
      });
    }

    const survey = await SiteSurvey.findById(siteSurveyId);
    if (!survey) {
      return res.status(404).json({ success: false, message: 'Referenced Site Survey not found' });
    }

    // CRITICAL BUSINESS RULE 1:
    if (survey.status !== 'approved' && !survey.approvalDetails?.isApproved) {
      return res.status(400).json({
        success: false,
        message: 'Validation Error: Quotation can ONLY be generated after the site survey is approved by technical leadership.'
      });
    }

    const capacity = Number(systemCapacityKw) || survey.approvalDetails?.recommendedCapacityKw || 3;
    const type = systemType || survey.approvalDetails?.recommendedSystemType || 'on_grid';

    // Auto-calculate Bill of Materials and Pricing
    const calculated = calculateBOM(capacity, type);
    const bom = customBOM && customBOM.length > 0 ? customBOM : calculated.bom;
    const pricing = customBOM ? req.body.pricing : calculated.pricing;

    const count = await Quotation.countDocuments();
    const quotationNumber = `QUOT-2026-${String(count + 1).padStart(4, '0')}`;

    const quotation = await Quotation.create({
      quotationNumber,
      siteSurvey: survey._id,
      customer: customerId || survey.customer,
      systemCapacityKw: capacity,
      systemType: type,
      bom,
      pricing,
      notes: notes || `Generated based on approved site survey ${survey.surveyNumber}`,
      createdBy: req.user.id,
      status: 'sent'
    });

    res.status(201).json({
      success: true,
      message: 'Quotation generated and calculated successfully',
      data: quotation
    });
  } catch (error) {
    console.error('Quotation error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   POST /api/quotations/calculate-preview
// Utility endpoint for sales to calculate equipment and price before finalizing
router.post('/calculate-preview', protect, (req, res) => {
  const { capacityKw, systemType } = req.body;
  const result = calculateBOM(Number(capacityKw) || 3, systemType || 'on_grid');
  res.json({ success: true, data: result });
});

// @route   POST /api/quotations/:id/approve
router.post('/:id/approve', protect, async (req, res) => {
  try {
    const quotation = await Quotation.findById(req.params.id);
    if (!quotation) {
      return res.status(404).json({ success: false, message: 'Quotation not found' });
    }

    quotation.status = 'approved';
    quotation.approvedAt = new Date();
    await quotation.save();

    res.json({ success: true, message: 'Quotation approved', data: quotation });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
