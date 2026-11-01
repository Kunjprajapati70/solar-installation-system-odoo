import React from 'react';
import { useLocation, Link } from 'react-router-dom';
import { Home, ChevronRight } from 'lucide-react';

const routeLabels = {
  enquiries: 'Customer Enquiries',
  customers: 'Customer Accounts',
  surveys: 'Technical Site Surveys',
  quotations: 'Quotations & BOM',
  orders: 'Active Orders',
  'equipment-tracking': 'Smart Equipment Tracking',
  inventory: 'Warehouse Inventory',
  'technician-portal': 'Technician Field Portal',
  installations: 'Installation Pipeline',
  warranties: 'Warranty Certificates',
  'service-tickets': 'Service & Repairs',
  'customer-portal': 'Customer Rooftop Portal',
  financials: 'Financials & Margins',
  subsidies: 'Govt. Subsidies',
  technicians: 'Technician Roster',
  reports: 'Executive Reports',
  profile: 'User Profile'
};

export const Breadcrumbs = () => {
  const location = useLocation();
  const pathnames = location.pathname.split('/').filter((x) => x);

  if (pathnames.length === 0) {
    return (
      <div className="flex items-center space-x-2 text-xs text-slate-500 dark:text-slate-400 mb-4">
        <Home className="w-3.5 h-3.5 text-solar-500 dark:text-solar-400" />
        <span className="text-slate-800 dark:text-slate-200 font-medium">Dashboard Overview</span>
      </div>
    );
  }

  return (
    <nav className="flex items-center space-x-1.5 text-xs text-slate-500 dark:text-slate-400 mb-4" aria-label="Breadcrumb">
      <Link to="/" className="flex items-center space-x-1 hover:text-solar-600 dark:hover:text-solar-400 transition">
        <Home className="w-3.5 h-3.5" />
        <span>Dashboard</span>
      </Link>
      {pathnames.map((value, index) => {
        const to = `/${pathnames.slice(0, index + 1).join('/')}`;
        const isLast = index === pathnames.length - 1;
        const label = routeLabels[value] || value.replace('-', ' ');

        return (
          <React.Fragment key={to}>
            <ChevronRight className="w-3.5 h-3.5 text-slate-400 dark:text-slate-600" />
            {isLast ? (
              <span className="text-slate-900 dark:text-white font-semibold capitalize">{label}</span>
            ) : (
              <Link to={to} className="hover:text-solar-600 dark:hover:text-solar-400 transition capitalize">
                {label}
              </Link>
            )}
          </React.Fragment>
        );
      })}
    </nav>
  );
};

export default Breadcrumbs;
