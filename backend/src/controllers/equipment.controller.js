/**
 * Smart Equipment Controller
 * Enforces serial uniqueness, QR generation, stock validation, and movement history
 */

const Equipment = require('../../models/Equipment');
const EquipmentService = require('../services/equipment.service');
const QrService = require('../services/qr.service');
const ApiResponse = require('../utils/apiResponse');

class EquipmentController {
  /**
   * POST /api/equipment
   */
  static async registerEquipment(req, res, next) {
    try {
      const { serialNumber, category, brand, model, inventoryItemId, specifications } = req.body;

      const equipment = await EquipmentService.registerEquipment({
        serialNumber,
        category,
        brand,
        model,
        inventoryItemId,
        specifications,
        userId: req.user._id,
        userName: req.user.name
      });

      return ApiResponse.created(res, equipment, 'Serialized equipment registered with QR code.');
    } catch (err) {
      next(err);
    }
  }

  static async generateBatch(req, res, next) {
    try {
      const { category, quantity, brand, model, specifications } = req.body;
      const qty = Math.min(Math.max(Number(quantity) || 1, 1), 50);
      const created = [];
      for (let i = 0; i < qty; i++) {
        const serialNumber = `SP-${String(category || 'panel').slice(0, 3).toUpperCase()}-${Date.now().toString().slice(-6)}-${String(i + 1).padStart(3, '0')}`;
        const equipment = await EquipmentService.registerEquipment({
          serialNumber,
          category: category || 'panel',
          brand: brand || 'SunPower',
          model: model || 'SP-PERC-540W',
          specifications: specifications || { wattage: 540, warrantyYears: 25 },
          userId: req.user._id,
          userName: req.user.name
        });
        created.push(equipment);
      }
      return ApiResponse.created(res, created, `Serialized ${created.length} equipment units with QR codes.`);
    } catch (err) {
      next(err);
    }
  }

  /**
   * Helper to resolve customer profile from authenticated user
   */
  static async getCustomerForUser(userId, userEmail) {
    const Customer = require('../../models/Customer');
    let customer = await Customer.findOne({ user: userId });
    if (!customer && userEmail) {
      customer = await Customer.findOne({ email: userEmail });
    }
    return customer;
  }

