const express = require('express');
const router = express.Router();
const InstallationController = require('../controllers/installation.controller');
const { protect } = require('../middleware/auth.middleware');
const { authorize } = require('../middleware/role.middleware');
const upload = require('../middleware/upload.middleware');

router.use(protect);

router.get('/', InstallationController.listInstallations);
router.get('/:id', InstallationController.getById);
router.post('/', authorize('admin', 'sales'), InstallationController.createInstallation);
router.put('/:id/assign', authorize('admin'), InstallationController.assignTechnicians);

// Technician operational routes (supporting both REST convention and existing frontend paths)
router.route('/:id/start')
  .post(authorize('admin', 'technician'), InstallationController.startJob)
  .put(authorize('admin', 'technician'), InstallationController.startJob);

router.route('/:id/start-job')
  .post(authorize('admin', 'technician'), InstallationController.startJob)
  .put(authorize('admin', 'technician'), InstallationController.startJob);

router.route('/:id/progress')
  .put(authorize('admin', 'technician'), InstallationController.updateStep)
  .post(authorize('admin', 'technician'), InstallationController.updateStep);

router.route('/:id/update-step')
  .post(authorize('admin', 'technician'), InstallationController.updateStep)
  .put(authorize('admin', 'technician'), InstallationController.updateStep);

router.route('/:id/testing')
  .put(authorize('admin', 'technician'), InstallationController.submitTesting)
  .post(authorize('admin', 'technician'), InstallationController.submitTesting);

router.route('/:id/testing-results')
  .post(authorize('admin', 'technician'), InstallationController.submitTesting)
  .put(authorize('admin', 'technician'), InstallationController.submitTesting);

router.post('/:id/photos', authorize('admin', 'technician'), upload.single('photo'), InstallationController.uploadPhoto);
router.post('/:id/photo', authorize('admin', 'technician'), upload.single('photo'), InstallationController.uploadPhoto);

router.route('/:id/finish')
  .put(authorize('admin', 'technician'), InstallationController.customerAcceptance)
  .post(authorize('admin', 'technician'), InstallationController.customerAcceptance);

router.route('/:id/complete')
  .post(authorize('admin', 'technician'), InstallationController.customerAcceptance)
  .put(authorize('admin', 'technician'), InstallationController.customerAcceptance);

router.route('/:id/customer-acceptance')
  .post(authorize('admin', 'technician'), InstallationController.customerAcceptance)
  .put(authorize('admin', 'technician'), InstallationController.customerAcceptance);

module.exports = router;
