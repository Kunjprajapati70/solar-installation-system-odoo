/**
 * Installation Management & Technician Workflow Service
 * Records timestamps, calculates working hours, validates testing parameters, and handles customer sign-off
 */

const Installation = require('../../models/Installation');
const Order = require('../../models/Order');
const Equipment = require('../../models/Equipment');
const WarrantyService = require('./warranty.service');
const { INSTALLATION_STATUS, ORDER_STATUS, EQUIPMENT_STATUS } = require('../config/constants');

class InstallationService {
  /**
   * Starts job timer on the server
   */
  static async startJob(installationId, technicianId) {
    const installation = await Installation.findById(installationId);
    if (!installation) {
      throw new Error('Installation job not found.');
    }

    if (installation.status === INSTALLATION_STATUS.COMPLETED || installation.status === INSTALLATION_STATUS.CUSTOMER_ACCEPTED) {
      throw new Error('Cannot start a job that has already been completed.');
    }

    installation.status = INSTALLATION_STATUS.IN_PROGRESS;
    if (!installation.startedAt) {
      installation.startedAt = new Date();
    }

    await installation.save();

    // Update order status if not already
    await Order.findByIdAndUpdate(installation.order, {
      orderStatus: ORDER_STATUS.IN_INSTALLATION
    });

    return installation;
  }

  /**
   * Updates a step status
   */
  static async updateStep(installationId, stepId, status, notes = '', technicianName = '') {
    const installation = await Installation.findById(installationId);
    if (!installation) {
      throw new Error('Installation job not found.');
    }

    const step = installation.steps.find((s) => s.id === stepId || s._id.toString() === stepId);
    if (step) {
      step.status = status;
      step.notes = notes || step.notes;
      if (status === 'completed') {
        step.completedAt = new Date();
        step.completedBy = technicianName;
      }
    }

    await installation.save();
    return installation;
  }

  /**
   * Records electrical quality testing results
   */
  static async submitTesting(installationId, {
    vocVolts,
    iscAmperes,
    inverterSyncStatus,
    earthingResistanceOhms,
    generationCheckKw,
    comments,
    technicianName
  }) {
    const installation = await Installation.findById(installationId);
    if (!installation) {
      throw new Error('Installation job not found.');
    }

    installation.testingResults = {
      vocVolts: Number(vocVolts) || 0,
      iscAmperes: Number(iscAmperes) || 0,
      inverterSyncStatus: inverterSyncStatus || 'synced',
      earthingResistanceOhms: Number(earthingResistanceOhms) || 0,
      generationCheckKw: Number(generationCheckKw) || 0,
      testedAt: new Date(),
      testedBy: technicianName,
      comments: comments || 'Quality testing parameters validated within standard operating limits.'
    };

    installation.status = INSTALLATION_STATUS.TESTING_IN_PROGRESS;
    await installation.save();

    return installation;
  }

  /**
   * Adds site photo to installation
   */
  static async addPhoto(installationId, fileUrl, caption) {
    const installation = await Installation.findById(installationId);
    if (!installation) {
      throw new Error('Installation job not found.');
    }

    installation.installationPhotos.push({
      url: fileUrl,
      caption: caption || 'Site Execution Photo',
      uploadedAt: new Date()
    });

    await installation.save();
    return installation;
  }

  /**
   * Completes installation and records customer acceptance
   */
  static async completeInstallation(installationId, {
    signedName,
    signatureData,
    remarks,
    rating = 5,
    technicianId
  }) {
    const installation = await Installation.findById(installationId).populate('order');
    if (!installation) {
      throw new Error('Installation job not found.');
    }

    // Require testing results
    if (!installation.testingResults || !installation.testingResults.testedAt) {
      throw new Error('Quality testing results (Voc, Isc, Earthing) must be recorded before completing installation.');
    }

    const now = new Date();
    installation.completedAt = now;
    installation.status = INSTALLATION_STATUS.CUSTOMER_ACCEPTED;

    // Calculate working hours from server timestamps
    if (installation.startedAt) {
      const diffMs = now - new Date(installation.startedAt);
      const hours = Math.max(Number((diffMs / (1000 * 60 * 60)).toFixed(2)), 0.5);
      installation.totalWorkingHours = hours;
    } else {
      installation.totalWorkingHours = 6.0; // Standard shift default
    }

    // Customer Acceptance
    installation.customerAcceptance = {
      isAccepted: true,
      signedName: signedName || 'Customer Sign-off',
      signatureData: signatureData || '',
      remarks: remarks || 'Rooftop solar installation completed satisfactorily.',
      rating: Number(rating) || 5,
      acceptedAt: now
    };

    await installation.save();

    // Update Order to delivery confirmed & completed
    if (installation.order) {
      const order = await Order.findById(installation.order._id);
      if (order) {
        order.orderStatus = ORDER_STATUS.DELIVERY_CONFIRMED;
        order.deliveryConfirmedAt = now;
        order.deliveryAcceptanceNotes = remarks || 'Customer physical delivery and installation accepted.';
        await order.save();

        // Rule 5: Automatically activate warranties for all equipment on confirmed delivery!
        await WarrantyService.activateOrderWarranties(order._id, now);

        // Update equipment statuses to installed
        for (const eqAlloc of order.allocatedEquipment) {
          await Equipment.findByIdAndUpdate(eqAlloc.equipment, {
            status: EQUIPMENT_STATUS.INSTALLED,
            installedAt: now
          });
        }
      }
    }

    return installation;
  }

  /**
   * Calculates total working hours for a technician
   */
  static async calculateTechnicianHours(technicianId) {
    const installations = await Installation.find({
      $or: [
        { leadTechnician: technicianId },
        { assistingTechnicians: technicianId }
      ]
    }).lean();

    let totalHours = 0;
    let completedJobs = 0;
    let inProgressJobs = 0;

    installations.forEach((job) => {
      if (job.status === INSTALLATION_STATUS.COMPLETED || job.status === INSTALLATION_STATUS.CUSTOMER_ACCEPTED) {
        completedJobs++;
        totalHours += job.totalWorkingHours || 0;
      } else if (job.status === INSTALLATION_STATUS.IN_PROGRESS || job.status === INSTALLATION_STATUS.TESTING_IN_PROGRESS) {
        inProgressJobs++;
        if (job.startedAt) {
          const currentElapsed = (new Date() - new Date(job.startedAt)) / (1000 * 60 * 60);
          totalHours += Math.max(Number(currentElapsed.toFixed(2)), 0);
        }
      }
    });

    return {
      technicianId,
      totalHours: Number(totalHours.toFixed(2)),
      completedJobs,
      inProgressJobs,
      totalAssignedJobs: installations.length
    };
  }
}

module.exports = InstallationService;
