const mongoose = require('mongoose');

const OrderSchema = new mongoose.Schema(
  {
    orderNumber: {
      type: String,
      unique: true,
      required: true
    },
    quotation: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Quotation',
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
    totalAmount: {
      type: Number,
      required: true
    },
    advanceRequired: {
      type: Number,
      required: true
    },
    advancePaid: {
      type: Number,
      default: 0
    },
    balanceAmount: {
      type: Number,
      required: true
    },
    paymentStatus: {
      type: String,
      enum: ['pending', 'advance_paid', 'partially_paid', 'fully_paid', 'paid'],
      default: 'pending'
    },
    orderStatus: {
      type: String,
      enum: [
        'confirmed',
        'stock_checked',
        'allocated',
        'dispatched',
        'in_installation',
        'installed',
        'delivery_confirmed',
        'completed',
        'rejected',
        'cancelled'
      ],
      default: 'confirmed'
    },
    rejectionReason: String,
    correctionNotes: String,
    allocatedEquipment: [
      {
        equipment: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Equipment'
        },
        serialNumber: String,
        category: String,
        brand: String,
        model: String
      }
    ],
    dispatchedAt: Date,
    deliveryConfirmedAt: Date,
    deliveryConfirmedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    deliveryAcceptanceNotes: String,
    installation: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Installation'
    },
    milestones: [
      {
        stageName: String,
        status: {
          type: String,
          enum: ['pending', 'in_progress', 'completed'],
          default: 'pending'
        },
        completedAt: Date,
        remarks: String
      }
    ]
  },
  { timestamps: true }
);

OrderSchema.index({ orderStatus: 1, createdAt: -1 });
OrderSchema.index({ paymentStatus: 1 });
OrderSchema.index({ customer: 1 });

module.exports = mongoose.model('Order', OrderSchema);
