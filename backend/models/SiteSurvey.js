const mongoose = require('mongoose');

const SiteSurveySchema = new mongoose.Schema(
  {
    surveyNumber: {
      type: String,
      unique: true,
      required: true
    },
    enquiry: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Enquiry',
      required: true
    },
    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Customer'
    },
    surveyor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    scheduledDate: {
      type: Date,
      required: true
    },
    completedDate: Date,
    status: {
      type: String,
      enum: ['scheduled', 'in_progress', 'completed', 'approved', 'rejected'],
      default: 'scheduled'
    },
    roofDetails: {
      roofType: {
        type: String,
        enum: ['flat_rcc', 'sloped_tin', 'clay_tile', 'metal_sheet', 'rcc_flat', 'tin_shed', 'tiled', 'elevated'],
        default: 'flat_rcc'
      },
      totalRoofAreaSqft: { type: Number, default: 800 },
      shadowFreeAreaSqft: { type: Number, default: 600 },
      orientation: { type: String, default: 'South' },
      tiltAngleDeg: { type: Number, default: 22 },
      azimuthDeg: { type: Number, default: 180 },
      structuralIntegrity: {
        type: String,
        enum: ['excellent', 'good', 'moderate', 'needs_reinforcement'],
        default: 'good'
      }
    },
    electricalDetails: {
      phase: {
        type: String,
        enum: ['single', 'three', 'single_phase', 'three_phase'],
        default: 'single'
      },
      sanctionedLoadKw: { type: Number, default: 3 },
      existingMeterType: {
        type: String,
        enum: ['analog', 'digital_electronic', 'smart_meter', 'digital_bidirectional'],
        default: 'digital_electronic'
      },
      earthingStatus: {
        type: String,
        enum: ['good', 'required', 'existing_needs_upgrade', 'adequate'],
        default: 'required'
      },
      distanceToPanelMeters: { type: Number, default: 15 }
    },
    photos: [
      {
        url: String,
        caption: String,
        uploadedAt: { type: Date, default: Date.now }
      }
    ],
    surveyorNotes: String,
    approvalDetails: {
      isApproved: { type: Boolean, default: false },
      approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      approvedAt: Date,
      approvalNotes: String,
      recommendedCapacityKw: Number,
      recommendedSystemType: {
        type: String,
        enum: ['on_grid', 'off_grid', 'hybrid']
      }
    }
  },
  { timestamps: true }
);

SiteSurveySchema.index({ status: 1, scheduledDate: -1 });
SiteSurveySchema.index({ customer: 1 });
SiteSurveySchema.index({ surveyor: 1 });

module.exports = mongoose.model('SiteSurvey', SiteSurveySchema);
