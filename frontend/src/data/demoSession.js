export const DEMO_USERS = {
  admin: {
    _id: 'demo-admin',
    id: 'demo-admin',
    name: 'Aarav Mehta',
    email: 'admin@sunpower.com',
    role: 'admin',
    phone: '+91 98765 00001'
  },
  sales: {
    _id: 'demo-sales',
    id: 'demo-sales',
    name: 'Priya Shah',
    email: 'sales@sunpower.com',
    role: 'sales',
    phone: '+91 98765 00002'
  },
  technician: {
    _id: 'demo-tech',
    id: 'demo-tech',
    name: 'Rohan Patel',
    email: 'tech@sunpower.com',
    role: 'technician',
    phone: '+91 98765 00003',
    technicianDetails: {
      specialization: ['Solar PV Installation', 'Electrical QA'],
      certification: 'Certified Solar Technician',
      rating: 4.8
    }
  },
  customer: {
    _id: 'demo-customer',
    id: 'demo-customer',
    name: 'Neha Iyer',
    email: 'customer@sunpower.com',
    role: 'customer',
    phone: '+91 98765 00004',
    customerProfile: {
      _id: 'demo-customer-profile',
      name: 'Neha Iyer',
      email: 'customer@sunpower.com'
    }
  }
};

export const DEMO_CREDENTIALS = {
  'admin@sunpower.com': { password: 'admin123', role: 'admin' },
  'sales@sunpower.com': { password: 'sales123', role: 'sales' },
  'tech@sunpower.com': { password: 'tech123', role: 'technician' },
  'customer@sunpower.com': { password: 'customer123', role: 'customer' }
};

export const DEMO_TOKEN_PREFIX = 'demo-local-';

export const isDemoToken = (token) => typeof token === 'string' && token.startsWith(DEMO_TOKEN_PREFIX);

export const createDemoSession = (role) => {
  const user = DEMO_USERS[role];
  if (!user) return null;
  return {
    token: `${DEMO_TOKEN_PREFIX}${role}`,
    user
  };
};

export const sessionFromCredentials = (email, password) => {
  const match = DEMO_CREDENTIALS[String(email || '').toLowerCase().trim()];
  if (!match || match.password !== password) return null;
  return createDemoSession(match.role);
};

export const FALLBACK_DASHBOARD = {
  kpis: {
    totalCustomers: 42,
    totalProjects: 40,
    totalOrders: 40,
    totalInstallations: 25,
    activeInstallations: 10,
    totalInstalledCapacityKw: 186.5,
    totalRevenue: 8420000,
    pendingPayments: 1260000,
    openTicketsCount: 9,
    warrantyClaimsCount: 4,
    lowStockCount: 6,
    expiringWarranties: 7
  },
  charts: {
    monthlyFinancials: [
      { month: 'Jan', revenue: 520000, expenses: 210000, capacityKw: 12 },
      { month: 'Feb', revenue: 610000, expenses: 240000, capacityKw: 14 },
      { month: 'Mar', revenue: 740000, expenses: 280000, capacityKw: 16 },
      { month: 'Apr', revenue: 680000, expenses: 265000, capacityKw: 15 },
      { month: 'May', revenue: 810000, expenses: 300000, capacityKw: 18 },
      { month: 'Jun', revenue: 760000, expenses: 290000, capacityKw: 17 },
      { month: 'Jul', revenue: 890000, expenses: 320000, capacityKw: 19 },
      { month: 'Aug', revenue: 920000, expenses: 340000, capacityKw: 21 },
      { month: 'Sep', revenue: 780000, expenses: 310000, capacityKw: 16 },
      { month: 'Oct', revenue: 860000, expenses: 330000, capacityKw: 18 },
      { month: 'Nov', revenue: 700000, expenses: 270000, capacityKw: 12 },
      { month: 'Dec', revenue: 540000, expenses: 220000, capacityKw: 8.5 }
    ],
    pipelineStageCounts: [
      { name: 'Pending', count: 8, color: '#94a3b8' },
      { name: 'Survey', count: 7, color: '#38bdf8' },
      { name: 'Approved', count: 12, color: '#a855f7' },
      { name: 'In Progress', count: 10, color: '#f59e0b' },
      { name: 'Completed', count: 25, color: '#10b981' }
    ],
    serviceTicketStatusChart: [
      { status: 'Open', count: 4, fill: '#38bdf8' },
      { status: 'Assigned', count: 3, fill: '#818cf8' },
      { status: 'In Progress', count: 5, fill: '#f59e0b' },
      { status: 'Parts Awaited', count: 2, fill: '#ec4899' },
      { status: 'Resolved', count: 18, fill: '#10b981' }
    ],
    inventoryStockChart: [
      { category: 'Panels', availableStock: 84, safetyThreshold: 40 },
      { category: 'Inverters', availableStock: 22, safetyThreshold: 12 },
      { category: 'Batteries', availableStock: 18, safetyThreshold: 10 },
      { category: 'Cables', availableStock: 1200, safetyThreshold: 400 },
      { category: 'Structures', availableStock: 36, safetyThreshold: 20 }
    ],
    technicianStats: [
      { id: 't1', name: 'Rohan Patel', phone: '+91 98765 00003', completedJobs: 28, activeJobs: 2, totalHoursLogged: 412, rating: 4.8 },
      { id: 't2', name: 'Karan Desai', phone: '+91 98765 00013', completedJobs: 24, activeJobs: 1, totalHoursLogged: 388, rating: 4.7 },
      { id: 't3', name: 'Meera Joshi', phone: '+91 98765 00023', completedJobs: 31, activeJobs: 3, totalHoursLogged: 451, rating: 4.9 }
    ]
  }
};
