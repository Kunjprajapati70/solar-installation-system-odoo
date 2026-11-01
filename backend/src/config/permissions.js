/**
 * Centralized RBAC permissions.
 * Frontend hiding is not security — every protected API must use these checks.
 */

const ROLES = {
  ADMIN: 'admin',
  SALES: 'sales',
  TECHNICIAN: 'technician',
  CUSTOMER: 'customer'
};

const PERMISSIONS = {
  USERS_READ: 'users.read',
  USERS_CREATE: 'users.create',
  USERS_MANAGE: 'users.manage',
  CUSTOMERS_READ: 'customers.read',
  CUSTOMERS_CREATE: 'customers.create',
  CUSTOMERS_MANAGE: 'customers.manage',
  LEADS_READ: 'leads.read',
  LEADS_MANAGE: 'leads.manage',
  SURVEYS_READ: 'surveys.read',
  SURVEYS_MANAGE: 'surveys.manage',
  SURVEYS_APPROVE: 'surveys.approve',
  QUOTATIONS_READ: 'quotations.read',
  QUOTATIONS_CREATE: 'quotations.create',
  QUOTATIONS_APPROVE: 'quotations.approve',
  ORDERS_READ: 'orders.read',
  ORDERS_MANAGE: 'orders.manage',
  INVENTORY_READ: 'inventory.read',
  INVENTORY_MANAGE: 'inventory.manage',
  EQUIPMENT_READ: 'equipment.read',
  EQUIPMENT_MANAGE: 'equipment.manage',
  INSTALLATIONS_READ: 'installations.read',
  INSTALLATIONS_OPERATE: 'installations.operate',
  WARRANTIES_READ: 'warranties.read',
  WARRANTIES_MANAGE: 'warranties.manage',
  TICKETS_READ: 'tickets.read',
  TICKETS_MANAGE: 'tickets.manage',
  FINANCE_READ: 'finance.read',
  FINANCE_WRITE: 'finance.write',
  ANALYTICS_READ: 'analytics.read',
  APPROVALS_REVIEW: 'approvals.review',
  SETTINGS_MANAGE: 'settings.manage',
  SUBSIDIES_READ: 'subsidies.read',
  SUBSIDIES_MANAGE: 'subsidies.manage'
};

const ROLE_PERMISSIONS = {
  [ROLES.ADMIN]: Object.values(PERMISSIONS),
  [ROLES.SALES]: [
    PERMISSIONS.USERS_READ,
    PERMISSIONS.USERS_CREATE,
    PERMISSIONS.CUSTOMERS_READ,
    PERMISSIONS.CUSTOMERS_CREATE,
    PERMISSIONS.LEADS_READ,
    PERMISSIONS.LEADS_MANAGE,
    PERMISSIONS.SURVEYS_READ,
    PERMISSIONS.SURVEYS_MANAGE,
    PERMISSIONS.QUOTATIONS_READ,
    PERMISSIONS.QUOTATIONS_CREATE,
    PERMISSIONS.ORDERS_READ,
    PERMISSIONS.INVENTORY_READ,
    PERMISSIONS.EQUIPMENT_READ,
    PERMISSIONS.INSTALLATIONS_READ,
    PERMISSIONS.WARRANTIES_READ,
    PERMISSIONS.TICKETS_READ,
    PERMISSIONS.SUBSIDIES_READ,
    PERMISSIONS.SUBSIDIES_MANAGE
  ],
  [ROLES.TECHNICIAN]: [
    PERMISSIONS.EQUIPMENT_READ,
    PERMISSIONS.INSTALLATIONS_READ,
    PERMISSIONS.INSTALLATIONS_OPERATE,
    PERMISSIONS.TICKETS_READ,
    PERMISSIONS.TICKETS_MANAGE,
    PERMISSIONS.WARRANTIES_READ
  ],
  [ROLES.CUSTOMER]: [
    PERMISSIONS.QUOTATIONS_READ,
    PERMISSIONS.ORDERS_READ,
    PERMISSIONS.WARRANTIES_READ,
    PERMISSIONS.TICKETS_READ,
    PERMISSIONS.TICKETS_MANAGE,
    PERMISSIONS.INSTALLATIONS_READ,
    PERMISSIONS.EQUIPMENT_READ,
    PERMISSIONS.SUBSIDIES_READ
  ]
};

