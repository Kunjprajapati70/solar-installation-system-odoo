const express = require('express');
const router = express.Router();
const SettingController = require('../controllers/setting.controller');
const { protect } = require('../middleware/auth.middleware');
const { authorize } = require('../middleware/role.middleware');

router.get('/', SettingController.getSettings);
router.put('/', protect, authorize('admin'), SettingController.updateSettings);

module.exports = router;
