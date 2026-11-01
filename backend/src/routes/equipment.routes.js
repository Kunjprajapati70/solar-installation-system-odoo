const express = require('express');
const router = express.Router();
const EquipmentController = require('../controllers/equipment.controller');
const { protect } = require('../middleware/auth.middleware');
const { authorize } = require('../middleware/role.middleware');

// Public lookup for QR scanner verification (or protected with standard auth)
router.get('/serial/:serialNumber', EquipmentController.getBySerialNumber);
router.get('/lookup/:serialNumber', EquipmentController.getBySerialNumber);

// All state-changing routes require authentication
router.use(protect);

router.get('/', EquipmentController.listEquipment);
router.get('/dropdown', EquipmentController.getDropdownOptions);
router.post('/generate', authorize('admin', 'inventory_manager', 'sales'), EquipmentController.generateBatch);
router.get('/:id', EquipmentController.getById);
router.get('/:id/qr', EquipmentController.getQrCode);
router.get('/:id/history', EquipmentController.getHistory);

router.post('/', authorize('admin', 'sales'), EquipmentController.registerEquipment);
router.post('/:id/dispatch', authorize('admin', 'sales'), EquipmentController.dispatchEquipment);
router.post('/:id/deliver', authorize('admin', 'technician'), EquipmentController.deliverEquipment);
router.post('/:id/install', authorize('admin', 'technician'), EquipmentController.installEquipment);

module.exports = router;
