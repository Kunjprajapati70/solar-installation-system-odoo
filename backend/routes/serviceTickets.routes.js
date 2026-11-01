const express = require('express');
const router = express.Router();
const ServiceTicket = require('../models/ServiceTicket');
const Warranty = require('../models/Warranty');
const Customer = require('../models/Customer');
const Equipment = require('../models/Equipment');
const { protect, authorize } = require('../middleware/auth');
const upload = require('../middleware/upload');

// @route   GET /api/service-tickets
router.get('/', protect, async (req, res) => {
  try {
    let query = {};
    if (req.user.role === 'customer') {
      const customer = await Customer.findOne({ user: req.user.id });
      if (!customer) return res.json({ success: true, count: 0, data: [] });
      query.customer = customer._id;
    } else if (req.user.role === 'technician') {
      query.assignedTechnician = req.user.id;
    }

    const { status, priority, warrantyStatus } = req.query;
    if (status) query.status = status;
    if (priority) query.priority = priority;
    if (warrantyStatus) query.warrantyStatusAtTicket = warrantyStatus;

    const tickets = await ServiceTicket.find(query)
      .populate('customer', 'name customerCode phone installationAddress')
      .populate('assignedTechnician', 'name phone email')
      .populate('warranty')
      .sort({ createdAt: -1 });

    res.json({ success: true, count: tickets.length, data: tickets });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   GET /api/service-tickets/:id
router.get('/:id', protect, async (req, res) => {
  try {
    const ticket = await ServiceTicket.findById(req.params.id)
      .populate('customer')
      .populate('assignedTechnician')
      .populate('warranty');

    if (!ticket) return res.status(404).json({ success: false, message: 'Ticket not found' });

    if (req.user.role === 'customer' && ticket.customer?.user?.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    res.json({ success: true, data: ticket });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   POST /api/service-tickets
// Enforces Rule 6 & 7: Auto-checks warranty and computes ₹0 vs itemized parts+labour!
router.post('/', protect, async (req, res) => {
  try {
    const { equipmentSerialNumber, issueCategory, priority, title, description, photos, customerId } = req.body;

    let targetCustomerId = customerId;
    if (req.user.role === 'customer') {
      const cust = await Customer.findOne({ user: req.user.id });
      if (!cust) return res.status(400).json({ success: false, message: 'Customer profile not found' });
      targetCustomerId = cust._id;
    }

    if (!targetCustomerId) {
      return res.status(400).json({ success: false, message: 'Customer ID is required' });
    }

    const cleanSerial = (equipmentSerialNumber || '').toUpperCase().trim();

    // Check Warranty Status Automatically
    const now = new Date();
    const warranty = await Warranty.findOne({ serialNumber: cleanSerial });

    let warrantyStatusAtTicket = 'no_warranty_record';
    let isUnderWarranty = false;

    if (warranty) {
      if (warranty.status === 'active' && now <= warranty.expiryDate) {
        warrantyStatusAtTicket = 'in_warranty';
        isUnderWarranty = true;
      } else {
        warrantyStatusAtTicket = 'out_of_warranty';
        isUnderWarranty = false;
      }
    }

    // Set initial charges based on warranty eligibility (Rule 6: ₹0 if in-warranty)
    const charges = {
      partsCost: 0,
      labourCost: 0,
      discountAmount: 0,
      totalCustomerPayable: 0
    };

    const count = await ServiceTicket.countDocuments();
    const ticketNumber = `TCK-2026-${String(count + 1).padStart(5, '0')}`;

    const ticket = await ServiceTicket.create({
      ticketNumber,
      customer: targetCustomerId,
      equipmentSerialNumber: cleanSerial,
      warranty: warranty ? warranty._id : null,
      warrantyStatusAtTicket,
      issueCategory: issueCategory || 'routine_maintenance',
      priority: priority || 'medium',
      title: title || `Solar Issue: ${cleanSerial}`,
      description: description || 'Customer raised service request.',
      photos: photos || [],
      charges,
      status: 'open'
    });

    // Update equipment status to 'under_service'
    if (cleanSerial) {
      await Equipment.findOneAndUpdate(
        { serialNumber: cleanSerial },
        {
          status: 'under_service',
          $push: {
            movementHistory: {
              action: 'SERVICE_TICKET_RAISED',
              performedBy: req.user.id,
              performedByName: req.user.name,
              notes: `Ticket ${ticketNumber} raised: ${title}`,
              fromStatus: 'installed',
              toStatus: 'under_service'
            }
          }
        }
      );
    }

    res.status(201).json({
      success: true,
      message: isUnderWarranty
        ? `Ticket created under Active Warranty. Customer repair charges are ₹0 (Eligible for full coverage).`
        : `Ticket created as Out-of-Warranty. Standard parts and labour rates will apply.`,
      data: ticket
    });
  } catch (error) {
    console.error('Service ticket create error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   POST /api/service-tickets/:id/assign
router.post('/:id/assign', protect, authorize('admin', 'sales'), async (req, res) => {
  try {
    const { technicianId } = req.body;
    const ticket = await ServiceTicket.findById(req.params.id);
    if (!ticket) return res.status(404).json({ success: false, message: 'Ticket not found' });

    ticket.assignedTechnician = technicianId;
    ticket.status = 'technician_assigned';
    await ticket.save();

    res.json({ success: true, message: 'Technician assigned successfully', data: ticket });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   POST /api/service-tickets/:id/resolve
// Enforces Rule 6 & 7: Calculates charges upon repair completion
router.post('/:id/resolve', protect, authorize('admin', 'technician'), async (req, res) => {
  try {
    const { actionTaken, partsReplaced, partsCost = 0, labourCost = 0, notes } = req.body;
    const ticket = await ServiceTicket.findById(req.params.id).populate('warranty');
    if (!ticket) return res.status(404).json({ success: false, message: 'Ticket not found' });

    const pCost = Number(partsCost) || 0;
    const lCost = Number(labourCost) || 0;

    let customerPayable = 0;
    let coveredByWarranty = 0;

    // RULE 6: In-warranty eligible repairs have ZERO customer repair charges
    if (ticket.warrantyStatusAtTicket === 'in_warranty') {
      customerPayable = 0;
      coveredByWarranty = pCost + lCost;
    } else {
      // RULE 7: Out-of-warranty repairs support parts and labour charges
      customerPayable = pCost + lCost;
      coveredByWarranty = 0;
    }

    ticket.charges = {
      partsCost: pCost,
      labourCost: lCost,
      discountAmount: coveredByWarranty,
      totalCustomerPayable: customerPayable
    };

    ticket.resolutionDetails = {
      actionTaken: actionTaken || 'Repaired component and verified voltage balance.',
      partsReplaced: Array.isArray(partsReplaced) ? partsReplaced : partsReplaced ? [partsReplaced] : [],
      resolvedAt: new Date(),
      resolutionNotes: notes || 'Service completed. System restored to full generation.'
    };

    ticket.status = 'resolved';
    await ticket.save();

    // Log to Warranty repair history if warranty exists
    if (ticket.warranty) {
      await Warranty.findByIdAndUpdate(ticket.warranty._id, {
        $push: {
          claimsHistory: {
            ticketNumber: ticket.ticketNumber,
            claimDate: new Date(),
            issueDescription: ticket.description,
            actionTaken: ticket.resolutionDetails.actionTaken,
            costCoveredByWarranty: coveredByWarranty,
            customerCharged: customerPayable,
            resolvedAt: new Date()
          }
        }
      });
    }

    // Restore Equipment status back to 'installed'
    if (ticket.equipmentSerialNumber) {
      await Equipment.findOneAndUpdate(
        { serialNumber: ticket.equipmentSerialNumber },
        {
          status: 'installed',
          $push: {
            movementHistory: {
              action: 'SERVICE_COMPLETED_AND_RESTORED',
              performedBy: req.user.id,
              performedByName: req.user.name,
              notes: `Ticket ${ticket.ticketNumber} resolved.`,
              fromStatus: 'under_service',
              toStatus: 'installed'
            }
          }
        }
      );
    }

    res.json({
      success: true,
      message: `Service ticket resolved. Customer payable: ₹${customerPayable.toLocaleString('en-IN')}`,
      data: ticket
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
