/**
 * Enterprise Solar Installation Management System
 * System-wide Constants & Configurations
 */

const ROLES = {
  ADMIN: 'admin',
  SALES: 'sales',
  TECHNICIAN: 'technician',
  CUSTOMER: 'customer'
};

const WARRANTY_DURATIONS_MONTHS = {
  panel: 240,       // 20 Years (240 months)
  inverter: 24,     // 2 Years (24 months)
  battery: 24,      // 2 Years (24 months)
  structure: 60,    // 5 Years (60 months)
  charge_controller: 24 // 2 Years (24 months)
};

const EQUIPMENT_STATUS = {
  IN_STOCK: 'in_stock',
  RESERVED: 'reserved',
  DISPATCHED: 'dispatched',
  INSTALLED: 'installed',
  UNDER_SERVICE: 'under_service'
};

const ORDER_STATUS = {
  CONFIRMED: 'confirmed',
  STOCK_CHECKED: 'stock_checked',
  ALLOCATED: 'allocated',
  DISPATCHED: 'dispatched',
  IN_INSTALLATION: 'in_installation',
  INSTALLED: 'installed',
  DELIVERY_CONFIRMED: 'delivery_confirmed',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled'
};

const SURVEY_STATUS = {
  SCHEDULED: 'scheduled',
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed',
  APPROVED: 'approved',
  REJECTED: 'rejected'
};

const INSTALLATION_STATUS = {
  ASSIGNED: 'assigned',
  IN_PROGRESS: 'in_progress',
  TESTING_IN_PROGRESS: 'testing_in_progress',
  COMPLETED: 'completed',
  CUSTOMER_ACCEPTED: 'customer_accepted'
};

const TICKET_STATUS = {
  OPEN: 'open',
  TECHNICIAN_ASSIGNED: 'technician_assigned',
  IN_PROGRESS: 'in_progress',
  PARTS_AWAITED: 'parts_awaited',
  RESOLVED: 'resolved',
  CLOSED: 'closed'
};

const PAYMENT_STATUS = {
  PENDING: 'pending',
  ADVANCE_PAID: 'advance_paid',
  PARTIALLY_PAID: 'partially_paid',
  FULLY_PAID: 'fully_paid'
};

module.exports = {
  ROLES,
  WARRANTY_DURATIONS_MONTHS,
  EQUIPMENT_STATUS,
  ORDER_STATUS,
  SURVEY_STATUS,
  INSTALLATION_STATUS,
  TICKET_STATUS,
  PAYMENT_STATUS
};
