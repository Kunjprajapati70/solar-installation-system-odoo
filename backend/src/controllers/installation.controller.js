/**
 * Installation Pipeline Controller
 * Manages installation scheduling, milestone stages, technician assignments, testing QA, and photo uploads
 */

const Installation = require('../../models/Installation');
const Order = require('../../models/Order');
const InstallationService = require('../services/installation.service');
const ApiResponse = require('../utils/apiResponse');
const { INSTALLATION_STATUS } = require('../config/constants');
const { resolveOwnedCustomer } = require('../utils/customerScope');

class InstallationController {
  /**
   * GET /api/installations
   */
  static async listInstallations(req, res, next) {
    try {
      const { status, search, page = 1, limit = 50 } = req.query;
      const query = {};

      if (status) query.status = status;

      if (req.user.role === 'technician') {
        query.$or = [
          { leadTechnician: req.user._id },
          { assistingTechnicians: req.user._id }
        ];
      } else if (req.user.role === 'customer') {
        const owned = await resolveOwnedCustomer(req.user);
        if (!owned) {
          return ApiResponse.success(res, [], 'Installations retrieved', 200, { total: 0, page: 1, limit: Number(limit), pages: 0 });
        }
        query.customer = owned._id;
      } else if (search) {
        query.$or = [{ installationNumber: { $regex: search, $options: 'i' } }];
      }

      const skip = (Number(page) - 1) * Number(limit);
      const [items, total] = await Promise.all([
        Installation.find(query)
          .populate('customer')
          .populate('order')
          .populate('leadTechnician', 'name phone email')
          .populate('assistingTechnicians', 'name phone')
          .sort({ scheduledDate: -1 })
          .skip(skip)
          .limit(Number(limit)),
        Installation.countDocuments(query)
      ]);

      return ApiResponse.success(res, items, 'Installations retrieved', 200, {
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
   * GET /api/installations/:id
   */
  static async getById(req, res, next) {
    try {
      const installation = await Installation.findById(req.params.id)
        .populate('customer')
        .populate('order')
        .populate('leadTechnician', 'name phone email')
        .populate('assistingTechnicians', 'name phone');

      if (!installation) {
        return ApiResponse.notFound(res, 'Installation job not found.');
      }

      if (req.user.role === 'technician') {
        const isLead = installation.leadTechnician?._id?.toString() === req.user._id.toString() || installation.leadTechnician?.toString() === req.user._id.toString();
        const isAssistant = (installation.assistingTechnicians || []).some((tech) => (tech._id || tech).toString() === req.user._id.toString());
        if (!isLead && !isAssistant) {
          return ApiResponse.forbidden(res, 'Access denied: You are not assigned to this installation job.');
        }
      }

      if (req.user.role === 'customer') {
        const owned = await resolveOwnedCustomer(req.user);
        const custId = installation.customer?._id?.toString() || installation.customer?.toString();
        if (!owned || custId !== owned._id.toString()) {
          return ApiResponse.forbidden(res, 'Access denied: You cannot view another customer’s installation.');
        }
      }

      return ApiResponse.success(res, installation);
    } catch (err) {
      next(err);
    }
  }

  /**
   * POST /api/installations
   */
  static async createInstallation(req, res, next) {
    try {
      const { orderId, customerId, leadTechnicianId, assistingTechnicians, scheduledDate, systemCapacityKw } = req.body;

      if (!orderId || !customerId || !leadTechnicianId) {
        return ApiResponse.badRequest(res, 'Order, customer, and lead technician are required.');
      }

      const installationNumber = `INS-${Date.now().toString().slice(-6)}-${Math.floor(100 + Math.random() * 900)}`;

      const installation = new Installation({
        installationNumber,
        order: orderId,
        customer: customerId,
        leadTechnician: leadTechnicianId,
        assistingTechnicians: assistingTechnicians || [],
        scheduledDate: scheduledDate ? new Date(scheduledDate) : new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
        status: INSTALLATION_STATUS.ASSIGNED,
        systemCapacityKw: Number(systemCapacityKw) || 3,
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

      // Link to order
      await Order.findByIdAndUpdate(orderId, { installation: installation._id });

      return ApiResponse.created(res, installation, 'Installation scheduled.');
    } catch (err) {
      next(err);
    }
  }

  /**
   * PUT /api/installations/:id/assign
   */
  static async assignTechnicians(req, res, next) {
    try {
      const { leadTechnicianId, assistingTechnicians } = req.body;
      const installation = await Installation.findById(req.params.id);

      if (!installation) {
        return ApiResponse.notFound(res, 'Installation job not found.');
      }

      if (leadTechnicianId) installation.leadTechnician = leadTechnicianId;
      if (assistingTechnicians) installation.assistingTechnicians = assistingTechnicians;

      await installation.save();
      return ApiResponse.success(res, installation, 'Technicians assigned to installation.');
    } catch (err) {
      next(err);
    }
  }

  // Operation aliases for frontend & technician actions
  static async startJob(req, res, next) {
    try {
      const updated = await InstallationService.startJob(req.params.id, req.user._id);
      return ApiResponse.success(res, updated, 'Installation job started.');
    } catch (err) {
      next(err);
    }
  }

  static async updateStep(req, res, next) {
    try {
      const { stepId, status, notes } = req.body;
      const updated = await InstallationService.updateStep(req.params.id, stepId, status, notes, req.user.name);
      return ApiResponse.success(res, updated, 'Step updated.');
    } catch (err) {
      next(err);
    }
  }

  static async uploadPhoto(req, res, next) {
    try {
      if (!req.file) {
        return ApiResponse.badRequest(res, 'No photo uploaded.');
      }
      const fileUrl = `/uploads/installations/${req.file.filename}`;
      const caption = req.body.caption || 'Installation site photo';
      const updated = await InstallationService.addPhoto(req.params.id, fileUrl, caption);
      return ApiResponse.success(res, updated, 'Photo uploaded.');
    } catch (err) {
      next(err);
    }
  }

  static async submitTesting(req, res, next) {
    try {
      const { vocVolts, iscAmperes, inverterSyncStatus, earthingResistanceOhms, generationCheckKw, comments } = req.body;
      const updated = await InstallationService.submitTesting(req.params.id, {
        vocVolts,
        iscAmperes,
        inverterSyncStatus,
        earthingResistanceOhms,
        generationCheckKw,
        comments,
        technicianName: req.user.name
      });
      return ApiResponse.success(res, updated, 'Electrical quality testing parameters saved.');
    } catch (err) {
      next(err);
    }
  }

  static async customerAcceptance(req, res, next) {
    try {
      const { signedName, signatureData, remarks, rating, customerAcceptance, testingResults } = req.body;
      
      if (testingResults) {
        await InstallationService.submitTesting(req.params.id, {
          ...testingResults,
          technicianName: req.user.name
        });
      }

      const acceptance = customerAcceptance || { signedName, signatureData, remarks, rating };

      const updated = await InstallationService.completeInstallation(req.params.id, {
        signedName: acceptance.signedName || 'Customer Acceptance Confirmed',
        signatureData: acceptance.signatureData || '',
        remarks: acceptance.remarks || '',
        rating: acceptance.rating || 5,
        technicianId: req.user._id
      });
      return ApiResponse.success(res, updated, 'Customer acceptance signed and installation completed.');
    } catch (err) {
      next(err);
    }
  }
}

module.exports = InstallationController;
