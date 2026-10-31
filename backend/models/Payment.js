const mongoose = require('mongoose');

const PaymentSchema = new mongoose.Schema(
  {
    receiptNumber: {
      type: String,
      unique: true,
      required: true
    },
    order: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Order'
    },
    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Customer',
      required: true
    },
    amount: {
      type: Number,
      required: true
    },
    paymentType: {
      type: String,
      enum: ['advance', 'milestone', 'final', 'service_fee'],
      required: true
    },
    paymentMethod: {
      type: String,
      enum: ['upi', 'bank_transfer', 'cheque', 'cash', 'card'],
      default: 'bank_transfer'
    },
    transactionReference: {
      type: String,
      required: true
    },
    status: {
      type: String,
      enum: ['pending', 'completed', 'failed'],
      default: 'completed'
    },
    paidAt: {
      type: Date,
      default: Date.now
    },
    notes: String
  },
  { 
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

PaymentSchema.pre('validate', function (next) {
  if (!this.receiptNumber) {
    this.receiptNumber = `REC-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;
  }
  if (!this.transactionReference) {
    this.transactionReference = `TXN-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`;
  }
  next();
});

module.exports = mongoose.model('Payment', PaymentSchema);
