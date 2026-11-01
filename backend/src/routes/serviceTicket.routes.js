const express = require('express');
const router = express.Router();
const ServiceTicketController = require('../controllers/serviceTicket.controller');
const { protect } = require('../middleware/auth.middleware');
const { authorize } = require('../middleware/role.middleware');

router.use(protect);

router.get('/', ServiceTicketController.listTickets);
router.get('/:id', ServiceTicketController.getById);

// Creation allowed for customers, sales, admins
router.post('/', ServiceTicketController.createTicket);

// Updating & Assignment
router.put('/:id', authorize('admin', 'technician'), ServiceTicketController.updateTicket);
router.put('/:id/assign', authorize('admin'), ServiceTicketController.assignTechnician);
router.post('/:id/assign', authorize('admin'), ServiceTicketController.assignTechnician);
router.put('/:id/resolve', authorize('admin', 'technician'), ServiceTicketController.resolveTicket);
router.post('/:id/resolve', authorize('admin', 'technician'), ServiceTicketController.resolveTicket);

module.exports = router;