const ROUTE_ACCESS = {
  '/': [ROLES.ADMIN, ROLES.SALES],
  '/approvals': [ROLES.ADMIN, ROLES.SALES],
  '/users': [ROLES.ADMIN, ROLES.SALES],
  '/enquiries': [ROLES.ADMIN, ROLES.SALES],
  '/customers': [ROLES.ADMIN, ROLES.SALES],
  '/surveys': [ROLES.ADMIN, ROLES.SALES],
  '/quotations': [ROLES.ADMIN, ROLES.SALES, ROLES.CUSTOMER],
  '/orders': [ROLES.ADMIN, ROLES.SALES, ROLES.CUSTOMER],
  '/equipment-tracking': [ROLES.ADMIN, ROLES.SALES, ROLES.TECHNICIAN],
  '/inventory': [ROLES.ADMIN, ROLES.SALES],
  '/installations': [ROLES.ADMIN, ROLES.SALES, ROLES.TECHNICIAN],
  '/technicians': [ROLES.ADMIN],
  '/technician-portal': [ROLES.ADMIN, ROLES.TECHNICIAN],
  '/warranties': [ROLES.ADMIN, ROLES.SALES, ROLES.CUSTOMER, ROLES.TECHNICIAN],
  '/service-tickets': [ROLES.ADMIN, ROLES.SALES, ROLES.CUSTOMER, ROLES.TECHNICIAN],
  '/financials': [ROLES.ADMIN],
  '/subsidies': [ROLES.ADMIN, ROLES.SALES, ROLES.CUSTOMER],
  '/customer-portal': [ROLES.ADMIN, ROLES.CUSTOMER],
  '/reports': [ROLES.ADMIN]
};

const LEAD_STATUS_TRANSITIONS = {
  new: ['contacted', 'follow_up_required', 'rejected', 'lost'],
  contacted: ['follow_up_required', 'site_survey_scheduled', 'survey_scheduled', 'quotation_sent', 'rejected', 'lost'],
  follow_up_required: ['contacted', 'site_survey_scheduled', 'survey_scheduled', 'rejected', 'lost'],
  site_survey_scheduled: ['survey_completed', 'follow_up_required', 'lost'],
  survey_scheduled: ['survey_completed', 'follow_up_required', 'lost'],
  survey_completed: ['quotation_sent', 'quoted', 'rejected', 'lost'],
  quotation_sent: ['converted', 'follow_up_required', 'lost', 'rejected'],
  quoted: ['converted', 'follow_up_required', 'lost', 'rejected'],
  assigned: ['contacted', 'site_survey_scheduled', 'lost'],
  converted: [],
  won: [],
  rejected: ['new', 'contacted'],
  lost: ['new', 'contacted']
};

function hasPermission(role, permission) {
  return (ROLE_PERMISSIONS[role] || []).includes(permission);
}

function canAccessRoute(role, pathname) {
  if (!pathname) return false;
  const match = Object.keys(ROUTE_ACCESS).sort((a, b) => b.length - a.length).find((route) => {
    if (route === '/') return pathname === '/' || pathname === '';
    return pathname === route || pathname.startsWith(`${route}/`);
  });
  if (!match) return true;
  return (ROUTE_ACCESS[match] || []).includes(role);
}

module.exports = {
  ROLES,
  PERMISSIONS,
  ROLE_PERMISSIONS,
  ROUTE_ACCESS,
  LEAD_STATUS_TRANSITIONS,
  hasPermission,
  canAccessRoute
};
