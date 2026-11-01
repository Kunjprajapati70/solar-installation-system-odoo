/**
 * Notification Service
 * Manages persistent notifications and Socket.IO real-time event broadcasting
 */

const Notification = require('../../models/Notification');
const { emitToUser, emitToRole, emitToCustomer, broadcastNotification } = require('../sockets/socketHandler');

class NotificationService {
  /**
   * Dispatches a notification to persistent DB and real-time Socket.IO
   */
  static async notify({
    recipientId = null,
    targetRole = null,
    customerId = null,
    title,
    message,
    type = 'info', // info, success, warning, danger
    link = ''
  }) {
    try {
      // 1. Create DB record
      const notification = new Notification({
        recipient: recipientId,
        targetRole,
        title,
        message,
        type,
        link,
        isRead: false
      });
      await notification.save();

      // 2. Real-time Socket.IO emission
      if (recipientId) {
        emitToUser(recipientId.toString(), 'new-notification', notification);
      }
      if (targetRole) {
        emitToRole(targetRole, 'new-notification', notification);
      }
      if (customerId) {
        emitToCustomer(customerId.toString(), 'new-notification', notification);
      }
      if (!recipientId && !targetRole && !customerId) {
        broadcastNotification('new-notification', notification);
      }

      return notification;
    } catch (err) {
      console.error('Notification dispatch failed:', err);
      return null;
    }
  }

  // Convenience helper methods
  static async notifyOrderCreated(order) {
    return this.notify({
      targetRole: 'admin',
      title: 'New Solar Project Order Created',
      message: `Order #${order.orderNumber} created for ${order.systemCapacityKw}kW ${order.systemType} system.`,
      type: 'success',
      link: `/orders`
    });
  }

  static async notifyPaymentConfirmed(payment, order) {
    return this.notify({
      targetRole: 'admin',
      title: 'Payment Confirmed',
      message: `Receipt #${payment.receiptNumber}: ₹${payment.amount} received via ${payment.paymentMethod}.`,
      type: 'success',
      link: `/payments`
    });
  }

  static async notifyEquipmentDispatched(equipment, order) {
    return this.notify({
      targetRole: 'technician',
      title: 'Equipment Dispatched to Site',
      message: `${equipment.brand} ${equipment.category} (SN: ${equipment.serialNumber}) dispatched for Order #${order.orderNumber}.`,
      type: 'info',
      link: `/equipment`
    });
  }

  static async notifyInstallationCompleted(installation) {
    return this.notify({
      targetRole: 'admin',
      title: 'Installation Quality Verified & Accepted',
      message: `Job #${installation.installationNumber} completed. Customer acceptance and generation verified.`,
      type: 'success',
      link: `/installations`
    });
  }

  static async notifyServiceTicketCreated(ticket) {
    return this.notify({
      targetRole: 'admin',
      title: `Service Complaint Ticket #${ticket.ticketNumber}`,
      message: `Ticket raised for SN: ${ticket.equipmentSerialNumber}. Category: ${ticket.issueCategory}. Warranty status: ${ticket.warrantyStatusAtTicket}.`,
      type: 'warning',
      link: `/service-tickets`
    });
  }
}

module.exports = NotificationService;
