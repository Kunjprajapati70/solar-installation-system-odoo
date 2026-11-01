const express = require('express');
const router = express.Router();
const DashboardController = require('../controllers/dashboard.controller');
const { protect } = require('../middleware/auth.middleware');
const { authorize } = require('../middleware/role.middleware');

router.use(protect);

router.get('/summary', authorize('admin', 'sales'), DashboardController.getReportsSummary);
router.get('/profitability', authorize('admin'), DashboardController.getProfitabilityReport);
router.get('/technician-hours', authorize('admin', 'technician'), DashboardController.getTechnicianHours);

module.exports = router;
