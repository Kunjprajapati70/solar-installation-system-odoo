const express = require('express');
const router = express.Router();
const QRCode = require('qrcode');
const Equipment = require('../models/Equipment');
const Inventory = require('../models/Inventory');
const Customer = require('../models/Customer');
const Order = require('../models/Order');
const Warranty = require('../models/Warranty');
const { protect, authorize } = require('../middleware/auth');

// Helper to generate QR code data URL
const generateQRDataUrl = async (payload) => {
  try {
    return await QRCode.toDataURL(JSON.stringify(payload), {
      errorCorrectionLevel: 'H',
      margin: 2,
      width: 256,
      color: {
        dark: '#0f172a',
        light: '#ffffff'
      }
    });
  } catch (err) {
    console.error('QR generation error:', err);
    return null;
  }
};

// @route   GET /api/equipment
router.get('/', protect, async (req, res) => {
  try {
    const { category, status, search, customerId, orderId } = req.query;
    let query = {};

    if (category) query.category = category;
    if (status) query.status = status;
    if (customerId) query.installedAtCustomer = customerId;
    if (orderId) query.allocatedToOrder = orderId;

    if (search) {
      query.$or = [
        { serialNumber: { $regex: search, $options: 'i' } },
        { brand: { $regex: search, $options: 'i' } },
        { model: { $regex: search, $options: 'i' } }
      ];
    }

    // If customer, only show their installed equipment
    if (req.user.role === 'customer') {
      const customer = await Customer.findOne({ user: req.user.id });
      if (!customer) return res.json({ success: true, count: 0, data: [] });
      query.installedAtCustomer = customer._id;
    }

    const equipment = await Equipment.find(query)
      .populate('inventoryItem', 'name itemCode specifications unitCostPrice unitSellingPrice')
      .populate('installedAtCustomer', 'name customerCode installationAddress phone')
      .populate('allocatedToOrder', 'orderNumber orderStatus')
      .sort({ createdAt: -1 });

    res.json({ success: true, count: equipment.length, data: equipment });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   GET /api/equipment/lookup/:serial
// Serial number lookup with fallback support (QR scan or manual input)
router.get('/lookup/:serial', protect, async (req, res) => {
  try {
    const serial = req.params.serial.toUpperCase().trim();
    const item = await Equipment.findOne({ serialNumber: serial })
      .populate('inventoryItem')
      .populate('installedAtCustomer')
      .populate('allocatedToOrder');

    if (!item) {
      return res.status(404).json({
        success: false,
        message: `Equipment with serial number '${serial}' was not found in the system.`
      });
    }

    // Also look up warranty if active or exists
    const warranty = await Warranty.findOne({ serialNumber: serial });

    res.json({
      success: true,
      data: {
        equipment: item,
        warranty
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   POST /api/equipment/generate
// Generates single or batch serialized equipment with unique QR codes
router.post('/generate', protect, authorize('admin'), async (req, res) => {
  try {
    const { inventoryItemId, quantity = 1, category, brand, model, specifications } = req.body;

    const inv = inventoryItemId ? await Inventory.findById(inventoryItemId) : null;
    const cat = category || inv?.category || 'panel';
    const b = brand || inv?.brand || 'SunPower High-Yield';
    const m = model || inv?.model || 'SP-540-PRO';
    const specs = specifications || inv?.specifications || { wattage: 540, warrantyYears: 25 };

    const prefixMap = {
      panel: 'SP-PNL',
      inverter: 'SP-INV',
      battery: 'SP-BAT',
      structure: 'SP-STR'
    };
    const prefix = prefixMap[cat] || 'SP-EQP';
    const year = new Date().getFullYear();

    const createdList = [];
    const countExisting = await Equipment.countDocuments({ category: cat });

    for (let i = 1; i <= Number(quantity); i++) {
      const serialNumber = `${prefix}-${year}-${String(countExisting + i).padStart(5, '0')}`;
      const qrPayload = {
        serialNumber,
        category: cat,
        brand: b,
        model: m,
        specs,
        systemProvider: 'SunPower Solutions',
        verificationUrl: `https://sunpowersolutions.com/verify/${serialNumber}`
      };

      const qrCodeImage = await generateQRDataUrl(qrPayload);

      const equipment = await Equipment.create({
        serialNumber,
        qrCodeData: JSON.stringify(qrPayload),
        qrCodeImage,
        category: cat,
        inventoryItem: inv ? inv._id : null,
        brand: b,
        model: m,
        specifications: specs,
        status: 'in_stock',
        movementHistory: [
          {
            action: 'CREATED_AND_SERIALIZED',
            performedBy: req.user.id,
            performedByName: req.user.name,
            notes: 'Generated into active stock with QR badge',
            toStatus: 'in_stock',
            location: 'Central Solar Warehouse'
          }
        ]
      });

      createdList.push(equipment);
    }

    // Increment inventory current stock
    if (inv) {
      inv.currentStock += Number(quantity);
      inv.availableStock = Math.max(0, inv.currentStock - inv.reservedStock);
      await inv.save();
    }

    res.status(201).json({
      success: true,
      message: `Successfully generated ${createdList.length} serialized equipment with QR codes`,
      data: createdList
    });
  } catch (error) {
    console.error('Equipment generate error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   POST /api/equipment/:id/movement
// Logs movement history (e.g. In Stock -> Dispatched -> Installed -> Under Service)
router.post('/:id/movement', protect, async (req, res) => {
  try {
    const { action, toStatus, notes, location } = req.body;
    const item = await Equipment.findById(req.params.id);
    if (!item) return res.status(404).json({ success: false, message: 'Equipment not found' });

    const fromStatus = item.status;
    if (toStatus) item.status = toStatus;

    item.movementHistory.push({
      action: action || 'STATUS_UPDATE',
      timestamp: new Date(),
      performedBy: req.user.id,
      performedByName: req.user.name,
      notes,
      fromStatus,
      toStatus: toStatus || fromStatus,
      location: location || 'Site'
    });

    await item.save();

    res.json({ success: true, message: 'Movement history recorded', data: item });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
