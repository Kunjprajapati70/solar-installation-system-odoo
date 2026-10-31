const express = require('express');
const router = express.Router();
const Order = require('../models/Order');
const Quotation = require('../models/Quotation');
const Inventory = require('../models/Inventory');
const Equipment = require('../models/Equipment');
const Installation = require('../models/Installation');
const Warranty = require('../models/Warranty');
const Customer = require('../models/Customer');
const { protect, authorize } = require('../middleware/auth');

// @route   GET /api/orders
router.get('/', protect, async (req, res) => {
  try {
    let query = {};
    if (req.user.role === 'customer') {
      const customer = await Customer.findOne({ user: req.user.id });
      if (!customer) return res.json({ success: true, count: 0, data: [] });
      query.customer = customer._id;
    }

    const { status, paymentStatus } = req.query;
    if (status) query.orderStatus = status;
    if (paymentStatus) query.paymentStatus = paymentStatus;

    const orders = await Order.find(query)
      .populate('customer', 'name customerCode phone email installationAddress')
      .populate('quotation', 'quotationNumber systemCapacityKw systemType pricing')
      .populate('installation', 'installationNumber status leadTechnician')
      .sort({ createdAt: -1 });

    res.json({ success: true, count: orders.length, data: orders });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   GET /api/orders/:id
router.get('/:id', protect, async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('customer')
      .populate('quotation')
      .populate({
        path: 'allocatedEquipment.equipment',
        model: 'Equipment'
      })
      .populate({
        path: 'installation',
        populate: { path: 'leadTechnician', select: 'name phone email' }
      });

    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    if (req.user.role === 'customer' && order.customer?.user?.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    res.json({ success: true, data: order });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   POST /api/orders
// Converts approved quotation into an active order
router.post('/', protect, authorize('admin', 'sales'), async (req, res) => {
  try {
    const { quotationId, advancePaid, notes } = req.body;

    const quotation = await Quotation.findById(quotationId);
    if (!quotation) {
      return res.status(404).json({ success: false, message: 'Quotation not found' });
    }

    if (quotation.status !== 'approved') {
      return res.status(400).json({
        success: false,
        message: 'Order can only be created from an approved quotation'
      });
    }

    const count = await Order.countDocuments();
    const orderNumber = `ORD-2026-${String(count + 1).padStart(4, '0')}`;

    const totalAmount = quotation.pricing.netPayable;
    const advanceRequired = Math.round(totalAmount * (quotation.paymentTerms?.advancePercent || 30) / 100);
    const actualAdvance = Number(advancePaid) || advanceRequired;
    const balanceAmount = Math.max(0, totalAmount - actualAdvance);

    const initialMilestones = [
      { stageName: 'Order Confirmed & Advance Received', status: 'completed', completedAt: new Date(), remarks: 'Initial order placed' },
      { stageName: 'Inventory Stock Verification', status: 'pending' },
      { stageName: 'Equipment Allocation & Serial Assignment', status: 'pending' },
      { stageName: 'Dispatch to Site', status: 'pending' },
      { stageName: 'Rooftop Installation & Wiring', status: 'pending' },
      { stageName: 'Testing & Inverter Grid-Sync', status: 'pending' },
      { stageName: 'Customer Acceptance & Delivery Confirmed', status: 'pending' },
      { stageName: 'Net Metering & Subsidy Claim', status: 'pending' }
    ];

    const order = await Order.create({
      orderNumber,
      quotation: quotation._id,
      customer: quotation.customer,
      systemCapacityKw: quotation.systemCapacityKw,
      systemType: quotation.systemType,
      totalAmount,
      advanceRequired,
      advancePaid: actualAdvance,
      balanceAmount,
      paymentStatus: actualAdvance >= totalAmount ? 'fully_paid' : actualAdvance > 0 ? 'advance_paid' : 'pending',
      orderStatus: 'confirmed',
      milestones: initialMilestones
    });

    res.status(201).json({
      success: true,
      message: 'Order confirmed successfully',
      data: order
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   POST /api/orders/:id/stock-check
// Enforces Rule 8: Stock must be checked before equipment dispatch
router.post('/:id/stock-check', protect, authorize('admin', 'sales'), async (req, res) => {
  try {
    const order = await Order.findById(req.params.id).populate('quotation');
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });

    const bom = order.quotation.bom;
    const stockReport = [];
    let allInStock = true;

    for (const item of bom) {
      // Find matching inventory
      const invItem = await Inventory.findOne({
        category: item.category,
        availableStock: { $gte: 0 }
      });

      const available = invItem ? invItem.availableStock : 0;
      const isAvailable = available >= item.quantity;
      if (!isAvailable) allInStock = false;

      stockReport.push({
        category: item.category,
        itemName: item.itemName,
        requiredQty: item.quantity,
        availableQty: available,
        status: isAvailable ? 'sufficient' : 'shortage'
      });
    }

    if (allInStock) {
      order.orderStatus = 'stock_checked';
      const mIdx = order.milestones.findIndex(m => m.stageName.includes('Inventory Stock'));
      if (mIdx !== -1) {
        order.milestones[mIdx].status = 'completed';
        order.milestones[mIdx].completedAt = new Date();
      }
      await order.save();
    }

    res.json({
      success: true,
      allInStock,
      message: allInStock ? 'Stock verification passed. Ready for equipment allocation.' : 'Stock shortage detected for some components.',
      stockReport
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   POST /api/orders/:id/dispatch
// Enforces Rule 3: Dispatch must record the unique serial numbers of applicable equipment
router.post('/:id/dispatch', protect, authorize('admin', 'sales'), async (req, res) => {
  try {
    const { serialNumbers } = req.body; // Array of serial numbers
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });

    if (!serialNumbers || !Array.isArray(serialNumbers) || serialNumbers.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Dispatch Error: At least one unique equipment serial number must be recorded for dispatch.'
      });
    }

    // Verify and update each equipment serial number
    const allocated = [];
    for (const serial of serialNumbers) {
      const eq = await Equipment.findOne({ serialNumber: serial.toUpperCase().trim() });
      if (!eq) {
        return res.status(400).json({
          success: false,
          message: `Equipment with serial number ${serial} was not found in inventory`
        });
      }

      if (eq.status === 'dispatched' || eq.status === 'installed') {
        return res.status(400).json({
          success: false,
          message: `Equipment ${serial} is already ${eq.status} to another site`
        });
      }

      eq.status = 'dispatched';
      eq.allocatedToOrder = order._id;
      eq.installedAtCustomer = order.customer;
      eq.dispatchedAt = new Date();
      eq.movementHistory.push({
        action: 'DISPATCHED_TO_SITE',
        performedBy: req.user.id,
        performedByName: req.user.name,
        notes: `Dispatched for Order ${order.orderNumber}`,
        fromStatus: eq.status,
        toStatus: 'dispatched',
        location: 'Customer Installation Site'
      });
      await eq.save();

      allocated.push({
        equipment: eq._id,
        serialNumber: eq.serialNumber,
        category: eq.category,
        brand: eq.brand,
        model: eq.model
      });
    }

    order.allocatedEquipment = allocated;
    order.orderStatus = 'dispatched';
    order.dispatchedAt = new Date();

    const mIdx = order.milestones.findIndex(m => m.stageName.includes('Dispatch to Site'));
    if (mIdx !== -1) {
      order.milestones[mIdx].status = 'completed';
      order.milestones[mIdx].completedAt = new Date();
    }
    await order.save();

    res.json({
      success: true,
      message: `Equipment dispatch verified. ${allocated.length} serial numbers recorded.`,
      data: order
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   POST /api/orders/:id/confirm-delivery
// Enforces Rule 5: Warranty begins ONLY after confirmed delivery!
router.post('/:id/confirm-delivery', protect, authorize('admin', 'sales', 'technician'), async (req, res) => {
  try {
    const order = await Order.findById(req.params.id).populate('allocatedEquipment.equipment');
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });

    order.orderStatus = 'delivery_confirmed';
    order.deliveryConfirmedAt = new Date();
    order.deliveryConfirmedBy = req.user.id;
    order.deliveryAcceptanceNotes = req.body.notes || 'Rooftop solar installation handed over and commissioned successfully.';

    const mIdx = order.milestones.findIndex(m => m.stageName.includes('Delivery Confirmed'));
    if (mIdx !== -1) {
      order.milestones[mIdx].status = 'completed';
      order.milestones[mIdx].completedAt = new Date();
    }

    await order.save();

    // AUTOMATIC WARRANTY ACTIVATION FOR ALL ALLOCATED SERIALIZED EQUIPMENT (Rule 5)
    const categoryWarrantyYears = {
      panel: 25,
      inverter: 5,
      battery: 3,
      structure: 10
    };

    const createdWarranties = [];
    const startDate = order.deliveryConfirmedAt;

    for (const alloc of order.allocatedEquipment) {
      const durationYears = categoryWarrantyYears[alloc.category] || 5;
      const expiryDate = new Date(startDate.getTime());
      expiryDate.setFullYear(expiryDate.getFullYear() + durationYears);

      const certCount = await Warranty.countDocuments();
      const certificateNumber = `WAR-2026-${String(certCount + 1).padStart(5, '0')}`;

      // Mark equipment as installed
      await Equipment.findByIdAndUpdate(alloc.equipment, {
        status: 'installed',
        installedAt: new Date(),
        $push: {
          movementHistory: {
            action: 'INSTALLED_AND_COMMISSIONED',
            performedBy: req.user.id,
            performedByName: req.user.name,
            notes: 'Handover complete. Warranty initiated.',
            fromStatus: 'dispatched',
            toStatus: 'installed'
          }
        }
      });

      // Create Warranty
      const warranty = await Warranty.create({
        certificateNumber,
        equipment: alloc.equipment,
        serialNumber: alloc.serialNumber,
        customer: order.customer,
        order: order._id,
        category: alloc.category,
        brand: alloc.brand,
        model: alloc.model,
        durationYears,
        startDate,
        expiryDate,
        status: 'active'
      });

      createdWarranties.push(warranty);
    }

    res.json({
      success: true,
      message: `Delivery confirmed! Warranty officially activated for ${createdWarranties.length} equipment units starting today.`,
      order,
      activatedWarranties: createdWarranties
    });
  } catch (error) {
    console.error('Delivery confirmation error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
