const mongoose = require('mongoose');

const WarrantySchema = new mongoose.Schema(
  {
    certificateNumber: {
      type: String,
      unique: true,
      required: true
    },
    equipment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Equipment',
      required: true
    },
    serialNumber: {
      type: String,
      required: true,
      uppercase: true,
      index: true
    },
    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Customer',
      required: true
    },
    order: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Order',
      required: true
    },
    category: {
      type: String,
      enum: ['panel', 'inverter', 'battery', 'structure'],
      required: true
    },
    brand: String,
    model: String,
    durationYears: {
      type: Number,
      required: true
    },
    startDate: {
      type: Date,
      required: true // Triggered upon confirmed delivery
    },
    expiryDate: {
      type: Date,
      required: true
    },
    status: {
      type: String,
      enum: ['active', 'expired', 'claimed', 'void'],
      default: 'active'
    },
    coverageDetails: {
      type: String,
      default: 'Covers manufacturer defects, output performance degradation per standard SLA, and component failures.'
    },
    claimsHistory: [
      {
        ticketNumber: String,
        claimDate: Date,
        issueDescription: String,
        actionTaken: String,
        costCoveredByWarranty: Number,
        customerCharged: Number,
        resolvedAt: Date
      }
    ]
  },
  { 
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

WarrantySchema.pre('validate', function (next) {
  if (!this.certificateNumber) {
    this.certificateNumber = `WARR-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;
  }
  next();
});

// Method to verify if warranty is actively valid right now
WarrantySchema.methods.isValidNow = function () {
  const now = new Date();
  return this.status === 'active' && now >= this.startDate && now <= this.expiryDate;
};

WarrantySchema.index({ customer: 1 });
WarrantySchema.index({ status: 1, expiryDate: 1 });

module.exports = mongoose.model('Warranty', WarrantySchema);
