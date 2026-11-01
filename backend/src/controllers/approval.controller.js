const ApprovalRequest = require('../../models/ApprovalRequest');
const User = require('../../models/User');
const Customer = require('../../models/Customer');
const SiteSurvey = require('../../models/SiteSurvey');
const Quotation = require('../../models/Quotation');
const Order = require('../../models/Order');
const Installation = require('../../models/Installation');
const ServiceTicket = require('../../models/ServiceTicket');
const Subsidy = require('../../models/Subsidy');
const Warranty = require('../../models/Warranty');
const Notification = require('../../models/Notification');
const ApiResponse = require('../utils/apiResponse');
const crypto = require('crypto');

class ApprovalController {
  /**
   * GET /api/approvals
   */
  static async listApprovals(req, res, next) {
    try {
      const { status, type, page = 1, limit = 50 } = req.query;
      const query = {};

      if (status) query.status = status;
      if (type) query.requestType = type;

      // If user is not admin, only show their own submitted requests
      if (req.user.role !== 'admin') {
        query.requestedBy = req.user._id;
      }

      const skip = (Number(page) - 1) * Number(limit);
      const [items, total] = await Promise.all([
        ApprovalRequest.find(query)
          .populate('requestedBy', 'name email role phone userId')
          .populate('reviewedBy', 'name email role')
          .sort({ requestDate: -1 })
          .skip(skip)
          .limit(Number(limit)),
        ApprovalRequest.countDocuments(query)
      ]);

      return ApiResponse.success(res, items, 'Approval requests retrieved', 200, {
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
   * GET /api/approvals/summary
   * Returns breakdown of pending requests across all operational categories
   */
  static async getSummary(req, res, next) {
    try {
      const pendingCounts = await ApprovalRequest.aggregate([
        { $match: { status: 'pending' } },
        { $group: { _id: '$requestType', count: { $sum: 1 } } }
      ]);

      const countsMap = {};
      pendingCounts.forEach((c) => {
        countsMap[c._id] = c.count;
      });

      // Operational pending queries directly from collections
      const [
        pendingSurveys,
        pendingQuotations,
        pendingOrders,
        pendingInstallations,
        pendingTickets,
        pendingSubsidies
      ] = await Promise.all([
        SiteSurvey.countDocuments({ status: { $in: ['completed', 'scheduled'] }, 'approvalDetails.isApproved': { $ne: true } }),
        Quotation.countDocuments({ status: 'draft' }),
        Order.countDocuments({ orderStatus: { $in: ['confirmed', 'stock_checked', 'allocated'] } }),
        Installation.countDocuments({ status: { $in: ['testing_in_progress', 'completed'], 'adminApproval.isApproved': { $ne: true } } }),
        ServiceTicket.countDocuments({ status: { $in: ['open', 'technician_assigned'] } }),
        Subsidy.countDocuments({ status: { $in: ['application_submitted', 'feasibility_approved'] } })
      ]);

      return ApiResponse.success(res, {
        userRequests: countsMap['user_creation'] || 0,
        customerRequests: countsMap['customer_creation'] || 0,
        leadRequests: countsMap['lead_approval'] || 0,
        surveys: pendingSurveys || countsMap['survey_approval'] || 0,
        quotations: pendingQuotations || countsMap['quotation_approval'] || 0,
        dispatches: pendingOrders || countsMap['order_dispatch'] || 0,
        installations: pendingInstallations || countsMap['installation_completion'] || 0,
        serviceTickets: pendingTickets || countsMap['service_ticket'] || 0,
        subsidies: pendingSubsidies || countsMap['subsidy_document'] || 0,
        totalPending: Object.values(countsMap).reduce((a, b) => a + b, 0)
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * POST /api/approvals
   * Allows Sales / Technicians to submit request for admin review
   */
  static async submitRequest(req, res, next) {
    try {
      const { requestType, title, description, referenceId, referenceModel, payload } = req.body;

      if (!requestType || !title) {
        return ApiResponse.badRequest(res, 'Request type and title are required.');
      }

      // Disallow non-admin from requesting admin roles
      if (requestType === 'user_creation' && payload?.role === 'admin' && req.user.role !== 'admin') {
        return ApiResponse.forbidden(res, 'Security Policy Violation: Sales employees cannot request Administrator accounts.');
      }

      const request = new ApprovalRequest({
        requestType,
        title,
        description,
        referenceId,
        referenceModel,
        payload,
        requestedBy: req.user._id,
        requestedByName: req.user.name,
        requestedByRole: req.user.role,
        status: 'pending',
        auditTrail: [
          {
            action: 'CREATED',
            fromStatus: 'none',
            toStatus: 'pending',
            performedBy: req.user._id,
            performedByName: req.user.name,
            notes: 'Submitted for Admin Review and Approval'
          }
        ]
      });

      await request.save();

      // Notify Admins
      await Notification.create({
        recipient: req.user._id, // placeholder, or admin broadcast
        targetRole: 'admin',
        title: `New Approval Request: ${title}`,
        message: `${req.user.name} (${req.user.role}) has submitted a new ${requestType.replace(/_/g, ' ')} request #${request.requestNumber}.`,
        type: 'approval_request',
        link: '/approvals'
      });

      return ApiResponse.created(res, request, 'Approval request submitted successfully and logged for admin review.');
    } catch (err) {
      next(err);
    }
  }

  /**
   * PUT /api/approvals/:id/approve
   * Admin reviews and approves request with separation of duties
   */
  static async approve(req, res, next) {
    try {
      const request = await ApprovalRequest.findById(req.params.id);
      if (!request) {
        return ApiResponse.notFound(res, 'Approval request not found.');
      }

      if (request.status === 'approved') {
        return ApiResponse.badRequest(res, 'This request has already been approved.');
      }

      // Enforce separation of duties: cannot approve own user/customer request unless authorized admin super-user
      if (request.requestedBy.toString() === req.user._id.toString() && request.requestedByRole !== 'admin') {
        return ApiResponse.forbidden(res, 'Separation of Duties Violation: You cannot approve your own request.');
      }

      const { reviewNotes } = req.body;
      request.status = 'approved';
      request.reviewedBy = req.user._id;
      request.reviewedByName = req.user.name;
      request.reviewDate = new Date();
      request.reviewNotes = reviewNotes || 'Approved by Administrator';

      request.auditTrail.push({
        action: 'APPROVED',
        fromStatus: 'pending',
        toStatus: 'approved',
        performedBy: req.user._id,
        performedByName: req.user.name,
        notes: reviewNotes || 'Approved'
      });

      let createdArtifact = null;

      // Handle side-effects based on request type
      if (request.requestType === 'user_creation') {
        const p = request.payload || {};
        const existing = await User.findOne({ email: p.email?.toLowerCase().trim() });
        if (existing) {
          existing.status = 'active';
          existing.isActive = true;
          existing.approvalDetails = {
            status: 'approved',
            reviewedBy: req.user._id,
            reviewDate: new Date(),
            notes: reviewNotes
          };
          await existing.save();
          createdArtifact = existing;
        } else {
          // Generate temporary initial password
          const tempPassword = p.initialPassword || `SunPower@${Math.floor(1000 + Math.random() * 9000)}`;
          const newUser = new User({
            name: p.name,
            email: p.email?.toLowerCase().trim(),
            password: tempPassword,
            role: p.role || 'sales',
            department: p.department || (p.role === 'technician' ? 'Field Engineering' : 'Sales & Marketing'),
            phone: p.phone,
            address: p.address,
            technicianDetails: p.technicianDetails,
            mustChangePassword: true,
            status: 'active',
            isActive: true,
            createdBy: req.user._id,
            approvalDetails: {
              status: 'approved',
              requestedBy: request.requestedBy,
              reviewedBy: req.user._id,
              requestDate: request.requestDate,
              reviewDate: new Date(),
              notes: reviewNotes
            }
          });
          await newUser.save();
          createdArtifact = {
            userId: newUser.userId,
            name: newUser.name,
            email: newUser.email,
            role: newUser.role,
            temporaryPassword: tempPassword,
            mustChangePassword: true
          };
        }
      } else if (request.requestType === 'customer_creation') {
        const p = request.payload || {};
        // Duplicate check
        let customer = await Customer.findOne({
          $or: [
            { email: p.email?.toLowerCase().trim() },
            { phone: p.phone?.trim() }
          ]
        });

        if (!customer) {
          const customerCode = `CUST-${Date.now().toString().slice(-5)}-${Math.floor(100 + Math.random() * 900)}`;
          customer = new Customer({
            customerCode,
            name: p.name,
            email: p.email?.toLowerCase().trim(),
            phone: p.phone?.trim(),
            installationAddress: p.installationAddress || {
              street: p.address || 'Plot 42, Green Energy Park',
              city: p.city || 'Ahmedabad',
              state: p.state || 'Gujarat',
              pincode: p.pincode || '380015'
            },
            connectionType: p.connectionType || 'on_grid',
            sanctionedLoadKw: Number(p.sanctionedLoadKw) || 3,
            discomName: p.discomName || 'UGVCL State Discom',
            consumerNumber: p.consumerNumber || `CON-${Date.now().toString().slice(-6)}`,
            currentPhase: p.currentPhase || 'single',
            notes: p.notes
          });
          await customer.save();
          createdArtifact = customer;
        }
      } else if (request.requestType === 'survey_approval' && request.referenceId) {
        await SiteSurvey.findByIdAndUpdate(request.referenceId, {
          status: 'approved',
          'approvalDetails.isApproved': true,
          'approvalDetails.approvedBy': req.user._id,
          'approvalDetails.approvedAt': new Date(),
          'approvalDetails.approvalNotes': reviewNotes || 'Survey approved by Admin Review Center'
        });
      } else if (request.requestType === 'quotation_approval' && request.referenceId) {
        await Quotation.findByIdAndUpdate(request.referenceId, {
          status: 'approved',
          approvedAt: new Date()
        });
      }

      await request.save();

      // Notify requester
      await Notification.create({
        recipient: request.requestedBy,
        title: `Request #${request.requestNumber} Approved`,
        message: `Your ${request.requestType.replace(/_/g, ' ')} request "${request.title}" has been approved by ${req.user.name}.`,
        type: 'approval_status',
        link: '/approvals'
      });

      return ApiResponse.success(res, { request, createdArtifact }, 'Request approved successfully.');
    } catch (err) {
      next(err);
    }
  }

  /**
   * PUT /api/approvals/:id/reject
   * Admin rejects request with mandatory rejection reason
   */
  static async reject(req, res, next) {
    try {
      const { rejectionReason, reviewNotes } = req.body;
      if (!rejectionReason || !rejectionReason.trim()) {
        return ApiResponse.badRequest(res, 'A clear rejection reason is mandatory when rejecting requests.');
      }

      const request = await ApprovalRequest.findById(req.params.id);
      if (!request) {
        return ApiResponse.notFound(res, 'Approval request not found.');
      }

      if (request.requestedBy.toString() === req.user._id.toString() && request.requestedByRole !== 'admin') {
        return ApiResponse.forbidden(res, 'Separation of Duties Violation: You cannot act on your own request.');
      }

      request.status = 'rejected';
      request.reviewedBy = req.user._id;
      request.reviewedByName = req.user.name;
      request.reviewDate = new Date();
      request.rejectionReason = rejectionReason.trim();
      request.reviewNotes = reviewNotes || rejectionReason.trim();

      request.auditTrail.push({
        action: 'REJECTED',
        fromStatus: 'pending',
        toStatus: 'rejected',
        performedBy: req.user._id,
        performedByName: req.user.name,
        notes: rejectionReason.trim()
      });

      await request.save();

      // Notify requester
      await Notification.create({
        recipient: request.requestedBy,
        title: `Request #${request.requestNumber} Rejected`,
        message: `Your request "${request.title}" was rejected. Reason: ${rejectionReason.trim()}`,
        type: 'approval_status',
        link: '/approvals'
      });

      return ApiResponse.success(res, request, 'Request rejected and rejection reason recorded.');
    } catch (err) {
      next(err);
    }
  }

  /**
   * PUT /api/approvals/:id/request-corrections
   */
  static async requestCorrections(req, res, next) {
    try {
      const { correctionNotes } = req.body;
      if (!correctionNotes || !correctionNotes.trim()) {
        return ApiResponse.badRequest(res, 'Correction notes are required.');
      }

      const request = await ApprovalRequest.findById(req.params.id);
      if (!request) {
        return ApiResponse.notFound(res, 'Approval request not found.');
      }

      request.status = 'corrections_requested';
      request.reviewedBy = req.user._id;
      request.reviewedByName = req.user.name;
      request.reviewDate = new Date();
      request.correctionNotes = correctionNotes.trim();

      request.auditTrail.push({
        action: 'CORRECTIONS_REQUESTED',
        fromStatus: request.status,
        toStatus: 'corrections_requested',
        performedBy: req.user._id,
        performedByName: req.user.name,
        notes: correctionNotes.trim()
      });

      await request.save();

      await Notification.create({
        recipient: request.requestedBy,
        title: `Corrections Requested on Request #${request.requestNumber}`,
        message: `Admin has requested modifications: ${correctionNotes.trim()}`,
        type: 'approval_status',
        link: '/approvals'
      });

      return ApiResponse.success(res, request, 'Correction request sent to submitter.');
    } catch (err) {
      next(err);
    }
  }
}

module.exports = ApprovalController;
