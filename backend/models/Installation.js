const mongoose = require('mongoose');

const InstallationSchema = new mongoose.Schema(
  {
    installationNumber: {
      type: String,
      unique: true,
      required: true
    },
    order: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Order',
      required: true
    },
    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Customer',
      required: true
    },
    leadTechnician: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    assistingTechnicians: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      }
    ],
    scheduledDate: {
      type: Date,
      required: true
    },
    startedAt: Date,
    completedAt: Date,
    totalWorkingHours: {
      type: Number,
      default: 0
    },
    status: {
      type: String,
      enum: [
        'assigned',
        'in_progress',
        'testing_in_progress',
        'completed',
        'customer_accepted'
      ],
      default: 'assigned'
    },
    systemCapacityKw: {
      type: Number,
      required: true
    },
    steps: [
      {
        id: String,
        title: String,
        status: {
          type: String,
          enum: ['pending', 'in_progress', 'completed'],
          default: 'pending'
        },
        completedAt: Date,
        completedBy: String,
        notes: String
      }
    ],
    testingResults: {
      vocVolts: { type: Number, default: 0 },
      iscAmperes: { type: Number, default: 0 },
      inverterSyncStatus: {
        type: String,
        enum: ['pending', 'synced', 'failed'],
        default: 'pending'
      },
      earthingResistanceOhms: { type: Number, default: 0 },
      generationCheckKw: { type: Number, default: 0 },
      testedAt: Date,
      testedBy: String,
      comments: String
    },
    installationPhotos: [
      {
        url: String,
        caption: String,
        uploadedAt: { type: Date, default: Date.now }
      }
    ],
    customerAcceptance: {
      isAccepted: { type: Boolean, default: false },
      signedName: String,
      signatureData: String,
      remarks: String,
      rating: { type: Number, min: 1, max: 5 },
      acceptedAt: Date
    },
    rejectionReason: String,
    correctionNotes: String,
    adminApproval: {
      isApproved: { type: Boolean, default: false },
      approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      approvedAt: Date,
      notes: String
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Installation', InstallationSchema);
