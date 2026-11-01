const express = require('express');
const router = express.Router();
const SubsidyController = require('../controllers/subsidy.controller');
const { protect } = require('../middleware/auth.middleware');
const { authorize } = require('../middleware/role.middleware');

router.use(protect);

router.get('/', SubsidyController.listSubsidies);
router.get('/:id', SubsidyController.getById);
router.post('/', authorize('admin', 'sales'), SubsidyController.createSubsidy);
router.put('/:id/status', authorize('admin', 'sales'), SubsidyController.updateStatus);

module.exports = router;
