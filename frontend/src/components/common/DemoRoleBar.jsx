import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { ShieldAlert, UserCheck, Wrench, User, Sparkles, Activity } from 'lucide-react';

const DemoRoleBar = () => {
  const { user } = useAuth();

  const roles = [
    { id: 'admin', label: 'Admin', desc: 'Full System & Analytics', icon: ShieldAlert, color: 'border-amber-500 text-amber-400 bg-amber-500/10' },
    { id: 'sales', label: 'Sales Rep', desc: 'Enquiries, Surveys & Quotes', icon: UserCheck, color: 'border-sky-500 text-sky-400 bg-sky-500/10' },
    { id: 'technician', label: 'Technician', desc: 'Mobile Field Portal & Testing', icon: Wrench, color: 'border-emerald-500 text-emerald-400 bg-emerald-500/10' },
    { id: 'customer', label: 'Customer', desc: 'Rooftop Tracker & Warranty', icon: User, color: 'border-purple-500 text-purple-400 bg-purple-500/10' }
  ];

  const currentRole = roles.find((r) => r.id === user?.role) || roles[0];
  const Icon = currentRole.icon;

  return (
    <div className="bg-midnight-900/90 border-b border-slate-800/80 px-3 py-2 text-xs backdrop-blur-md relative z-10 transition-colors duration-200">
      <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center space-x-2">
          <div className="flex items-center space-x-1.5 px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 font-medium border border-slate-700">
            <Sparkles className="w-3.5 h-3.5 text-solar-400" />
            <span>Active Portal</span>
          </div>
          <div className="hidden md:flex items-center space-x-1 text-slate-400">
            <Activity className="w-3 h-3 text-emerald-400 animate-pulse" />
            <span className="text-[11px]">{currentRole.desc}</span>
          </div>
        </div>

        <div className="flex items-center space-x-1.5 py-0.5">
          <div
            className={`flex items-center space-x-1.5 px-2.5 py-1 rounded-md text-xs font-medium ${currentRole.color} border shadow-sm`}
            title={`${currentRole.label} portal`}
          >
            <Icon className="w-3.5 h-3.5" />
            <span>{currentRole.label}</span>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default DemoRoleBar;
