const express = require('express');
const router = express.Router();
const ApprovalController = require('../controllers/approval.controller');
const { protect } = require('../middleware/auth.middleware');
const { authorize } = require('../middleware/role.middleware');

router.use(protect);

router.get('/', ApprovalController.listApprovals);
router.get('/summary', authorize('admin', 'sales'), ApprovalController.getSummary);
router.post('/', ApprovalController.submitRequest);
router.put('/:id/approve', authorize('admin'), ApprovalController.approve);
router.put('/:id/reject', authorize('admin'), ApprovalController.reject);
router.put('/:id/request-corrections', authorize('admin'), ApprovalController.requestCorrections);

module.exports = router;
