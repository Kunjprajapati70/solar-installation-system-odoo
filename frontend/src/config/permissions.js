export const ROLES = {
  ADMIN: 'admin',
  SALES: 'sales',
  TECHNICIAN: 'technician',
  CUSTOMER: 'customer'
};

export const ROUTE_ACCESS = {
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
  '/reports': [ROLES.ADMIN],
  '/profile': [ROLES.ADMIN, ROLES.SALES, ROLES.TECHNICIAN, ROLES.CUSTOMER]
};

export function canAccessRoute(role, pathname) {
  if (!role || !pathname) return false;
  if (pathname === '/profile') return true;
  const match = Object.keys(ROUTE_ACCESS)
    .sort((a, b) => b.length - a.length)
    .find((route) => {
      if (route === '/') return pathname === '/' || pathname === '';
      return pathname === route || pathname.startsWith(`${route}/`);
    });
  if (!match) return false;
  return (ROUTE_ACCESS[match] || []).includes(role);
}

export function homePathForRole(role) {
  if (role === ROLES.TECHNICIAN) return '/technician-portal';
  if (role === ROLES.CUSTOMER) return '/customer-portal';
  return '/';
}
