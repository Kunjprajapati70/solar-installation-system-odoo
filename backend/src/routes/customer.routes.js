const express = require('express');
const router = express.Router();
const CustomerController = require('../controllers/customer.controller');
const { protect } = require('../middleware/auth.middleware');
const { authorize } = require('../middleware/role.middleware');

router.use(protect);

router.get('/', CustomerController.listCustomers);
router.get('/:id', CustomerController.getById);
router.get('/:id/history', CustomerController.getCustomerHistory);
router.get('/:id/summary', CustomerController.getCustomerHistory); // Alias for frontend summary

router.post('/', authorize('admin', 'sales'), CustomerController.createCustomer);
router.put('/:id', authorize('admin', 'sales', 'customer'), CustomerController.updateCustomer);
router.delete('/:id', authorize('admin'), CustomerController.deleteCustomer);

module.exports = router;
