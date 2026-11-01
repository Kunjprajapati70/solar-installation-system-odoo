const express = require('express');
const router = express.Router();
const TechnicianController = require('../controllers/technician.controller');
const { protect } = require('../middleware/auth.middleware');
const { authorize } = require('../middleware/role.middleware');

// All routes require authentication
router.use(protect);

// Technician specific endpoints
router.get('/me/jobs', authorize('technician', 'admin'), TechnicianController.getMyJobs);
router.get('/me/jobs/:id', authorize('technician', 'admin'), TechnicianController.getJobById);
router.get('/me/hours', authorize('technician', 'admin'), TechnicianController.getMyHours);

// Public technician listing for admins & sales staff
router.get('/', authorize('admin', 'sales', 'technician'), TechnicianController.listTechnicians);

module.exports = router;
