const mongoose = require('mongoose');

const EnquirySchema = new mongoose.Schema(
  {
    enquiryNumber: {
      type: String,
      unique: true,
      required: true
    },
    leadId: {
      type: String,
      unique: true,
      sparse: true
    },
    customerName: {
      type: String,
      required: true,
      trim: true
    },
    email: {
      type: String,
      required: true,
      trim: true
    },
    phone: {
      type: String,
      required: true,
      trim: true
    },
    address: {
      street: String,
      city: String,
      state: String,
      pincode: String
    },
    proposedCapacityKw: {
      type: Number,
      required: true,
      min: 1,
      max: 100
    },
    systemType: {
      type: String,
      enum: ['on_grid', 'off_grid', 'hybrid'],
      default: 'on_grid'
    },
    monthlyElectricityBill: {
      type: Number,
      default: 0
    },
    leadSource: {
      type: String,
      enum: ['website', 'referral', 'cold_call', 'social_media', 'expo', 'partner', 'direct', 'other'],
      default: 'website'
    },
    status: {
      type: String,
      enum: [
        'new',
        'contacted',
        'follow_up_required',
        'site_survey_scheduled',
        'survey_scheduled', // Backward compatible
        'survey_completed',
        'quotation_sent',
        'quoted', // Backward compatible
        'assigned', // Backward compatible
        'converted',
        'won', // Backward compatible
        'rejected',
        'lost'
      ],
      default: 'new'
    },
    rejectionReason: String,
    archived: {
      type: Boolean,
      default: false
    },
    assignedSales: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    linkedCustomer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Customer'
    },
    notes: String,
    internalNotes: [
      {
        text: String,
        author: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        authorName: String,
        createdAt: { type: Date, default: Date.now }
      }
    ],
    leadHistory: [
      {
        fromStatus: String,
        toStatus: String,
        action: String,
        changedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        changedByName: String,
        changeDate: { type: Date, default: Date.now },
        notes: String
      }
    ],
    followUpDate: Date
  },
  { timestamps: true }
);

EnquirySchema.pre('validate', function (next) {
  if (!this.leadId && this.enquiryNumber) {
    this.leadId = this.enquiryNumber;
  }
  if (!this.enquiryNumber && this.leadId) {
    this.enquiryNumber = this.leadId;
  }
  if (!this.enquiryNumber) {
    const num = `ENQ-${Date.now().toString().slice(-6)}-${Math.floor(100 + Math.random() * 900)}`;
    this.enquiryNumber = num;
    this.leadId = num;
  }
  next();
});

module.exports = mongoose.model('Enquiry', EnquirySchema);
