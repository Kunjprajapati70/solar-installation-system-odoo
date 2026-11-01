const express = require('express');
const router = express.Router();
const Expense = require('../models/Expense');
const { protect, authorize } = require('../middleware/auth');

// @route   GET /api/expenses
router.get('/', protect, authorize('admin'), async (req, res) => {
  try {
    const { category, search } = req.query;
    let query = {};
    if (category) query.category = category;
    if (search) {
      query.$or = [
        { payee: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { expenseNumber: { $regex: search, $options: 'i' } }
      ];
    }

    const expenses = await Expense.find(query)
      .populate('order', 'orderNumber')
      .populate('loggedBy', 'name email')
      .sort({ expenseDate: -1 });

    const totalAmount = expenses.reduce((sum, e) => sum + e.amount, 0);

    res.json({ success: true, count: expenses.length, totalAmount, data: expenses });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   POST /api/expenses
router.post('/', protect, authorize('admin'), async (req, res) => {
  try {
    const count = await Expense.countDocuments();
    const expenseNumber = `EXP-2026-${String(count + 1).padStart(5, '0')}`;

    const expense = await Expense.create({
      ...req.body,
      expenseNumber,
      loggedBy: req.user.id
    });

    res.status(201).json({ success: true, data: expense });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
