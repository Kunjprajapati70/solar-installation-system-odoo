const mongoose = require('mongoose');

const EquipmentSchema = new mongoose.Schema(
  {
    serialNumber: {
      type: String,
      unique: true,
      required: true,
      uppercase: true,
      trim: true
    },
    qrCodeData: {
      type: String,
      required: true
    },
    qrCodeImage: {
      type: String // Data URL
    },
    category: {
      type: String,
      enum: ['panel', 'inverter', 'battery', 'structure'],
      required: true
    },
    inventoryItem: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Inventory'
    },
    brand: {
      type: String,
      required: true
    },
    model: {
      type: String,
      required: true
    },
    specifications: {
      wattage: Number,
      capacityAh: Number,
      voltage: Number,
      warrantyYears: Number,
      details: String
    },
    status: {
      type: String,
      enum: ['in_stock', 'reserved', 'dispatched', 'installed', 'under_service'],
      default: 'in_stock'
    },
    allocatedToOrder: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Order'
    },
    installedAtCustomer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Customer'
    },
    dispatchedAt: Date,
    installedAt: Date,
    movementHistory: [
      {
        action: {
          type: String,
          required: true
        },
        timestamp: {
          type: Date,
          default: Date.now
        },
        performedBy: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User'
        },
        performedByName: String,
        notes: String,
        fromStatus: String,
        toStatus: String,
        location: String
      }
    ],
    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Customer'
    },
    order: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Order'
    }
  },
  { 
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

EquipmentSchema.pre('save', function (next) {
  if (this.customer && !this.installedAtCustomer) {
    this.installedAtCustomer = this.customer;
  }
  if (this.order && !this.allocatedToOrder) {
    this.allocatedToOrder = this.order;
  }
  if (!this.qrCodeData && this.serialNumber) {
    this.qrCodeData = JSON.stringify({ serialNumber: this.serialNumber, brand: this.brand, model: this.model });
  }
  next();
});

EquipmentSchema.index({ category: 1, status: 1 });
EquipmentSchema.index({ allocatedToOrder: 1 });
EquipmentSchema.index({ installedAtCustomer: 1 });

module.exports = mongoose.model('Equipment', EquipmentSchema);
