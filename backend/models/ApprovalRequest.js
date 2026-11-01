const mongoose = require('mongoose');

const ApprovalRequestSchema = new mongoose.Schema(
  {
    requestNumber: {
      type: String,
      unique: true,
      required: true
    },
    requestType: {
      type: String,
      enum: [
        'user_creation',
        'customer_creation',
        'lead_approval',
        'survey_approval',
        'quotation_approval',
        'order_dispatch',
        'installation_completion',
        'warranty_claim',
        'service_ticket',
        'subsidy_document',
        'expense_approval'
      ],
      required: true
    },
    title: {
      type: String,
      required: true
    },
    description: String,
    referenceId: {
      type: mongoose.Schema.Types.ObjectId
    },
    referenceModel: {
      type: String
    },
    requestedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    requestedByName: String,
    requestedByRole: String,
    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    reviewedByName: String,
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected', 'corrections_requested'],
      default: 'pending'
    },
    rejectionReason: String,
    correctionNotes: String,
    reviewNotes: String,
    requestDate: {
      type: Date,
      default: Date.now
    },
    reviewDate: Date,
    payload: {
      type: mongoose.Schema.Types.Mixed
    },
    auditTrail: [
      {
        action: String,
        fromStatus: String,
        toStatus: String,
        performedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        performedByName: String,
        timestamp: { type: Date, default: Date.now },
        notes: String
      }
    ]
  },
  { timestamps: true }
);

ApprovalRequestSchema.pre('validate', function (next) {
  if (!this.requestNumber) {
    this.requestNumber = `REQ-${Date.now().toString().slice(-6)}-${Math.floor(100 + Math.random() * 900)}`;
  }
  next();
});

ApprovalRequestSchema.index({ status: 1, requestDate: -1 });
ApprovalRequestSchema.index({ requestType: 1, status: 1 });
ApprovalRequestSchema.index({ requestedBy: 1 });

module.exports = mongoose.model('ApprovalRequest', ApprovalRequestSchema);
