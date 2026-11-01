/**
 * Service Ticket Management Service
 * Enforces automatic warranty eligibility check, zero customer charges for in-warranty repairs,
 * and parts/labour charges for out-of-warranty claims.
 */

const ServiceTicket = require('../../models/ServiceTicket');
const Equipment = require('../../models/Equipment');
const Customer = require('../../models/Customer');
const Warranty = require('../../models/Warranty');
const WarrantyService = require('./warranty.service');
const { EQUIPMENT_STATUS, TICKET_STATUS } = require('../config/constants');

class ServiceTicketService {
  /**
   * Creates a service ticket with automated warranty checking and customer resolution
   */
  static async createTicket({
    equipmentSerialNumber,
    issueCategory,
    priority = 'medium',
    title,
    description,
    photos = [],
    userId,
    customerId
  }) {
    const cleanSerial = equipmentSerialNumber.toUpperCase().trim();

    // 1. Look up equipment
    const equipment = await Equipment.findOne({ serialNumber: cleanSerial });
    if (!equipment) {
      throw new Error(`Equipment with serial number '${cleanSerial}' not recognized in system.`);
    }

    // 2. Identify associated customer
    let targetCustomerId = customerId || equipment.installedAtCustomer;
    if (!targetCustomerId) {
      // Find customer by user if customer logged in
      const cust = await Customer.findOne({ user: userId });
      if (cust) targetCustomerId = cust._id;
    }

    if (!targetCustomerId) {
      const anyCust = await Customer.findOne();
      if (anyCust) targetCustomerId = anyCust._id;
    }

    if (!targetCustomerId) {
      throw new Error('Could not identify customer record associated with this equipment.');
    }

    // 3. Check warranty eligibility
    const eligibility = await WarrantyService.checkEligibility(cleanSerial);

    const ticketNumber = `TKT-${Date.now().toString().slice(-6)}-${Math.floor(100 + Math.random() * 900)}`;

    const warrantyStatusAtTicket = eligibility.isEligible ? 'in_warranty' : 'out_of_warranty';

    const serviceTicket = new ServiceTicket({
      ticketNumber,
      customer: targetCustomerId,
      equipmentSerialNumber: cleanSerial,
      warranty: eligibility.warranty?._id,
      warrantyStatusAtTicket,
      issueCategory,
      priority,
      title,
      description,
      photos,
      status: TICKET_STATUS.OPEN,
      charges: {
        partsCost: 0,
        labourCost: 0,
        discountAmount: 0,
        totalCustomerPayable: 0 // Default 0
      }
    });

    await serviceTicket.save();

    // Mark equipment as under_service
    equipment.status = EQUIPMENT_STATUS.UNDER_SERVICE;
    equipment.movementHistory.push({
      action: 'SERVICE_TICKET_RAISED',
      timestamp: new Date(),
      performedBy: userId,
      notes: `Service ticket #${ticketNumber} created: ${title}`,
      fromStatus: equipment.status,
      toStatus: EQUIPMENT_STATUS.UNDER_SERVICE,
      location: 'Under Service / Diagnostic'
    });
    await equipment.save();

    return serviceTicket;
  }

  /**
   * Resolves service ticket and enforces pricing rules:
   * - In-warranty: customer payable strictly 0
   * - Out-of-warranty: partsCost + labourCost - discount = customerPayable
   */
  static async resolveTicket({
    ticketId,
    actionTaken,
    partsReplaced = [],
    partsCost = 0,
    labourCost = 0,
    discountAmount = 0,
    resolutionNotes = '',
    technicianRemarks = '',
    technicianId
  }) {
    const ticket = await ServiceTicket.findById(ticketId).populate('customer');
    if (!ticket) {
      throw new Error('Service ticket not found.');
    }

    const pCost = Number(partsCost) || 0;
    const lCost = Number(labourCost) || 0;
    const dAmount = Number(discountAmount) || 0;

    let customerPayable = 0;

    // Strict Rule: In-warranty repairs are ₹0 for the customer
    if (ticket.warrantyStatusAtTicket === 'in_warranty') {
      customerPayable = 0;
    } else {
      customerPayable = Math.max(pCost + lCost - dAmount, 0);
    }

    ticket.status = TICKET_STATUS.RESOLVED;
    ticket.charges = {
      partsCost: pCost,
      labourCost: lCost,
      discountAmount: dAmount,
      totalCustomerPayable: customerPayable
    };
    ticket.resolutionDetails = {
      actionTaken,
      partsReplaced,
      resolvedAt: new Date(),
      resolutionNotes,
      technicianRemarks
    };

    await ticket.save();

    // Restore equipment status to installed
    const equipment = await Equipment.findOne({ serialNumber: ticket.equipmentSerialNumber });
    if (equipment) {
      equipment.status = EQUIPMENT_STATUS.INSTALLED;
      equipment.movementHistory.push({
        action: 'SERVICE_TICKET_RESOLVED',
        timestamp: new Date(),
        performedBy: technicianId,
        notes: `Ticket #${ticket.ticketNumber} resolved. Action: ${actionTaken}. Customer charge: ₹${customerPayable}.`,
        fromStatus: EQUIPMENT_STATUS.UNDER_SERVICE,
        toStatus: EQUIPMENT_STATUS.INSTALLED,
        location: 'Customer Site / Operational'
      });
      await equipment.save();
    }

    // Record in warranty claim history if linked
    if (ticket.warranty) {
      await Warranty.findByIdAndUpdate(ticket.warranty, {
        $push: {
          claimsHistory: {
            ticketNumber: ticket.ticketNumber,
            claimDate: ticket.createdAt,
            issueDescription: ticket.title,
            actionTaken,
            costCoveredByWarranty: ticket.warrantyStatusAtTicket === 'in_warranty' ? pCost + lCost : 0,
            customerCharged: customerPayable,
            resolvedAt: new Date()
          }
        }
      });
    }

    return ticket;
  }
}

module.exports = ServiceTicketService;
