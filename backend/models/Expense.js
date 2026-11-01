const mongoose = require('mongoose');

const ExpenseSchema = new mongoose.Schema(
  {
    expenseNumber: {
      type: String,
      unique: true,
      required: true
    },
    category: {
      type: String,
      enum: [
        'equipment_procurement',
        'technician_labour',
        'transportation_logistics',
        'site_survey',
        'permits_and_liaison',
        'tools_and_safety_gear',
        'marketing_sales',
        'general_overhead'
      ],
      required: true
    },
    order: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Order'
    },
    amount: {
      type: Number,
      required: true
    },
    payee: {
      type: String,
      required: true
    },
    description: {
      type: String,
      required: true
    },
    receiptUrl: String,
    expenseDate: {
      type: Date,
      default: Date.now
    },
    loggedBy: {
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

ExpenseSchema.pre('validate', function (next) {
  if (!this.expenseNumber) {
    this.expenseNumber = `EXP-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;
  }
  next();
});

module.exports = mongoose.model('Expense', ExpenseSchema);
