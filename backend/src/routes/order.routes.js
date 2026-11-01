const express = require('express');
const router = express.Router();
const OrderController = require('../controllers/order.controller');
const { protect } = require('../middleware/auth.middleware');
const { authorize } = require('../middleware/role.middleware');

router.use(protect);

router.get('/', OrderController.listOrders);
router.get('/:id', OrderController.getById);

router.post('/', authorize('admin', 'sales'), OrderController.createOrder);
router.put('/:id/status', authorize('admin', 'sales', 'technician'), OrderController.updateStatus);
router.post('/:id/stock-check', authorize('admin', 'sales', 'technician'), OrderController.stockCheck);
router.post('/:id/dispatch', authorize('admin', 'sales', 'technician'), OrderController.dispatchOrder);
router.post('/:id/confirm-delivery', authorize('admin', 'sales', 'technician'), OrderController.confirmDelivery);

module.exports = router;
