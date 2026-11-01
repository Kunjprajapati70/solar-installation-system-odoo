const mongoose = require('mongoose');

const SettingSchema = new mongoose.Schema(
  {
    companyName: {
      type: String,
      default: 'SunPower Solutions'
    },
    tagline: {
      type: String,
      default: 'Engineering High-Efficiency Solar Rooftops'
    },
    contactEmail: {
      type: String,
      default: 'support@sunpowersolutions.com'
    },
    contactPhone: {
      type: String,
      default: '+91 98765 43210'
    },
    address: {
      type: String,
      default: 'Solar Innovation Tower, Renewable Energy Park, Phase II'
    },
    gstNumber: {
      type: String,
      default: '27AABCU9603R1ZX'
    },
    warrantyDurationsYears: {
      panel: { type: Number, default: 25 },
      inverter: { type: Number, default: 5 },
      battery: { type: Number, default: 3 },
      structure: { type: Number, default: 10 }
    },
    subsidySlabs: [
      {
        minKw: Number,
        maxKw: Number,
        subsidyAmount: Number,
        scheme: String
      }
    ],
    standardRates: {
      panelCostPerWatt: { type: Number, default: 28 },
      inverterCostPerKw: { type: Number, default: 11000 },
      labourCostPerKw: { type: Number, default: 4500 },
      structureCostPerKw: { type: Number, default: 3500 },
      wiringCostPerKw: { type: Number, default: 2000 }
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Setting', SettingSchema);
