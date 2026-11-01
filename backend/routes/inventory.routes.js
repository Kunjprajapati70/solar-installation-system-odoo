const express = require('express');
const router = express.Router();
const Inventory = require('../models/Inventory');
const Equipment = require('../models/Equipment');
const { protect, authorize } = require('../middleware/auth');

// @route   GET /api/inventory
router.get('/', protect, async (req, res) => {
  try {
    const { category, search, lowStock } = req.query;
    let query = {};

    if (category) query.category = category;
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { brand: { $regex: search, $options: 'i' } },
        { model: { $regex: search, $options: 'i' } },
        { itemCode: { $regex: search, $options: 'i' } }
      ];
    }

    let items = await Inventory.find(query).sort({ category: 1, name: 1 });

    if (lowStock === 'true') {
      items = items.filter(item => item.availableStock <= item.reorderLevel);
    }

    // Attach count of serialized equipment registered under each inventory item
    const enhancedItems = await Promise.all(
      items.map(async (item) => {
        const serializedCount = await Equipment.countDocuments({ inventoryItem: item._id });
        const inStockSerialized = await Equipment.countDocuments({ inventoryItem: item._id, status: 'in_stock' });
        return {
          ...item.toObject(),
          serializedCount,
          inStockSerialized
        };
      })
    );

    res.json({ success: true, count: enhancedItems.length, data: enhancedItems });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   GET /api/inventory/:id
router.get('/:id', protect, async (req, res) => {
  try {
    const item = await Inventory.findById(req.params.id);
    if (!item) return res.status(404).json({ success: false, message: 'Inventory item not found' });

    const equipmentList = await Equipment.find({ inventoryItem: item._id }).sort({ createdAt: -1 });

    res.json({
      success: true,
      data: {
        item,
        equipmentList
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   POST /api/inventory
router.post('/', protect, authorize('admin'), async (req, res) => {
  try {
    const count = await Inventory.countDocuments();
    const prefix = (req.body.category || 'ITEM').substring(0, 3).toUpperCase();
    const itemCode = `INV-${prefix}-${String(count + 1).padStart(4, '0')}`;

    const item = await Inventory.create({
      ...req.body,
      itemCode
    });

    res.status(201).json({ success: true, data: item });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   PUT /api/inventory/:id
router.put('/:id', protect, authorize('admin'), async (req, res) => {
  try {
    const item = await Inventory.findById(req.params.id);
    if (!item) return res.status(404).json({ success: false, message: 'Inventory item not found' });

    Object.assign(item, req.body);
    item.availableStock = Math.max(0, item.currentStock - item.reservedStock);
    await item.save();

    res.json({ success: true, data: item });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   POST /api/inventory/:id/restock
router.post('/:id/restock', protect, authorize('admin'), async (req, res) => {
  try {
    const { quantity } = req.body;
    if (!quantity || quantity <= 0) {
      return res.status(400).json({ success: false, message: 'Valid restock quantity required' });
    }

    const item = await Inventory.findById(req.params.id);
    if (!item) return res.status(404).json({ success: false, message: 'Item not found' });

    item.currentStock += Number(quantity);
    item.availableStock = Math.max(0, item.currentStock - item.reservedStock);
    await item.save();

    res.json({
      success: true,
      message: `Successfully restocked ${quantity} units. Current stock: ${item.currentStock}`,
      data: item
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
