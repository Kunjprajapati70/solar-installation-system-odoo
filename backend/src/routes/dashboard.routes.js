const express = require('express');
const router = express.Router();
const DashboardController = require('../controllers/dashboard.controller');
const { protect } = require('../middleware/auth.middleware');
const { authorize } = require('../middleware/role.middleware');

router.use(protect);
router.use(authorize('admin', 'sales'));

router.get('/', DashboardController.getFullDashboard);
router.get('/comprehensive', DashboardController.getComprehensiveAnalytics);
router.get('/dashboard', DashboardController.getFullDashboard);
router.get('/stats', DashboardController.getStats);
router.get('/revenue-expenses', DashboardController.getRevenueExpenses);
router.get('/installations', DashboardController.getInstallations);
router.get('/capacity', DashboardController.getCapacity);
router.get('/service-tickets', DashboardController.getServiceTickets);
router.get('/inventory', DashboardController.getInventory);

module.exports = router;
