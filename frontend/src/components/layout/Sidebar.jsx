import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  LayoutDashboard,
  Users,
  MessageSquarePlus,
  ClipboardCheck,
  FileSpreadsheet,
  ShoppingBag,
  QrCode,
  Boxes,
  Wrench,
  Hammer,
  ShieldCheck,
  LifeBuoy,
  CreditCard,
  FileCheck2,
  BarChart3,
  Smartphone,
  Home,
  ChevronLeft,
  ChevronRight,
  Sun
} from 'lucide-react';

const Sidebar = ({ isOpen, closeSidebar, isCollapsed, toggleCollapse }) => {
  const { user } = useAuth();
  const role = user?.role || 'admin';

  // Navigation Items defined per role
  const adminNav = [
    { to: '/', label: 'Overview Dashboard', icon: LayoutDashboard, badge: 'Live' },
    { to: '/enquiries', label: 'Enquiries Pipeline', icon: MessageSquarePlus },
    { to: '/customers', label: 'Customer Directory', icon: Users },
    { to: '/surveys', label: 'Site Surveys', icon: ClipboardCheck, badge: 'Approval' },
    { to: '/quotations', label: 'Quotation Engine', icon: FileSpreadsheet },
    { to: '/orders', label: 'Order Management', icon: ShoppingBag },
    { to: '/equipment-tracking', label: 'Smart Equipment QR', icon: QrCode, highlight: true },
    { to: '/inventory', label: 'Inventory & Stock', icon: Boxes },
    { to: '/installations', label: 'Installation Pipeline', icon: Hammer },
    { to: '/technicians', label: 'Technician Roster', icon: Wrench },
    { to: '/technician-portal', label: 'Technician Mobile Portal', icon: Smartphone, highlight: true },
    { to: '/warranties', label: 'Warranty Management', icon: ShieldCheck, highlight: true },
    { to: '/service-tickets', label: 'Service Desk & Repairs', icon: LifeBuoy },
    { to: '/financials', label: 'Payments & Expenses', icon: CreditCard },
    { to: '/subsidies', label: 'Subsidy Portal (PM Surya)', icon: FileCheck2 },
    { to: '/customer-portal', label: 'Customer Portal Demo', icon: Home, highlight: true },
    { to: '/reports', label: 'Business Reports', icon: BarChart3 }
  ];

  const salesNav = [
    { to: '/', label: 'Sales Dashboard', icon: LayoutDashboard },
    { to: '/enquiries', label: 'Lead Enquiries', icon: MessageSquarePlus },
    { to: '/customers', label: 'Customer CRM', icon: Users },
    { to: '/surveys', label: 'Site Surveys', icon: ClipboardCheck, badge: 'Approval' },
    { to: '/quotations', label: 'Quotation Engine', icon: FileSpreadsheet },
    { to: '/orders', label: 'Orders & Payments', icon: ShoppingBag },
    { to: '/subsidies', label: 'Subsidy Documentation', icon: FileCheck2 }
  ];

  const technicianNav = [
    { to: '/technician-portal', label: 'Technician Mobile Portal', icon: Smartphone, highlight: true },
    { to: '/equipment-tracking', label: 'QR Scanner & Lookup', icon: QrCode },
    { to: '/installations', label: 'Assigned Installations', icon: Hammer },
    { to: '/service-tickets', label: 'Assigned Repair Tickets', icon: LifeBuoy }
  ];

  const customerNav = [
    { to: '/customer-portal', label: 'My Solar Rooftop', icon: Home, highlight: true },
    { to: '/orders', label: 'My Order & Invoices', icon: ShoppingBag },
    { to: '/warranties', label: 'Warranty Certificates', icon: ShieldCheck },
    { to: '/service-tickets', label: 'Service Complaints', icon: LifeBuoy }
  ];

  let navItems = adminNav;
  if (role === 'sales') navItems = salesNav;
  if (role === 'technician') navItems = technicianNav;
  if (role === 'customer') navItems = customerNav;

  return (
    <>
      {/* 1. Mobile Backdrop Overlay */}
      {isOpen && (
        <div
          onClick={closeSidebar}
          className="fixed inset-0 bg-black/70 backdrop-blur-sm z-40 lg:hidden transition-opacity duration-300"
          aria-hidden="true"
        />
      )}

      {/* 2. Sidebar Container (Fixed desktop + Mobile slide-over) */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 lg:z-30 flex flex-col justify-between transition-all duration-300 ease-in-out border-r
          bg-midnight-900 border-slate-800/80
          ${isCollapsed ? 'lg:w-20' : 'lg:w-64'}
          ${isOpen ? 'translate-x-0 w-64 shadow-2xl' : '-translate-x-full lg:translate-x-0'}
        `}
      >
        {/* Desktop Brand Header */}
        <div className="hidden lg:flex items-center justify-between h-16 px-3.5 border-b border-slate-800/80 shrink-0">
          <div className="flex items-center space-x-2.5 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-solar-600 via-solar-500 to-amber-300 flex items-center justify-center shadow-glow-solar shrink-0">
              <Sun className="w-5 h-5 text-midnight-950 font-bold" />
            </div>
            {!isCollapsed && (
              <div className="min-w-0">
                <span className="font-bold text-sm tracking-tight font-sans text-white block truncate">
                  SunPower <span className="gradient-solar-text">Solutions</span>
                </span>
                <span className="text-[10px] text-slate-400 font-mono tracking-wider">
                  ENTERPRISE v2.6
                </span>
              </div>
            )}
          </div>
          <button
            onClick={toggleCollapse}
            className="p-1.5 rounded-lg bg-slate-800/60 hover:bg-slate-800 text-slate-400 hover:text-white transition border border-slate-700/60 shrink-0"
            title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            aria-label="Toggle Sidebar"
          >
            {isCollapsed ? <ChevronRight className="w-4 h-4 text-solar-400" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        </div>

        {/* Mobile Header / Branding area */}
        <div className="p-4 border-b border-slate-800/80 flex items-center justify-between lg:hidden shrink-0">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-solar-600 to-amber-300 flex items-center justify-center shadow-glow-solar">
              <Sun className="w-4 h-4 text-midnight-950 font-bold" />
            </div>
            <div>
              <span className="font-bold text-sm tracking-wide text-white block">SunPower Solutions</span>
              <span className="text-[10px] text-slate-400">Solar Management</span>
            </div>
          </div>
          <button
            onClick={closeSidebar}
            className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white"
            aria-label="Close Navigation Menu"
          >
            ✕
          </button>
        </div>

        {/* Navigation Links Scrollable Area */}
        <div className="flex-1 overflow-y-auto py-3 px-2 sm:px-3 space-y-1">
          {/* Header section title */}
          {!isCollapsed ? (
            <div className="px-3 pb-2 text-[10px] font-bold text-slate-500 uppercase tracking-widest truncate">
              {role.toUpperCase()} WORKSPACE
            </div>
          ) : (
            <div className="text-center pb-2 text-[9px] font-bold text-slate-500">
              •••
            </div>
          )}

          {navItems.map((item, idx) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={idx}
                to={item.to}
                onClick={closeSidebar}
                title={isCollapsed ? item.label : undefined}
                className={({ isActive }) =>
                  `flex items-center rounded-xl text-xs font-medium transition-all group relative ${
                    isCollapsed ? 'justify-center p-2.5' : 'justify-between px-3 py-2.5'
                  } ${
                    isActive
                      ? 'bg-solar-500/15 text-solar-400 border border-solar-500/40 shadow-glow-solar font-semibold'
                      : item.highlight
                      ? 'text-slate-200 hover:bg-slate-800/80 hover:text-white border border-slate-800/60'
                      : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-200 border border-transparent'
                  }`
                }
              >
                <div className="flex items-center space-x-2.5 min-w-0">
                  <Icon className="w-4 h-4 shrink-0 transition-transform group-hover:scale-110" />
                  {!isCollapsed && <span className="truncate">{item.label}</span>}
                </div>

                {!isCollapsed && (
                  <div className="flex items-center space-x-1 shrink-0">
                    {item.badge && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-solar-500/20 text-solar-400 font-semibold border border-solar-500/30">
                        {item.badge}
                      </span>
                    )}
                    {item.highlight && !item.badge && (
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    )}
                  </div>
                )}

                {/* Tooltip for collapsed desktop state */}
                {isCollapsed && (
                  <div className="hidden lg:group-hover:flex absolute left-full ml-2 px-2.5 py-1 rounded-md bg-slate-900 border border-slate-700 text-white text-[11px] font-semibold whitespace-nowrap shadow-xl z-50 pointer-events-none">
                    {item.label}
                  </div>
                )}
              </NavLink>
            );
          })}
        </div>

        {/* Footer info: Grid telemetry & Collapse helper */}
        <div className="p-3 border-t border-slate-800/80 bg-midnight-950/60">
          {!isCollapsed ? (
            <div className="p-2.5 rounded-xl bg-slate-900/90 border border-slate-800 text-[11px] space-y-1">
              <div className="flex items-center justify-between text-slate-400">
                <span>Grid Frequency</span>
                <span className="text-emerald-400 font-mono font-bold">50.02 Hz</span>
              </div>
              <div className="flex items-center justify-between text-slate-400">
                <span>System Efficiency</span>
                <span className="text-solar-400 font-mono font-bold">98.4%</span>
              </div>
            </div>
          ) : (
            <div className="flex justify-center text-[10px] text-emerald-400 font-mono font-bold" title="Grid 50.02Hz • Efficiency 98.4%">
              98.4%
            </div>
          )}
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
