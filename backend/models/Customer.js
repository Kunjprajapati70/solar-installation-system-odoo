const mongoose = require('mongoose');

const CustomerSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    customerCode: {
      type: String,
      unique: true,
      required: true
    },
    name: {
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
    installationAddress: {
      street: { type: String, required: true },
      city: { type: String, required: true },
      state: { type: String, required: true },
      pincode: { type: String, required: true },
      landmark: String,
      coordinates: {
        lat: Number,
        lng: Number
      }
    },
    connectionType: {
      type: String,
      enum: ['on_grid', 'off_grid', 'hybrid'],
      default: 'on_grid'
    },
    sanctionedLoadKw: {
      type: Number,
      default: 3
    },
    discomName: {
      type: String,
      default: 'State Electricity Distribution Co.'
    },
    consumerNumber: {
      type: String,
      trim: true
    },
    currentPhase: {
      type: String,
      enum: ['single', 'three'],
      default: 'single'
    },
    notes: String
  },
  { timestamps: true }
);

CustomerSchema.index({ name: 'text', email: 'text', phone: 'text' });
CustomerSchema.index({ phone: 1 });
CustomerSchema.index({ email: 1 });

module.exports = mongoose.model('Customer', CustomerSchema);
