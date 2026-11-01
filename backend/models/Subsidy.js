const mongoose = require('mongoose');

const SubsidySchema = new mongoose.Schema(
  {
    applicationNumber: {
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
    portalScheme: {
      type: String,
      default: 'PM Surya Ghar: Muft Bijli Yojana'
    },
    stateDiscom: {
      type: String,
      required: true
    },
    consumerNumber: {
      type: String,
      required: true
    },
    capacityKw: {
      type: Number,
      required: true
    },
    subsidyEligibleAmount: {
      type: Number,
      required: true
    },
    subsidyDisbursedAmount: {
      type: Number,
      default: 0
    },
    status: {
      type: String,
      enum: [
        'application_submitted',
        'feasibility_approved',
        'meter_installation_passed',
        'inspection_completed',
        'subsidy_approved',
        'disbursed'
      ],
      default: 'application_submitted'
    },
    documents: [
      {
        docType: {
          type: String,
          enum: [
            'electricity_bill',
            'aadhaar_card',
            'bank_passbook_cancelled_cheque',
            'roof_ownership_proof',
            'net_meter_test_report',
            'commissioning_certificate'
          ]
        },
        fileName: String,
        fileUrl: String,
        verified: { type: Boolean, default: false }
      }
    ],
    applicationDate: {
      type: Date,
      default: Date.now
    },
    disbursementDate: Date,
    discomOfficerNotes: String
  },
  { timestamps: true }
);

module.exports = mongoose.model('Subsidy', SubsidySchema);
