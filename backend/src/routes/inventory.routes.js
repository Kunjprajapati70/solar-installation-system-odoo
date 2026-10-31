const express = require('express');
const router = express.Router();
const InventoryController = require('../controllers/inventory.controller');
const { protect } = require('../middleware/auth.middleware');
const { authorize } = require('../middleware/role.middleware');

router.use(protect);

router.get('/', InventoryController.listInventory);
router.get('/:id', InventoryController.getById);

router.post('/', authorize('admin', 'sales'), InventoryController.createInventory);
router.put('/:id', authorize('admin', 'sales'), InventoryController.updateInventory);

// Support both /replenish and /restock paths
router.post('/:id/replenish', authorize('admin', 'sales'), InventoryController.replenishStock);
router.post('/:id/restock', authorize('admin', 'sales'), InventoryController.replenishStock);

module.exports = router;
