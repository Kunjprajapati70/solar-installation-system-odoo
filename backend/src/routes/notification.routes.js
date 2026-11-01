const express = require('express');
const router = express.Router();
const NotificationController = require('../controllers/notification.controller');
const { protect } = require('../middleware/auth.middleware');

router.use(protect);

router.get('/', NotificationController.listNotifications);
router.post('/mark-all-read', NotificationController.markAllRead);
router.put('/read-all', NotificationController.markAllRead);
router.put('/:id/read', NotificationController.markRead);
router.post('/:id/read', NotificationController.markRead);

module.exports = router;
