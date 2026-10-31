const Inventory = require('../../models/Inventory');
const ApiResponse = require('../utils/apiResponse');

class InventoryController {
  /**
   * GET /api/inventory
   */
  static async listInventory(req, res, next) {
    try {
      const { category, search, page = 1, limit = 50 } = req.query;
      const query = {};

      if (category) query.category = category;
      if (search) {
        query.$or = [
          { name: { $regex: search, $options: 'i' } },
          { itemCode: { $regex: search, $options: 'i' } },
          { brand: { $regex: search, $options: 'i' } },
          { model: { $regex: search, $options: 'i' } }
        ];
      }
      if (req.query.lowStock === 'true') {
        query.$expr = { $lte: ['$availableStock', '$reorderLevel'] };
      }

      const skip = (Number(page) - 1) * Number(limit);
      const [items, total] = await Promise.all([
        Inventory.find(query).sort({ name: 1 }).skip(skip).limit(Number(limit)),
        Inventory.countDocuments(query)
      ]);

      return ApiResponse.success(res, items, 'Inventory retrieved', 200, {
        total,
        page: Number(page),
        limit: Number(limit),
        pages: Math.ceil(total / Number(limit))
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/inventory/:id
   */
  static async getById(req, res, next) {
    try {
      const item = await Inventory.findById(req.params.id);
      if (!item) {
        return ApiResponse.notFound(res, 'Inventory SKU not found.');
      }
      return ApiResponse.success(res, item);
    } catch (err) {
      next(err);
    }
  }

  /**
   * POST /api/inventory
   */
  static async createInventory(req, res, next) {
    try {
      const {
        equipmentName,
        category,
        brand,
        model,
        description,
        availableQuantity,
        minimumStock,
        purchasePrice,
        sellingPrice,
        warrantyDurationMonths,
        supplier
      } = req.body;

      const itemName = equipmentName || req.body.name;
      if (!itemName || !category || !brand || !model) {
        return ApiResponse.badRequest(res, 'Equipment name, category, brand, and model are required.');
      }

      const stock = Math.max(0, Number(availableQuantity ?? req.body.currentStock) || 0);
      const item = new Inventory({
        name: itemName,
        category,
        brand,
        model,
        description: description || '',
        currentStock: stock,
        availableStock: stock,
        reservedStock: 0,
        reorderLevel: Math.max(0, Number(minimumStock ?? req.body.reorderLevel) || 5),
        unitCostPrice: Math.max(0, Number(purchasePrice ?? req.body.unitCostPrice) || 0),
        unitSellingPrice: Math.max(0, Number(sellingPrice ?? req.body.unitSellingPrice) || 0),
        specifications: {
          warrantyYears: Math.max(1, Math.round((Number(warrantyDurationMonths) || 24) / 12))
        },
        supplier: typeof supplier === 'string' ? { name: supplier } : (supplier || {})
      });

      await item.save();
      return ApiResponse.created(res, item, 'Inventory SKU created successfully.');
    } catch (err) {
      next(err);
    }
  }

  /**
   * PUT /api/inventory/:id
   * Complete audited edit of inventory SKU fields
   */
  static async updateInventory(req, res, next) {
    try {
      const item = await Inventory.findById(req.params.id);
      if (!item) {
        return ApiResponse.notFound(res, 'Inventory SKU not found.');
      }

      const {
        equipmentName,
        name,
        category,
        brand,
        model,
        description,
        purchasePrice,
        unitCostPrice,
        sellingPrice,
        unitSellingPrice,
        availableQuantity,
        currentStock,
        minimumStock,
        reorderLevel,
        warrantyDurationMonths,
        supplier,
        isActive
      } = req.body;

      const finalName = name || equipmentName;
      if (finalName) {
        item.name = finalName;
        item.equipmentName = finalName;
      }
      if (category) item.category = category;
      if (brand) item.brand = brand;
      if (model) item.model = model;
      if (description !== undefined) item.description = description;

      const finalCost = unitCostPrice !== undefined ? unitCostPrice : purchasePrice;
      if (finalCost !== undefined) {
        item.unitCostPrice = Math.max(0, Number(finalCost));
        item.purchasePrice = item.unitCostPrice;
      }

      const finalSelling = unitSellingPrice !== undefined ? unitSellingPrice : sellingPrice;
      if (finalSelling !== undefined) {
        item.unitSellingPrice = Math.max(0, Number(finalSelling));
        item.sellingPrice = item.unitSellingPrice;
      }

      const finalStock = currentStock !== undefined ? currentStock : availableQuantity;
      if (finalStock !== undefined) {
        item.currentStock = Math.max(0, Number(finalStock));
        item.availableStock = item.currentStock;
        item.availableQuantity = item.currentStock;
      }

      const finalMinStock = reorderLevel !== undefined ? reorderLevel : minimumStock;
      if (finalMinStock !== undefined) {
        item.reorderLevel = Math.max(0, Number(finalMinStock));
        item.minimumStock = item.reorderLevel;
      }

      if (warrantyDurationMonths !== undefined) item.warrantyDurationMonths = Math.max(0, Number(warrantyDurationMonths));
      if (supplier !== undefined) item.supplier = supplier;
      if (isActive !== undefined) item.isActive = Boolean(isActive);

      await item.save();
      return ApiResponse.success(res, item, 'Inventory SKU updated successfully.');
    } catch (err) {
      next(err);
    }
  }

  /**
   * POST /api/inventory/:id/replenish and POST /api/inventory/:id/restock
   */
  static async replenishStock(req, res, next) {
    try {
      const { quantity } = req.body;
      const count = Number(quantity);
      if (!count || count <= 0) {
        return ApiResponse.badRequest(res, 'Replenishment quantity must be a positive number.');
      }

      const item = await Inventory.findById(req.params.id);
      if (!item) {
        return ApiResponse.notFound(res, 'Inventory SKU not found.');
      }
      item.currentStock = Math.max(0, (item.currentStock || 0) + count);
      item.availableStock = Math.max(0, item.currentStock - (item.reservedStock || 0));
      await item.save();

      return ApiResponse.success(res, item, `Successfully replenished ${count} units of ${item.name}.`);
    } catch (err) {
      next(err);
    }
  }
}

module.exports = InventoryController;
