const express = require('express');
const router = express.Router();
const CustomerPortalController = require('../controllers/customerPortal.controller');
const { protect } = require('../middleware/auth.middleware');
const { authorize } = require('../middleware/role.middleware');

// All Customer Portal routes require authentication
router.use(protect);

// Specific Customer Portal Endpoints
router.get('/profile', CustomerPortalController.getProfile);
router.get('/orders', CustomerPortalController.getOrders);
router.get('/quotations', CustomerPortalController.getQuotations);
router.get('/payments', CustomerPortalController.getPayments);
router.get('/installations', CustomerPortalController.getInstallations);
router.get('/equipment', CustomerPortalController.getEquipment);
router.get('/warranties', CustomerPortalController.getWarranties);
router.get('/service-tickets', CustomerPortalController.getServiceTickets);
router.post('/service-tickets', CustomerPortalController.raiseServiceTicket);
router.get('/documents', CustomerPortalController.getDocuments);
router.get('/notifications', CustomerPortalController.getNotifications);

module.exports = router;