  /**
   * GET /api/equipment
   */
  static async listEquipment(req, res, next) {
    try {
      const { search, category, status, operation, customerId, orderId, page = 1, limit = 50 } = req.query;
      const query = {};

      // Security check: customer can only see their own installed equipment
      if (req.user?.role === 'customer') {
        const customer = await EquipmentController.getCustomerForUser(req.user._id, req.user.email);
        if (!customer) {
          return ApiResponse.success(res, [], 'No equipment found', 200, { total: 0, page: 1, limit, pages: 0 });
        }
        query.installedAtCustomer = customer._id;
      }

      if (category) query.category = category;
      if (status) query.status = status;
      if (customerId) query.installedAtCustomer = customerId;
      if (orderId) query.allocatedToOrder = orderId;

      // Filter based on business operation
      if (operation === 'dispatch') {
        query.status = 'in_stock';
      } else if (operation === 'installation') {
        query.status = { $in: ['reserved', 'dispatched'] };
      } else if (operation === 'service' || operation === 'warranty') {
        query.status = 'installed';
      }

      if (search) {
        query.$or = [
          { serialNumber: { $regex: search, $options: 'i' } },
          { brand: { $regex: search, $options: 'i' } },
          { model: { $regex: search, $options: 'i' } }
        ];
      }

      const skip = (Number(page) - 1) * Number(limit);
      const [items, total] = await Promise.all([
        Equipment.find(query)
          .populate('installedAtCustomer', 'name email phone customerCode')
          .populate('allocatedToOrder', 'orderNumber')
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(Number(limit)),
        Equipment.countDocuments(query)
      ]);

      return ApiResponse.success(res, items, 'Equipment list retrieved', 200, {
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
   * GET /api/equipment/dropdown
   * Searchable dropdown data tailored for live equipment selection
   */
  static async getDropdownOptions(req, res, next) {
    try {
      const { search = '', operation, category, customerId, orderId, limit = 50 } = req.query;
      const query = {};

      if (req.user?.role === 'customer') {
        const customer = await EquipmentController.getCustomerForUser(req.user._id, req.user.email);
        if (!customer) return ApiResponse.success(res, []);
        query.installedAtCustomer = customer._id;
      }

      if (category) query.category = category;
      if (customerId) query.installedAtCustomer = customerId;
      if (orderId) query.allocatedToOrder = orderId;

      if (operation === 'dispatch') {
        query.status = 'in_stock';
      } else if (operation === 'installation') {
        query.status = { $in: ['reserved', 'dispatched', 'in_stock'] };
      } else if (operation === 'service' || operation === 'warranty') {
        query.status = 'installed';
      }

      if (search.trim()) {
        query.$or = [
          { serialNumber: { $regex: search.trim(), $options: 'i' } },
          { brand: { $regex: search.trim(), $options: 'i' } },
          { model: { $regex: search.trim(), $options: 'i' } }
        ];
      }

      const items = await Equipment.find(query)
        .populate('installedAtCustomer', 'name customerCode')
        .populate('allocatedToOrder', 'orderNumber')
        .select('serialNumber brand model category status installedAtCustomer allocatedToOrder')
        .sort({ serialNumber: 1 })
        .limit(Number(limit));

      const options = items.map((item) => ({
        value: item.serialNumber,
        serialNumber: item.serialNumber,
        label: `${item.serialNumber} — ${item.brand} ${item.model} (${item.status.replace(/_/g, ' ')})`,
        brand: item.brand,
        model: item.model,
        category: item.category,
        status: item.status,
        customerName: item.installedAtCustomer?.name,
        orderNumber: item.allocatedToOrder?.orderNumber
      }));

      return ApiResponse.success(res, options);
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/equipment/:id
   */
  static async getById(req, res, next) {
    try {
      const equipment = await Equipment.findById(req.params.id)
        .populate('installedAtCustomer')
        .populate('allocatedToOrder')
        .populate('inventoryItem');

      if (!equipment) {
        return ApiResponse.notFound(res, 'Equipment unit not found.');
      }

      if (req.user?.role === 'customer') {
        const customer = await EquipmentController.getCustomerForUser(req.user._id, req.user.email);
        const ownerId = equipment.installedAtCustomer?._id?.toString() || equipment.installedAtCustomer?.toString();
        if (!customer || ownerId !== customer._id.toString()) {
          return ApiResponse.forbidden(res, 'Access denied: You cannot view another customer’s equipment.');
        }
      }

      return ApiResponse.success(res, equipment);
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/equipment/serial/:serialNumber
   * Safe lookup for QR scanners on frontend
   */
  static async getBySerialNumber(req, res, next) {
    try {
      const cleanSerial = req.params.serialNumber.toUpperCase().trim();
      const equipment = await Equipment.findOne({ serialNumber: cleanSerial })
        .populate('installedAtCustomer', 'name email phone installationAddress')
        .populate('allocatedToOrder', 'orderNumber orderStatus');

      if (!equipment) {
        return ApiResponse.notFound(res, `Equipment with serial number '${cleanSerial}' not found.`);
      }

      return ApiResponse.success(res, { equipment, ...equipment.toObject() }, 'Equipment found via serial scan');
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/equipment/:id/qr
   */
  static async getQrCode(req, res, next) {
    try {
      const equipment = await Equipment.findById(req.params.id);
      if (!equipment) {
        return ApiResponse.notFound(res, 'Equipment unit not found.');
      }

      const svgString = await QrService.generateQrSvg(equipment.qrCodeData);

      return ApiResponse.success(res, {
        serialNumber: equipment.serialNumber,
        qrCodeData: equipment.qrCodeData,
        qrCodeImage: equipment.qrCodeImage,
        qrSvg: svgString
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * POST /api/equipment/:id/dispatch
   */
  static async dispatchEquipment(req, res, next) {
    try {
      const { orderId, notes } = req.body;
      const updated = await EquipmentService.dispatchEquipment(
        req.params.id,
        orderId,
        req.user._id,
        req.user.name,
        notes
      );
      return ApiResponse.success(res, updated, 'Equipment successfully dispatched to site.');
    } catch (err) {
      next(err);
    }
  }

  /**
   * POST /api/equipment/:id/deliver
   */
  static async deliverEquipment(req, res, next) {
    try {
      const { notes } = req.body;
      const updated = await EquipmentService.deliverEquipment(
        req.params.id,
        req.user._id,
        req.user.name,
        notes
      );
      return ApiResponse.success(res, updated, 'Equipment delivery confirmed.');
    } catch (err) {
      next(err);
    }
  }

  /**
   * POST /api/equipment/:id/install
   */
  static async installEquipment(req, res, next) {
    try {
      const { notes } = req.body;
      const updated = await EquipmentService.markInstalled(
        req.params.id,
        req.user._id,
        req.user.name,
        notes
      );
      return ApiResponse.success(res, updated, 'Equipment installation confirmed.');
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/equipment/:id/history
   */
  static async getHistory(req, res, next) {
    try {
      const equipment = await Equipment.findById(req.params.id).select('serialNumber movementHistory');
      if (!equipment) {
        return ApiResponse.notFound(res, 'Equipment unit not found.');
      }

      return ApiResponse.success(res, {
        serialNumber: equipment.serialNumber,
        history: equipment.movementHistory
      });
    } catch (err) {
      next(err);
    }
  }
}

module.exports = EquipmentController;
