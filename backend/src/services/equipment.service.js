/**
 * Smart Equipment Lifecycle Service
 * Enforces stock validation, state transitions, movement history, and serial uniqueness
 */

const Equipment = require('../../models/Equipment');
const Inventory = require('../../models/Inventory');
const Order = require('../../models/Order');
const QrService = require('./qr.service');
const { EQUIPMENT_STATUS } = require('../config/constants');

class EquipmentService {
  /**
   * Registers a new equipment unit with serial number and generated QR code
   */
  static async registerEquipment({
    serialNumber,
    category,
    brand,
    model,
    inventoryItemId,
    specifications,
    userId,
    userName
  }) {
    const cleanSerial = serialNumber.toUpperCase().trim();

    // Check duplicate serial
    const existing = await Equipment.findOne({ serialNumber: cleanSerial });
    if (existing) {
      throw new Error(`Equipment with serial number '${cleanSerial}' already exists.`);
    }

    const qrData = QrService.generateIdentifier(cleanSerial, category, brand, model);
    const qrImage = await QrService.generateQrDataUrl(qrData);

    const equipment = new Equipment({
      serialNumber: cleanSerial,
      qrCodeData: qrData,
      qrCodeImage: qrImage,
      category,
      brand,
      model,
      inventoryItem: inventoryItemId,
      specifications: specifications || {},
      status: EQUIPMENT_STATUS.IN_STOCK,
      movementHistory: [
        {
          action: 'REGISTERED',
          timestamp: new Date(),
          performedBy: userId,
          performedByName: userName || 'Admin System',
          notes: 'Serialized equipment unit registered and QR code generated.',
          fromStatus: 'none',
          toStatus: EQUIPMENT_STATUS.IN_STOCK,
          location: 'Central Warehouse'
        }
      ]
    });

    await equipment.save();

    // Increment inventory available count if linked
    if (inventoryItemId) {
      await Inventory.findByIdAndUpdate(inventoryItemId, {
        $inc: { availableQuantity: 1 }
      });
    }

    return equipment;
  }

  /**
   * Dispatches equipment to an order
   * Validates stock, updates status to dispatched, records movement history
   */
  static async dispatchEquipment(equipmentId, orderId, userId, userName, notes = '') {
    const equipment = await Equipment.findById(equipmentId);
    if (!equipment) {
      throw new Error('Equipment unit not found.');
    }

    if (equipment.status !== EQUIPMENT_STATUS.IN_STOCK && equipment.status !== EQUIPMENT_STATUS.RESERVED) {
      throw new Error(`Cannot dispatch equipment with status '${equipment.status}'. Must be 'in_stock' or 'reserved'.`);
    }

    const order = await Order.findById(orderId).populate('customer');
    if (!order) {
      throw new Error('Associated order not found.');
    }

    const prevStatus = equipment.status;
    equipment.status = EQUIPMENT_STATUS.DISPATCHED;
    equipment.allocatedToOrder = order._id;
    equipment.installedAtCustomer = order.customer._id;
    equipment.dispatchedAt = new Date();

    equipment.movementHistory.push({
      action: 'DISPATCHED_TO_SITE',
      timestamp: new Date(),
      performedBy: userId,
      performedByName: userName,
      notes: notes || `Dispatched to site for Order #${order.orderNumber} (${order.customer.name})`,
      fromStatus: prevStatus,
      toStatus: EQUIPMENT_STATUS.DISPATCHED,
      location: 'In Transit / Customer Site'
    });

    await equipment.save();

    // Decrement inventory if linked
    if (equipment.inventoryItem) {
      await Inventory.findByIdAndUpdate(equipment.inventoryItem, {
        $inc: { availableQuantity: -1 }
      });
    }

    // Add to order allocated equipment list if not present
    const alreadyAllocated = order.allocatedEquipment.some(
      (e) => e.serialNumber === equipment.serialNumber
    );
    if (!alreadyAllocated) {
      order.allocatedEquipment.push({
        equipment: equipment._id,
        serialNumber: equipment.serialNumber,
        category: equipment.category,
        brand: equipment.brand,
        model: equipment.model
      });
      await order.save();
    }

    return equipment;
  }

  /**
   * Confirms equipment delivery at customer site
   */
  static async deliverEquipment(equipmentId, userId, userName, deliveryNotes = '') {
    const equipment = await Equipment.findById(equipmentId);
    if (!equipment) {
      throw new Error('Equipment unit not found.');
    }

    if (equipment.status !== EQUIPMENT_STATUS.DISPATCHED) {
      throw new Error(`Equipment must be in 'dispatched' status to confirm delivery. Current: ${equipment.status}`);
    }

    equipment.movementHistory.push({
      action: 'DELIVERY_CONFIRMED',
      timestamp: new Date(),
      performedBy: userId,
      performedByName: userName,
      notes: deliveryNotes || 'Customer physical delivery confirmed on site.',
      fromStatus: equipment.status,
      toStatus: equipment.status,
      location: 'Customer Premises'
    });

    await equipment.save();
    return equipment;
  }

  /**
   * Marks equipment installed after testing completion
   */
  static async markInstalled(equipmentId, userId, userName, notes = '') {
    const equipment = await Equipment.findById(equipmentId);
    if (!equipment) {
      throw new Error('Equipment unit not found.');
    }

    const prevStatus = equipment.status;
    equipment.status = EQUIPMENT_STATUS.INSTALLED;
    equipment.installedAt = new Date();

    equipment.movementHistory.push({
      action: 'INSTALLATION_COMPLETED',
      timestamp: new Date(),
      performedBy: userId,
      performedByName: userName,
      notes: notes || 'Equipment mounted, wired, synced, and commissioning approved.',
      fromStatus: prevStatus,
      toStatus: EQUIPMENT_STATUS.INSTALLED,
      location: 'Customer Rooftop / Panel Room'
    });

    await equipment.save();
    return equipment;
  }
}

module.exports = EquipmentService;
