const express = require('express');
const router = express.Router();
const DashboardController = require('../controllers/dashboard.controller');
const { protect } = require('../middleware/auth.middleware');

router.use(protect);

router.get('/dashboard', DashboardController.getFullDashboard);
router.get('/stats', DashboardController.getStats);
router.get('/revenue-expenses', DashboardController.getRevenueExpenses);
router.get('/installations', DashboardController.getInstallations);
router.get('/capacity', DashboardController.getCapacity);
router.get('/service-tickets', DashboardController.getServiceTickets);
router.get('/inventory', DashboardController.getInventory);

module.exports = router;
