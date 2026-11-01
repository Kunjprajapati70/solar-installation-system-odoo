const express = require('express');
const router = express.Router();
const TransactionController = require('../controllers/transaction.controller');
const { protect } = require('../middleware/auth.middleware');
const { authorize } = require('../middleware/role.middleware');

router.use(protect);
router.get('/summary', authorize('admin'), TransactionController.getFinanceSummary);

module.exports = router;
