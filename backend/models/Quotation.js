const mongoose = require('mongoose');

const QuotationSchema = new mongoose.Schema(
  {
    quotationNumber: {
      type: String,
      unique: true,
      required: true
    },
    siteSurvey: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'SiteSurvey',
      required: true
    },
    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Customer',
      required: true
    },
    systemCapacityKw: {
      type: Number,
      required: true
    },
    systemType: {
      type: String,
      enum: ['on_grid', 'off_grid', 'hybrid'],
      required: true
    },
    bom: [
      {
        category: {
          type: String,
          enum: ['panel', 'inverter', 'battery', 'structure', 'cables', 'accessories'],
          required: true
        },
        itemName: { type: String, required: true },
        specs: String,
        quantity: { type: Number, required: true },
        unit: { type: String, default: 'pcs' },
        unitPrice: { type: Number, required: true },
        totalPrice: { type: Number, required: true }
      }
    ],
    pricing: {
      equipmentTotal: { type: Number, required: true },
      installationLabour: { type: Number, required: true },
      transportAndLiaison: { type: Number, default: 5000 },
      grossTotal: { type: Number, required: true },
      estimatedSubsidy: { type: Number, default: 0 },
      netPayable: { type: Number, required: true }
    },
    paymentTerms: {
      advancePercent: { type: Number, default: 30 },
      deliveryPercent: { type: Number, default: 50 },
      installationCompletePercent: { type: Number, default: 20 }
    },
    status: {
      type: String,
      enum: ['draft', 'sent', 'approved', 'rejected', 'converted'],
      default: 'draft'
    },
    approvedAt: Date,
    validUntil: {
      type: Date,
      default: () => new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
    },
    notes: String,
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  },
  { 
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

QuotationSchema.pre('validate', function(next) {
  if (this.bom && Array.isArray(this.bom)) {
    this.bom.forEach(item => {
      if (!item.itemName && item.name) item.itemName = item.name;
      if (!item.name && item.itemName) item.name = item.itemName;
    });
  }
  if (this.pricing) {
    if (this.pricing.laborCost !== undefined && this.pricing.installationLabour === undefined) {
      this.pricing.installationLabour = this.pricing.laborCost;
    }
    if (this.pricing.installationLabour !== undefined && this.pricing.laborCost === undefined) {
      this.pricing.laborCost = this.pricing.installationLabour;
    }
    if (this.pricing.transportCost !== undefined && this.pricing.transportAndLiaison === undefined) {
      this.pricing.transportAndLiaison = this.pricing.transportCost;
    }
  }
  next();
});

QuotationSchema.index({ status: 1, createdAt: -1 });
QuotationSchema.index({ customer: 1 });
QuotationSchema.index({ siteSurvey: 1 });

module.exports = mongoose.model('Quotation', QuotationSchema);
