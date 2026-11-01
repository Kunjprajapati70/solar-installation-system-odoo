const express = require('express');
const router = express.Router();
const TransactionController = require('../controllers/transaction.controller');
const { protect } = require('../middleware/auth.middleware');
const { authorize } = require('../middleware/role.middleware');

router.use(protect);

router.get('/', TransactionController.listTransactions);
router.get('/:id', TransactionController.getById);
router.post('/', authorize('admin', 'sales'), TransactionController.recordTransaction);
router.post('/demo', authorize('admin', 'sales', 'customer'), TransactionController.recordDemoPayment);

module.exports = router;
