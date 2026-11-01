const mongoose = require('mongoose');

const InventorySchema = new mongoose.Schema(
  {
    itemCode: {
      type: String,
      unique: true,
      required: true,
      trim: true
    },
    name: {
      type: String,
      required: true,
      trim: true
    },
    category: {
      type: String,
      enum: ['panel', 'inverter', 'battery', 'structure', 'cables', 'accessories'],
      required: true
    },
    brand: {
      type: String,
      required: true,
      trim: true
    },
    model: {
      type: String,
      required: true,
      trim: true
    },
    description: {
      type: String,
      default: ''
    },
    specifications: {
      wattage: Number,
      efficiencyPercent: Number,
      capacityAh: Number,
      voltage: Number,
      warrantyYears: { type: Number, default: 5 },
      dimensions: String
    },
    unit: {
      type: String,
      default: 'pcs'
    },
    currentStock: {
      type: Number,
      default: 0,
      min: 0
    },
    reservedStock: {
      type: Number,
      default: 0,
      min: 0
    },
    availableStock: {
      type: Number,
      default: 0
    },
    reorderLevel: {
      type: Number,
      default: 10
    },
    unitCostPrice: {
      type: Number,
      required: true
    },
    unitSellingPrice: {
      type: Number,
      required: true
    },
    supplier: {
      name: { type: String, default: '' },
      contact: { type: String, default: '' }
    },
    isActive: {
      type: Boolean,
      default: true
    }
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// Virtual field compatibility aliases
InventorySchema.virtual('equipmentName')
  .get(function () { return this.name; })
  .set(function (val) { this.name = val; });

InventorySchema.virtual('purchasePrice')
  .get(function () { return this.unitCostPrice; })
  .set(function (val) { this.unitCostPrice = val; });

InventorySchema.virtual('sellingPrice')
  .get(function () { return this.unitSellingPrice; })
  .set(function (val) { this.unitSellingPrice = val; });

InventorySchema.virtual('availableQuantity')
  .get(function () { return this.availableStock || this.currentStock; })
  .set(function (val) { this.currentStock = val; });

InventorySchema.virtual('minimumStock')
  .get(function () { return this.reorderLevel; })
  .set(function (val) { this.reorderLevel = val; });

InventorySchema.virtual('warrantyDurationMonths')
  .get(function () { return (this.specifications?.warrantyYears || 5) * 12; })
  .set(function (val) {
    if (!this.specifications) this.specifications = {};
    this.specifications.warrantyYears = Math.round(Number(val) / 12);
  });

// Pre-save hook to calculate availableStock and ensure itemCode
InventorySchema.pre('save', function (next) {
  if (!this.itemCode) {
    this.itemCode = `SKU-${this.category.toUpperCase().slice(0, 3)}-${Date.now().toString().slice(-5)}`;
  }
  this.availableStock = Math.max(0, (this.currentStock || 0) - (this.reservedStock || 0));
  next();
});

module.exports = mongoose.model('Inventory', InventorySchema);
