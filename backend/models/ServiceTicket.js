const mongoose = require('mongoose');

const ServiceTicketSchema = new mongoose.Schema(
  {
    ticketNumber: {
      type: String,
      unique: true,
      required: true
    },
    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Customer',
      required: true
    },
    equipmentSerialNumber: {
      type: String,
      required: true,
      uppercase: true,
      trim: true
    },
    warranty: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Warranty'
    },
    warrantyStatusAtTicket: {
      type: String,
      enum: ['in_warranty', 'out_of_warranty', 'no_warranty_record'],
      default: 'in_warranty'
    },
    issueCategory: {
      type: String,
      enum: [
        'inverter_fault',
        'generation_drop',
        'physical_damage',
        'grid_sync_issue',
        'cable_earthing_fault',
        'battery_backup_drop',
        'routine_maintenance'
      ],
      required: true
    },
    priority: {
      type: String,
      enum: ['low', 'medium', 'high', 'critical'],
      default: 'medium'
    },
    title: {
      type: String,
      required: true
    },
    description: {
      type: String,
      required: true
    },
    photos: [String],
    assignedTechnician: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    status: {
      type: String,
      enum: [
        'open',
        'technician_assigned',
        'in_progress',
        'parts_awaited',
        'resolved',
        'closed'
      ],
      default: 'open'
    },
    charges: {
      partsCost: { type: Number, default: 0 },
      labourCost: { type: Number, default: 0 },
      discountAmount: { type: Number, default: 0 },
      totalCustomerPayable: { type: Number, default: 0 } // Must be 0 if in_warranty
    },
    resolutionDetails: {
      actionTaken: String,
      partsReplaced: [String],
      resolvedAt: Date,
      resolutionNotes: String,
      technicianRemarks: String
    }
  },
  { 
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

ServiceTicketSchema.pre('validate', function (next) {
  if (!this.ticketNumber) {
    this.ticketNumber = `TCK-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;
  }
  if (!this.title && this.issueCategory) {
    this.title = `Service Request: ${this.issueCategory.replace(/_/g, ' ').toUpperCase()}`;
  }
  if (this.warrantyStatusAtTicket === 'in_warranty' && this.charges) {
    this.charges.totalCustomerPayable = 0;
  }
  next();
});

ServiceTicketSchema.index({ status: 1, priority: 1, createdAt: -1 });
ServiceTicketSchema.index({ customer: 1 });
ServiceTicketSchema.index({ equipmentSerialNumber: 1 });

module.exports = mongoose.model('ServiceTicket', ServiceTicketSchema);
