const express = require('express');
const router = express.Router();
const QuotationController = require('../controllers/quotation.controller');
const { protect } = require('../middleware/auth.middleware');
const { authorize } = require('../middleware/role.middleware');

router.use(protect);

router.get('/', QuotationController.listQuotations);
router.post('/calculate-preview', authorize('admin', 'sales'), QuotationController.calculatePreview);
router.get('/:id', QuotationController.getById);

router.post('/', authorize('admin', 'sales'), QuotationController.createQuotation);
router.put('/:id', authorize('admin', 'sales'), QuotationController.updateQuotation);

// Support both PUT and POST for approve/reject actions
router.route('/:id/approve')
  .put(authorize('admin', 'sales'), QuotationController.approveQuotation)
  .post(authorize('admin', 'sales'), QuotationController.approveQuotation);

router.route('/:id/reject')
  .put(authorize('admin', 'sales'), QuotationController.rejectQuotation)
  .post(authorize('admin', 'sales'), QuotationController.rejectQuotation);

router.put('/:id/request-corrections', authorize('admin', 'sales'), QuotationController.requestCorrections);
router.put('/:id/status', authorize('admin', 'sales'), QuotationController.updateStatus);

module.exports = router;
