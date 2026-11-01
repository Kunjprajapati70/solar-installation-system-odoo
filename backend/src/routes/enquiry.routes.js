const express = require('express');
const router = express.Router();
const EnquiryController = require('../controllers/enquiry.controller');
const { protect } = require('../middleware/auth.middleware');
const { authorize } = require('../middleware/role.middleware');

// Public lead capture (e.g. from landing page)
router.post('/', EnquiryController.createEnquiry);

// Staff management
router.use(protect);
router.get('/', authorize('admin', 'sales'), EnquiryController.listEnquiries);
router.get('/:id', authorize('admin', 'sales'), EnquiryController.getById);
router.put('/:id', authorize('admin', 'sales'), EnquiryController.updateEnquiry);
router.put('/:id/assign', authorize('admin', 'sales'), EnquiryController.assignLead);
router.put('/:id/status', authorize('admin', 'sales'), EnquiryController.updateStatus);
router.post('/:id/convert', authorize('admin', 'sales'), EnquiryController.convertLead);
router.put('/:id/notes', authorize('admin', 'sales'), EnquiryController.addInternalNote);
router.put('/:id/archive', authorize('admin', 'sales'), EnquiryController.archiveLead);
router.post('/:id/schedule-survey', authorize('admin', 'sales'), EnquiryController.scheduleSurvey);
router.delete('/:id', authorize('admin'), EnquiryController.deleteEnquiry);

module.exports = router;
