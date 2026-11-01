const express = require('express');
const router = express.Router();
const Notification = require('../models/Notification');
const { protect } = require('../middleware/auth');

// @route   GET /api/notifications
router.get('/', protect, async (req, res) => {
  try {
    const notifications = await Notification.find({
      $or: [
        { recipient: req.user.id },
        { targetRole: req.user.role },
        { targetRole: 'all' }
      ]
    }).sort({ createdAt: -1 }).limit(30);

    const unreadCount = notifications.filter(n => !n.isRead).length;

    res.json({ success: true, count: notifications.length, unreadCount, data: notifications });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   POST /api/notifications/mark-all-read
router.post('/mark-all-read', protect, async (req, res) => {
  try {
    await Notification.updateMany(
      {
        $or: [
          { recipient: req.user.id },
          { targetRole: req.user.role },
          { targetRole: 'all' }
        ]
      },
      { isRead: true }
    );

    res.json({ success: true, message: 'All notifications marked as read' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
