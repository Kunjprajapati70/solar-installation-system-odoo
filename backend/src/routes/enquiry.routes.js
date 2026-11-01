const express = require('express');
const router = express.Router();
const EnquiryController = require('../controllers/enquiry.controller');
const { protect } = require('../middleware/auth.middleware');
const { authorize } = require('../middleware/role.middleware');

// Public lead capture
router.post('/', EnquiryController.createEnquiry);

// Staff management
router.use(protect);
router.get('/', authorize('admin', 'sales'), EnquiryController.listEnquiries);
router.post('/:id/schedule-survey', authorize('admin', 'sales'), EnquiryController.scheduleSurvey);
router.get('/:id', authorize('admin', 'sales'), EnquiryController.getById);
router.put('/:id', authorize('admin', 'sales'), EnquiryController.updateEnquiry);
router.delete('/:id', authorize('admin'), EnquiryController.deleteEnquiry);

module.exports = router;
