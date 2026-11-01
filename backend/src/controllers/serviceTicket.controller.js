/**
 * Service Ticket Management Controller
 * Enforces automatic warranty checking and zero customer charges for in-warranty repairs
 */

const ServiceTicket = require('../../models/ServiceTicket');
const Customer = require('../../models/Customer');
const ServiceTicketService = require('../services/serviceTicket.service');
const ApiResponse = require('../utils/apiResponse');
const { TICKET_STATUS } = require('../config/constants');

class ServiceTicketController {
  /**
   * POST /api/service-tickets
   */
  static async createTicket(req, res, next) {
    try {
      const { equipmentSerialNumber, issueCategory, priority, title, description, photos, customerId } = req.body;

      if (!equipmentSerialNumber) {
        return ApiResponse.badRequest(res, 'Equipment serial number is required.');
      }
      if (!title || !description) {
        return ApiResponse.badRequest(res, 'Title and description are required.');
      }

      const ticket = await ServiceTicketService.createTicket({
        equipmentSerialNumber,
        issueCategory: issueCategory || 'inverter_fault',
        priority: priority || 'medium',
        title,
        description,
        photos: photos || [],
        userId: req.user._id,
        customerId
      });

      return ApiResponse.created(res, ticket, 'Service ticket created with automatic warranty diagnosis.');
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/service-tickets
   */
  static async listTickets(req, res, next) {
    try {
      const { status, priority, search, page = 1, limit = 50 } = req.query;
      const query = {};

      if (status) query.status = status;
      if (priority) query.priority = priority;
      if (search) {
        query.$or = [
          { ticketNumber: { $regex: search, $options: 'i' } },
          { equipmentSerialNumber: { $regex: search, $options: 'i' } },
          { title: { $regex: search, $options: 'i' } }
        ];
      }

      if (req.user.role === 'customer') {
        let cust = await Customer.findOne({ user: req.user._id });
        if (!cust) cust = await Customer.findOne({ email: req.user.email });
        if (cust) query.customer = cust._id;
        else query.customer = null;
      } else if (req.user.role === 'technician') {
        query.assignedTechnician = req.user._id;
      }

      const skip = (Number(page) - 1) * Number(limit);
      const [items, total] = await Promise.all([
        ServiceTicket.find(query)
          .populate('customer')
          .populate('assignedTechnician', 'name email phone')
          .populate('warranty')
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(Number(limit)),
        ServiceTicket.countDocuments(query)
      ]);

      return ApiResponse.success(res, items, 'Service tickets retrieved', 200, {
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
   * GET /api/service-tickets/:id
   */
  static async getById(req, res, next) {
    try {
      const ticket = await ServiceTicket.findById(req.params.id)
        .populate('customer')
        .populate('assignedTechnician', 'name email phone')
        .populate('warranty');

      if (!ticket) {
        return ApiResponse.notFound(res, 'Service ticket not found.');
      }

      // Ownership check for customers
      if (req.user.role === 'customer') {
        let cust = await Customer.findOne({ user: req.user._id });
        if (!cust) cust = await Customer.findOne({ email: req.user.email });
        const ticketCust = ticket.customer?._id?.toString() || ticket.customer?.toString();
        if (!cust || ticketCust !== cust._id.toString()) {
          return ApiResponse.forbidden(res, 'Access denied: You do not own this service ticket.');
        }
      } else if (req.user.role === 'technician') {
        const assigned = ticket.assignedTechnician?._id?.toString() || ticket.assignedTechnician?.toString();
        if (assigned && assigned !== req.user._id.toString()) {
          return ApiResponse.forbidden(res, 'Access denied: You are not assigned to this service ticket.');
        }
      }

      return ApiResponse.success(res, ticket);
    } catch (err) {
      next(err);
    }
  }

  /**
   * PUT /api/service-tickets/:id
   */
  static async updateTicket(req, res, next) {
    try {
      const { priority, status, description } = req.body;
      const ticket = await ServiceTicket.findById(req.params.id);

      if (!ticket) {
        return ApiResponse.notFound(res, 'Service ticket not found.');
      }

      if (priority) ticket.priority = priority;
      if (status) ticket.status = status;
      if (description) ticket.description = description;

      await ticket.save();
      return ApiResponse.success(res, ticket, 'Service ticket updated.');
    } catch (err) {
      next(err);
    }
  }

  /**
   * PUT /api/service-tickets/:id/assign
   */
  static async assignTechnician(req, res, next) {
    try {
      const { technicianId } = req.body;
      const ticket = await ServiceTicket.findById(req.params.id);

      if (!ticket) {
        return ApiResponse.notFound(res, 'Service ticket not found.');
      }

      ticket.assignedTechnician = technicianId;
      ticket.status = TICKET_STATUS.TECHNICIAN_ASSIGNED;
      await ticket.save();

      return ApiResponse.success(res, ticket, 'Technician assigned to service ticket.');
    } catch (err) {
      next(err);
    }
  }

  /**
   * PUT /api/service-tickets/:id/resolve
   * Business rules: In-warranty repairs set customerCharge to 0. Out-of-warranty charges parts and labour.
   */
  static async resolveTicket(req, res, next) {
    try {
      const { actionTaken, partsReplaced, partsCost, labourCost, discountAmount, resolutionNotes, technicianRemarks } = req.body;

      const resolved = await ServiceTicketService.resolveTicket({
        ticketId: req.params.id,
        actionTaken: actionTaken || 'Repaired and recalibrated on site.',
        partsReplaced: partsReplaced || [],
        partsCost,
        labourCost,
        discountAmount,
        resolutionNotes,
        technicianRemarks,
        technicianId: req.user._id
      });

      return ApiResponse.success(
        res,
        resolved,
        `Service ticket resolved. Customer payable: ₹${resolved.charges.totalCustomerPayable} (${resolved.warrantyStatusAtTicket === 'in_warranty' ? 'Covered by 100% Active Warranty' : 'Out-of-warranty billing'}).`
      );
    } catch (err) {
      next(err);
    }
  }

  /**
   * PUT /api/service-tickets/:id/reject
   */
  static async rejectTicket(req, res, next) {
    try {
      const { rejectionReason, notes } = req.body;
      const ticket = await ServiceTicket.findById(req.params.id);
      if (!ticket) return ApiResponse.notFound(res, 'Service ticket not found.');
      ticket.status = 'rejected';
      ticket.rejectionReason = (rejectionReason || notes || 'Service request rejected by service manager').trim();
      await ticket.save();
      return ApiResponse.success(res, ticket, 'Service ticket marked as rejected and reason saved.');
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/customers/:id/service-tickets
   */
  static async getCustomerTickets(req, res, next) {
    try {
      const customerId = req.params.id;
      const tickets = await ServiceTicket.find({ customer: customerId })
        .populate('assignedTechnician', 'name phone')
        .sort({ createdAt: -1 });

      return ApiResponse.success(res, tickets);
    } catch (err) {
      next(err);
    }
  }
}

module.exports = ServiceTicketController;
