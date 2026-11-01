const mongoose = require('mongoose');

const NotificationSchema = new mongoose.Schema(
  {
    recipient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    targetRole: {
      type: String,
      enum: ['all', 'admin', 'sales', 'technician', 'customer']
    },
    title: {
      type: String,
      required: true
    },
    message: {
      type: String,
      required: true
    },
    type: {
      type: String,
      enum: ['info', 'success', 'warning', 'danger', 'approval_request', 'approval_status', 'credentials'],
      default: 'info'
    },
    link: String,
    isRead: {
      type: Boolean,
      default: false
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Notification', NotificationSchema);
