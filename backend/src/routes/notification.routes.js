const express = require('express');
const router = express.Router();
const NotificationController = require('../controllers/notification.controller');
const { protect } = require('../middleware/auth.middleware');

router.use(protect);

router.get('/', NotificationController.listNotifications);
router.put('/:id/read', NotificationController.markRead);
router.put('/read-all', NotificationController.markAllRead);

module.exports = router;
