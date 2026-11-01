const express = require('express');
const router = express.Router();
const WarrantyController = require('../controllers/warranty.controller');
const { protect } = require('../middleware/auth.middleware');

// Public / quick verification endpoints for serial lookup and eligibility check
router.get('/serial/:serialNumber', WarrantyController.getBySerial);
router.get('/lookup/:serialNumber', WarrantyController.getBySerial);
router.post('/check-eligibility', WarrantyController.checkEligibility);

// Protected routes for dashboard and certificates
router.use(protect);
router.get('/', WarrantyController.listWarranties);
router.get('/summary', WarrantyController.getSummary);

module.exports = router;
