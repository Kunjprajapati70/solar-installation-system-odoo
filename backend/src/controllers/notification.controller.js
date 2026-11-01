const Notification = require('../../models/Notification');
const ApiResponse = require('../utils/apiResponse');

const audienceFilter = (user) => {
  if (user.role === 'admin') return {};
  return {
    $or: [
      { recipient: user._id },
      { recipient: user.id },
      { targetRole: user.role },
      { targetRole: 'all' }
    ]
  };
};

class NotificationController {
  /**
   * GET /api/notifications
   */
  static async listNotifications(req, res, next) {
    try {
      const filter = audienceFilter(req.user);
      const requestedLimit = Number(req.query.limit);
      const query = Notification.find(filter).sort({ createdAt: -1, _id: -1 });
      if (Number.isFinite(requestedLimit) && requestedLimit > 0) {
        query.limit(requestedLimit);
      }
      const notifications = await query.lean();
      const unreadCount = await Notification.countDocuments({ ...filter, isRead: false });

      return res.status(200).json({
        success: true,
        message: 'Success',
        data: notifications,
        count: notifications.length,
        unreadCount
      });
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
   * POST /api/notifications/mark-all-read
   */
  static async markAllRead(req, res, next) {
    try {
      await Notification.updateMany(audienceFilter(req.user), { isRead: true });
      return ApiResponse.success(res, null, 'All notifications marked as read');
    } catch (err) {
      next(err);
    }
  }
}

module.exports = NotificationController;
