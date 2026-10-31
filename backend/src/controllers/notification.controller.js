const Notification = require('../../models/Notification');
const ApiResponse = require('../utils/apiResponse');

class NotificationController {
  /**
   * GET /api/notifications
   */
  static async listNotifications(req, res, next) {
    try {
      const notifications = await Notification.find({
        $or: [
          { recipient: req.user._id },
          { targetRole: req.user.role },
          { targetRole: 'all' }
        ]
      })
        .sort({ createdAt: -1 })
        .limit(50);

      return ApiResponse.success(res, notifications);
    } catch (err) {
      next(err);
    }
  }

  /**
   * PUT /api/notifications/:id/read
   */
  static async markRead(req, res, next) {
    try {
      const notification = await Notification.findByIdAndUpdate(
        req.params.id,
        { isRead: true },
        { new: true }
      );
      if (!notification) {
        return ApiResponse.notFound(res, 'Notification not found.');
      }
      return ApiResponse.success(res, notification, 'Notification marked as read');
    } catch (err) {
      next(err);
    }
  }

  /**
   * PUT /api/notifications/read-all
   */
  static async markAllRead(req, res, next) {
    try {
      await Notification.updateMany(
        {
          $or: [
            { recipient: req.user._id },
            { targetRole: req.user.role },
            { targetRole: 'all' }
          ]
        },
        { isRead: true }
      );
      return ApiResponse.success(res, null, 'All notifications marked as read');
    } catch (err) {
      next(err);
    }
  }
}

module.exports = NotificationController;
