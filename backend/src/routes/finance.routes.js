const express = require('express');
const router = express.Router();
const TransactionController = require('../controllers/transaction.controller');
const { protect } = require('../middleware/auth.middleware');

router.use(protect);
router.get('/summary', TransactionController.getFinanceSummary);

module.exports = router;
