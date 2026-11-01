/**
 * Automatic Warranty Management Service
 * Strictly activates warranties only upon confirmed delivery
 * Computes exact expiry dates from equipment category durations
 */

const Warranty = require('../../models/Warranty');
const Equipment = require('../../models/Equipment');
const Order = require('../../models/Order');
const { WARRANTY_DURATIONS_MONTHS } = require('../config/constants');

class WarrantyService {
  /**
   * Activates warranties for all allocated equipment in an order upon delivery confirmation
   */
  static async activateOrderWarranties(orderId, deliveryDate = new Date()) {
    const order = await Order.findById(orderId).populate('customer');
    if (!order) {
      throw new Error('Order not found for warranty activation.');
    }

    const activatedWarranties = [];

    for (const alloc of order.allocatedEquipment) {
      const equipment = await Equipment.findById(alloc.equipment);
      if (!equipment) continue;

      // Check if warranty already exists
      let warranty = await Warranty.findOne({ serialNumber: equipment.serialNumber });

      // Determine duration in months
      const durationMonths =
        equipment.specifications?.warrantyYears
          ? equipment.specifications.warrantyYears * 12
          : WARRANTY_DURATIONS_MONTHS[equipment.category] || 24;

      const durationYears = Number((durationMonths / 12).toFixed(1));

      // Calculate start and expiry dates strictly from deliveryDate
      const startDate = new Date(deliveryDate);
      const expiryDate = new Date(startDate);
      expiryDate.setMonth(expiryDate.getMonth() + durationMonths);

      const certNumber = `WAR-${equipment.category.toUpperCase()}-${Date.now().toString().slice(-6)}-${Math.floor(100 + Math.random() * 900)}`;

      if (warranty) {
        // Update existing draft warranty to active with exact delivery timestamps
        warranty.startDate = startDate;
        warranty.expiryDate = expiryDate;
        warranty.durationYears = durationYears;
        warranty.status = 'active';
        await warranty.save();
        activatedWarranties.push(warranty);
      } else {
        // Create new active warranty record
        warranty = new Warranty({
          certificateNumber: certNumber,
          equipment: equipment._id,
          serialNumber: equipment.serialNumber,
          customer: order.customer._id,
          order: order._id,
          category: equipment.category,
          brand: equipment.brand,
          model: equipment.model,
          durationYears,
          startDate,
          expiryDate,
          status: 'active',
          coverageDetails: `Manufacturer backed comprehensive warranty for ${equipment.brand} ${equipment.category}. Covers component defects and rated power performance per standard SLA.`
        });

        await warranty.save();
        activatedWarranties.push(warranty);
      }
    }

    return activatedWarranties;
  }

  /**
   * Verifies warranty status and eligibility for an equipment serial number
   * Returns: { isEligible, status: 'active' | 'expired' | 'upcoming' | 'not_found', warranty }
   */
  static async checkEligibility(serialNumber) {
    const cleanSerial = serialNumber.toUpperCase().trim();
    const warranty = await Warranty.findOne({ serialNumber: cleanSerial })
      .populate('customer', 'name email phone installationAddress')
      .populate('equipment');

    if (!warranty) {
      return {
        isEligible: false,
        status: 'not_found',
        message: `No active warranty certificate found for serial number '${cleanSerial}'.`,
        warranty: null
      };
    }

    const now = new Date();

    if (now < warranty.startDate) {
      return {
        isEligible: false,
        status: 'upcoming',
        message: `Warranty is scheduled but will only become active on ${warranty.startDate.toLocaleDateString()}.`,
        warranty
      };
    }

    if (now > warranty.expiryDate) {
      return {
        isEligible: false,
        status: 'expired',
        message: `Warranty expired on ${warranty.expiryDate.toLocaleDateString()}. Repair is subject to standard parts and labour charges.`,
        warranty
      };
    }

    if (warranty.status === 'void') {
      return {
        isEligible: false,
        status: 'void',
        message: 'Warranty certificate is void due to previous unauthorized tampering.',
        warranty
      };
    }

    return {
      isEligible: true,
      status: 'active',
      message: `Active warranty valid until ${warranty.expiryDate.toLocaleDateString()}. Customer is eligible for ₹0.00 repair coverage.`,
      warranty
    };
  }

  /**
   * Returns summary counts of Active, Expired, and Upcoming warranties
   */
  static async getWarrantySummary() {
    const now = new Date();
    const allWarranties = await Warranty.find().lean();

    let activeCount = 0;
    let expiredCount = 0;
    let upcomingCount = 0;

    allWarranties.forEach((w) => {
      const start = new Date(w.startDate);
      const expiry = new Date(w.expiryDate);
      if (w.status === 'active') {
        if (now < start) upcomingCount++;
        else if (now > expiry) expiredCount++;
        else activeCount++;
      } else if (w.status === 'expired') {
        expiredCount++;
      }
    });

    return {
      total: allWarranties.length,
      active: activeCount,
      expired: expiredCount,
      upcoming: upcomingCount
    };
  }
}

module.exports = WarrantyService;
