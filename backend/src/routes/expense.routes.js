const express = require('express');
const router = express.Router();
const TransactionController = require('../controllers/transaction.controller');
const { protect } = require('../middleware/auth.middleware');
const { authorize } = require('../middleware/role.middleware');

router.use(protect);

router.get('/', authorize('admin'), TransactionController.listExpenses);
router.post('/', authorize('admin'), TransactionController.recordExpense);

module.exports = router;
