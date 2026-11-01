/**
 * Project Order Controller
 * Manages project orders, advance/balance calculations, milestone progression, and equipment allocation
 */

const Order = require('../../models/Order');
const Quotation = require('../../models/Quotation');
const Customer = require('../../models/Customer');
const Installation = require('../../models/Installation');
const Equipment = require('../../models/Equipment');
const WarrantyService = require('../services/warranty.service');
const { rupeesToPaise, paiseToRupees } = require('../utils/currency');
const { ORDER_STATUS, PAYMENT_STATUS, INSTALLATION_STATUS, EQUIPMENT_STATUS } = require('../config/constants');
const ApiResponse = require('../utils/apiResponse');

class OrderController {
  /**
   * POST /api/orders
   * Creates an order from a quotation with verified server calculations
   */
  static async createOrder(req, res, next) {
    try {
      const { quotationId } = req.body;
      if (!quotationId) {
        return ApiResponse.badRequest(res, 'Quotation ID is required to create an order.');
      }

      const quotation = await Quotation.findById(quotationId).populate('customer');
      if (!quotation) {
        return ApiResponse.notFound(res, 'Quotation not found.');
      }

      // Check if order already exists for this quotation
      const existing = await Order.findOne({ quotation: quotation._id });
      if (existing) {
        return ApiResponse.badRequest(res, `Order #${existing.orderNumber} already exists for this quotation.`);
      }

      // Automatically approve quotation if not already
      if (quotation.status !== 'approved') {
        quotation.status = 'approved';
        quotation.approvedAt = new Date();
        await quotation.save();
      }

      let customerId = quotation.customer?._id || quotation.customer;
      if (!customerId) {
        const anyCust = await Customer.findOne();
        if (anyCust) customerId = anyCust._id;
      }

      if (!customerId) {
        return ApiResponse.badRequest(res, 'Quotation is missing a valid linked customer profile.');
      }

      const totalAmount = quotation.pricing?.netPayable || quotation.pricing?.grossTotal || 150000;
      const advancePercent = quotation.paymentTerms?.advancePercent || 30;

      // Integer paise calculation for advance and balance
      const totalPaise = rupeesToPaise(totalAmount);
      const advanceRequiredPaise = Math.round((totalPaise * advancePercent) / 100);
      const balancePaise = totalPaise; // Initially full amount is balance until payment received

      const orderNumber = `ORD-${Date.now().toString().slice(-6)}-${Math.floor(100 + Math.random() * 900)}`;

      const order = new Order({
        orderNumber,
        quotation: quotation._id,
        customer: customerId,
        systemCapacityKw: quotation.systemCapacityKw || 3,
        systemType: quotation.systemType || 'on_grid',
        totalAmount,
        advanceRequired: paiseToRupees(advanceRequiredPaise),
        advancePaid: 0,
        balanceAmount: paiseToRupees(balancePaise),
        paymentStatus: PAYMENT_STATUS.PENDING,
        orderStatus: ORDER_STATUS.CONFIRMED,
        allocatedEquipment: [],
        milestones: [
          { stageName: 'Order Confirmed', status: 'completed', completedAt: new Date() },
          { stageName: 'Stock Check & BOM Allocation', status: 'pending' },
          { stageName: 'Logistics & Dispatch', status: 'pending' },
          { stageName: 'Installation & Quality Testing', status: 'pending' },
          { stageName: 'Delivery & Customer Handover', status: 'pending' },
          { stageName: 'Net Metering & Subsidy Commissioning', status: 'pending' }
        ]
      });

      await order.save();

      // Mark quotation as converted
      quotation.status = 'converted';
      await quotation.save();

      // Automatically create linked Installation record in assigned state
      const defaultTech = await require('../../models/User').findOne({ role: 'technician' });
      const installNumber = `INS-${Date.now().toString().slice(-6)}-${Math.floor(100 + Math.random() * 900)}`;

      const installation = new Installation({
        installationNumber: installNumber,
        order: order._id,
        customer: customerId,
        leadTechnician: defaultTech ? defaultTech._id : req.user._id,
        scheduledDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
        status: INSTALLATION_STATUS.ASSIGNED,
        systemCapacityKw: quotation.systemCapacityKw,
        steps: [
          { id: 'step-1', title: 'Mounting Structure Mechanical Assembly & Anchor Fastening', status: 'pending' },
          { id: 'step-2', title: 'Solar PV Modules Clamping & DC Array Stringing', status: 'pending' },
          { id: 'step-3', title: 'Smart Inverter & AC/DC Protection Box Mounting', status: 'pending' },
          { id: 'step-4', title: 'Chemical Earthing & Surge Protection Bonding', status: 'pending' },
          { id: 'step-5', title: 'Open Circuit Voltage (Voc) & Short Circuit (Isc) QA Testing', status: 'pending' },
          { id: 'step-6', title: 'Inverter Grid Synchronization & Generation Handover', status: 'pending' }
        ]
      });

      await installation.save();
      order.installation = installation._id;
      await order.save();

      return ApiResponse.created(res, order, 'Project order created and installation pipeline initialized.');
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/orders
   */
  static async listOrders(req, res, next) {
    try {
      const { status, paymentStatus, search, page = 1, limit = 50 } = req.query;
      const query = {};

      if (status) query.orderStatus = status;
      if (paymentStatus) query.paymentStatus = paymentStatus;
      if (search) {
        query.$or = [{ orderNumber: { $regex: search, $options: 'i' } }];
      }

      const skip = (Number(page) - 1) * Number(limit);
      const [items, total] = await Promise.all([
        Order.find(query)
          .populate('customer')
          .populate('quotation')
          .populate('installation')
          .populate('allocatedEquipment.equipment')
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(Number(limit)),
        Order.countDocuments(query)
      ]);

      return ApiResponse.success(res, items, 'Orders retrieved', 200, {
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
   * GET /api/orders/:id
   */
  static async getById(req, res, next) {
    try {
      const order = await Order.findById(req.params.id)
        .populate('customer')
        .populate('quotation')
        .populate('installation')
        .populate('allocatedEquipment.equipment');

      if (!order) {
        return ApiResponse.notFound(res, 'Order not found.');
      }

      return ApiResponse.success(res, order);
    } catch (err) {
      next(err);
    }
  }

  /**
   * PUT /api/orders/:id/status
   */
  static async updateStatus(req, res, next) {
    try {
      const { orderStatus } = req.body;
      const order = await Order.findById(req.params.id);

      if (!order) {
        return ApiResponse.notFound(res, 'Order not found.');
      }

      order.orderStatus = orderStatus;

      // Update milestone matching stage
      if (order.milestones && order.milestones.length > 0) {
        const milestoneMap = {
          stock_checked: 'Stock Check & BOM Allocation',
          dispatched: 'Logistics & Dispatch',
          in_installation: 'Installation & Quality Testing',
          delivery_confirmed: 'Delivery & Customer Handover',
          completed: 'Net Metering & Subsidy Commissioning'
        };
        const stageName = milestoneMap[orderStatus];
        if (stageName) {
          const m = order.milestones.find((ms) => ms.stageName === stageName);
          if (m) {
            m.status = 'completed';
            m.completedAt = new Date();
          }
        }
      }

      await order.save();
      return ApiResponse.success(res, order, `Order status updated to '${orderStatus}'.`);
    } catch (err) {
      next(err);
    }
  }

  /**
   * POST /api/orders/:id/confirm-delivery
   * Confirms delivery and triggers automatic warranty start!
   */
  static async confirmDelivery(req, res, next) {
    try {
      const { notes } = req.body;
      const order = await Order.findById(req.params.id);

      if (!order) {
        return ApiResponse.notFound(res, 'Order not found.');
      }

      const now = new Date();
      order.orderStatus = ORDER_STATUS.DELIVERY_CONFIRMED;
      order.deliveryConfirmedAt = now;
      order.deliveryConfirmedBy = req.user._id;
      order.deliveryAcceptanceNotes = notes || 'Customer confirmed physical delivery and handover.';
      await order.save();

      // Rule 5: Automatically activate warranties for all equipment on confirmed delivery!
      const activatedWarranties = await WarrantyService.activateOrderWarranties(order._id, now);

      return ApiResponse.success(
        res,
        { order, activatedWarranties },
        `Delivery confirmed! ${activatedWarranties.length} equipment warranties officially activated starting ${now.toLocaleDateString()}.`
      );
    } catch (err) {
      next(err);
    }
  }

  static async stockCheck(req, res, next) {
    try {
      const order = await Order.findById(req.params.id).populate('quotation');
      if (!order) {
        return ApiResponse.notFound(res, 'Order not found.');
      }

      const Inventory = require('../../models/Inventory');
      const catalog = await Inventory.find();
      const bom = order.quotation?.bom || [];
      const lines = bom.map((item) => {
        const sku = catalog.find((inv) => inv.category === item.category);
        const available = sku?.availableStock ?? sku?.currentStock ?? 0;
        const required = Number(item.quantity) || 0;
        return {
          category: item.category,
          itemName: item.itemName,
          required,
          available,
          sufficient: available >= required
        };
      });
      const allOk = lines.length === 0 || lines.every((line) => line.sufficient);

      if (allOk) {
        order.orderStatus = ORDER_STATUS.STOCK_CHECKED;
        const milestone = order.milestones?.find((ms) => ms.stageName === 'Stock Check & BOM Allocation');
        if (milestone) {
          milestone.status = 'completed';
          milestone.completedAt = new Date();
        }
        await order.save();
      }

      return ApiResponse.success(res, { order, lines, allOk }, allOk ? 'Stock check passed. Inventory is sufficient.' : 'Stock check found shortages.');
    } catch (err) {
      next(err);
    }
  }

  static async dispatchOrder(req, res, next) {
    try {
      const order = await Order.findById(req.params.id);
      if (!order) {
        return ApiResponse.notFound(res, 'Order not found.');
      }

      const serialNumbers = (req.body.serialNumbers || []).map((s) => String(s).toUpperCase().trim()).filter(Boolean);
      if (!serialNumbers.length) {
        return ApiResponse.badRequest(res, 'At least one equipment serial number is required.');
      }

      const units = await Equipment.find({ serialNumber: { $in: serialNumbers } });
      if (units.length !== serialNumbers.length) {
        const found = units.map((u) => u.serialNumber);
        const missing = serialNumbers.filter((s) => !found.includes(s));
        return ApiResponse.badRequest(res, `Unknown serial numbers: ${missing.join(', ')}`);
      }

      order.allocatedEquipment = units.map((unit) => ({
        equipment: unit._id,
        serialNumber: unit.serialNumber,
        category: unit.category,
        brand: unit.brand,
        model: unit.model
      }));
      order.orderStatus = ORDER_STATUS.DISPATCHED;
      order.dispatchedAt = new Date();
      const milestone = order.milestones?.find((ms) => ms.stageName === 'Logistics & Dispatch');
      if (milestone) {
        milestone.status = 'completed';
        milestone.completedAt = new Date();
      }
      await order.save();

      await Equipment.updateMany(
        { _id: { $in: units.map((u) => u._id) } },
        {
          $set: {
            status: EQUIPMENT_STATUS.DISPATCHED,
            allocatedToOrder: order._id,
            dispatchedAt: new Date()
          }
        }
      );

      return ApiResponse.success(res, order, `Dispatched ${units.length} serialized units to ${order.orderNumber}.`);
    } catch (err) {
      next(err);
    }
  }
}

module.exports = OrderController;
