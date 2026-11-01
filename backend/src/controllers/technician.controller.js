/**
 * Technician Portal & Installation Controller
 * Enforces role restrictions, technician job assignment, and timestamped progress tracking
 */

const Installation = require('../../models/Installation');
const User = require('../../models/User');
const InstallationService = require('../services/installation.service');
const ApiResponse = require('../utils/apiResponse');

class TechnicianController {
  /**
   * GET /api/technicians/me/jobs
   * Retrieves installations assigned to authenticated technician
   */
  static async getMyJobs(req, res, next) {
    try {
      const technicianId = req.user._id;
      const query = {
        $or: [
          { leadTechnician: technicianId },
          { assistingTechnicians: technicianId }
        ]
      };

      // Optional status filter
      if (req.query.status) {
        query.status = req.query.status;
      }

      const jobs = await Installation.find(query)
        .populate('customer')
        .populate('order')
        .sort({ scheduledDate: -1 });

      return ApiResponse.success(res, jobs, 'Assigned technician jobs retrieved');
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/technicians/me/jobs/:id
   */
  static async getJobById(req, res, next) {
    try {
      const job = await Installation.findById(req.params.id)
        .populate('customer')
        .populate('order')
        .populate('leadTechnician', 'name phone email')
        .populate('assistingTechnicians', 'name phone');

      if (!job) {
        return ApiResponse.notFound(res, 'Installation job not found.');
      }

      // Check assignment if user is technician
      if (req.user.role === 'technician') {
        const isLead = job.leadTechnician && job.leadTechnician._id.toString() === req.user._id.toString();
        const isAssisting = job.assistingTechnicians?.some(
          (t) => t._id.toString() === req.user._id.toString()
        );
        if (!isLead && !isAssisting) {
          return ApiResponse.forbidden(res, 'Access denied: You are not assigned to this job.');
        }
      }

      return ApiResponse.success(res, job);
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/technicians/me/hours
   * Calculates working hours from stored server timestamps
   */
  static async getMyHours(req, res, next) {
    try {
      const hoursData = await InstallationService.calculateTechnicianHours(req.user._id);
      return ApiResponse.success(res, hoursData, 'Technician working hours retrieved');
    } catch (err) {
      next(err);
    }
  }

  /**
   * POST /api/installations/:id/start (and /start-job)
   */
  static async startJob(req, res, next) {
    try {
      const updated = await InstallationService.startJob(req.params.id, req.user._id);
      return ApiResponse.success(res, updated, 'Installation job started. Timer is running.');
    } catch (err) {
      next(err);
    }
  }

  /**
   * PUT /api/installations/:id/progress (and /update-step)
   */
  static async updateProgress(req, res, next) {
    try {
      const { stepId, status, notes } = req.body;
      const updated = await InstallationService.updateStep(
        req.params.id,
        stepId,
        status,
        notes,
        req.user.name
      );
      return ApiResponse.success(res, updated, 'Step progress updated.');
    } catch (err) {
      next(err);
    }
  }

  /**
   * POST /api/installations/:id/photos (and /photo)
   */
  static async uploadPhoto(req, res, next) {
    try {
      if (!req.file) {
        return ApiResponse.badRequest(res, 'No photo uploaded.');
      }
      const fileUrl = `/uploads/installations/${req.file.filename}`;
      const caption = req.body.caption || 'Site execution photo';

      const updated = await InstallationService.addPhoto(req.params.id, fileUrl, caption);
      return ApiResponse.success(res, updated, 'Installation photo attached successfully.');
    } catch (err) {
      next(err);
    }
  }

  /**
   * PUT /api/installations/:id/testing (and /testing-results)
   */
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
      return ApiResponse.success(res, updated, 'Electrical testing parameters recorded.');
    } catch (err) {
      next(err);
    }
  }

  /**
   * POST /api/installations/:id/complete (and /customer-acceptance)
   */
  static async completeJob(req, res, next) {
    try {
      const { signedName, signatureData, remarks, rating } = req.body;
      const updated = await InstallationService.completeInstallation(req.params.id, {
        signedName,
        signatureData,
        remarks,
        rating,
        technicianId: req.user._id
      });
      return ApiResponse.success(
        res,
        updated,
        'Installation completed and customer acceptance recorded! Delivery confirmed.'
      );
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/technicians
   * Lists all technician profiles (for admin assignment)
   */
  static async listTechnicians(req, res, next) {
    try {
      const technicians = await User.find({ role: 'technician' })
        .select('-password')
        .sort({ name: 1 });
      return ApiResponse.success(res, technicians);
    } catch (err) {
      next(err);
    }
  }
}

module.exports = TechnicianController;
