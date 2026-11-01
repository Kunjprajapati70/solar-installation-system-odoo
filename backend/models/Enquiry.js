const mongoose = require('mongoose');

const EnquirySchema = new mongoose.Schema(
  {
    enquiryNumber: {
      type: String,
      unique: true,
      required: true
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
    status: {
      type: String,
      enum: [
        'new',
        'assigned',
        'survey_scheduled',
        'survey_completed',
        'quoted',
        'converted',
        'won',
        'lost'
      ],
      default: 'new'
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
    followUpDate: Date
  },
  { timestamps: true }
);

module.exports = mongoose.model('Enquiry', EnquirySchema);
