const express = require('express');
const router = express.Router();
const TransactionController = require('../controllers/transaction.controller');
const { protect } = require('../middleware/auth.middleware');
const { authorize } = require('../middleware/role.middleware');

router.use(protect);

router.get('/', TransactionController.listExpenses);
router.post('/', authorize('admin', 'sales'), TransactionController.recordExpense);

module.exports = router;
