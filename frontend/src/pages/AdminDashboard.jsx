import React, { useState, useEffect } from 'react';
import api from '../api/client';
import {
  Users,
  Zap,
  TrendingUp,
  AlertTriangle,
  LifeBuoy,
  ShieldCheck,
  Clock,
  CheckCircle2,
  DollarSign,
  Boxes,
  Hammer,
  FileText,
  Calendar,
  Layers,
  Sparkles,
  ArrowUpRight,
  Receipt,
  Filter,
  Check,
  Wrench,
  UserCheck,
  ShieldAlert,
  CreditCard,
  Building,
  RefreshCw
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  Cell
} from 'recharts';
import { SkeletonChart, SkeletonCard } from '../components/ui/SkeletonLoader';
import { FALLBACK_DASHBOARD } from '../data/demoSession';

// Custom Enterprise Recharts Tooltip with 100% Guaranteed High-Contrast White Text
const DarkChartTooltip = ({ active, payload, label, unit = '', prefix = '' }) => {
  if (active && payload && payload.length) {
    return (
      <div
        className="chart-tooltip p-3 rounded-2xl text-xs min-w-[160px] z-50"
        style={{ background: '#0f172a', border: '1px solid #334155', color: '#ffffff' }}
      >
        {label && (
          <p className="font-bold mb-1.5 pb-1 text-[11px] uppercase tracking-wider" style={{ color: '#ffffff', borderBottom: '1px solid #334155' }}>
            {label}
          </p>
        )}
        <div className="space-y-1.5">
          {payload.map((item, idx) => {
            const val = item.value;
            const displayVal = typeof val === 'number' ? val.toLocaleString('en-IN') : val;
            const name = item.name || item.dataKey || item.payload?.name || item.payload?.status || item.payload?.label || 'Value';
            return (
              <div key={idx} className="flex items-center justify-between space-x-3" style={{ color: '#ffffff' }}>
                <div className="flex items-center space-x-1.5">
                  <span
                    className="w-2.5 h-2.5 rounded-full shrink-0"
                    style={{ backgroundColor: item.color || item.fill || '#10b981' }}
                  />
                  <span className="font-medium" style={{ color: '#ffffff' }}>{name}:</span>
                </div>
                <span className="font-bold font-mono" style={{ color: '#ffffff' }}>
                  {prefix}{displayVal} {unit}
                  {item.payload?.percent !== undefined ? ` (${item.payload.percent}%)` : ''}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    );
  }
  return null;
};

const AdminDashboard = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedYear, setSelectedYear] = useState('2026');
  const [periodFilter, setPeriodFilter] = useState('full_year');
  const [activeTab, setActiveTab] = useState('all'); // 'all' | 'business' | 'financial' | 'operational' | 'team'

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      // Attempt comprehensive endpoint with live aggregations
      const res = await api.get(`/dashboard/comprehensive?year=${selectedYear}`);
      if (res.success && res.data) {
        setData(res.data);
      } else {
        // Fallback to /analytics/dashboard
        const fbRes = await api.get('/analytics/dashboard');
        if (fbRes.success) setData(fbRes.data);
      }
    } catch (err) {
      console.warn('Comprehensive dashboard fetch failed, trying legacy analytics:', err);
      try {
        const fbRes = await api.get('/analytics/dashboard');
        if (fbRes.success) setData(fbRes.data);
      } catch (e) {
        console.error('All analytics fetches failed:', e);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, [selectedYear]);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {Array.from({ length: 10 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <SkeletonChart />
          <SkeletonChart />
        </div>
      </div>
    );
  }

  // Extract structured modules from comprehensive analytics or fallback
  const business = data?.businessOverview || {
    totalLeads: 0,
    newLeads: 0,
    convertedLeads: 0,
    totalCustomers: 0,
    totalEmployees: 0,
    totalTechnicians: 0,
    totalProjects: 0,
    completedInstallations: 0,
    pendingInstallations: 0,
    installedCapacityKw: 0
  };

  const financial = data?.financialOverview || {
    totalConfirmedRevenue: 0,
    totalExpenses: 0,
    estimatedProfit: 0,
    pendingPayments: 0,
    advancePayments: 0,
    outstandingBalances: 0,
    demoPayments: {
      totalRevenue: 0,
      transactionCount: 0
    }
  };

  const operational = data?.operationalOverview || {
    pendingUserApprovals: 0,
    pendingCustomerRequests: 0,
    pendingSurveys: 0,
    pendingQuotations: 0,
    pendingDispatches: 0,
    ongoingInstallations: 0,
    overdueInstallations: 0,
    openServiceTickets: 0,
    pendingWarrantyClaims: 0,
    lowStockEquipment: 0
  };

  const employeeAnalysis = data?.employeeAnalysis || {
    salesPerformance: [],
    technicianPerformance: []
  };

  // Filter Monthly Financial Data by Period
  let monthlyFinancials = data?.charts?.revenueVsExpenses || FALLBACK_DASHBOARD.charts.monthlyFinancials || [];
  if (periodFilter === 'h1') monthlyFinancials = monthlyFinancials.slice(0, 6);
  else if (periodFilter === 'h2') monthlyFinancials = monthlyFinancials.slice(6, 12);
  else if (periodFilter === 'q1') monthlyFinancials = monthlyFinancials.slice(0, 3);
  else if (periodFilter === 'q2') monthlyFinancials = monthlyFinancials.slice(3, 6);
  else if (periodFilter === 'q3') monthlyFinancials = monthlyFinancials.slice(6, 9);
  else if (periodFilter === 'q4') monthlyFinancials = monthlyFinancials.slice(9, 12);

  // Chart 2: Lead Conversion
  const chart2LeadConversion = data?.charts?.leadConversion || [];

  // Chart 3: Installation Performance
  const chart3InstallationPerformance = data?.charts?.installationPerformance || [];

  // Chart 4: Technician Performance
  const chart4TechnicianPerformance = (data?.charts?.technicianPerformance || employeeAnalysis.technicianPerformance || []).slice(0, 10);

  // Chart 5: Project Capacity (kW)
  const chart5ProjectCapacity = data?.charts?.projectCapacity || [];

  // Chart 6: Service Ticket Status
  const chart6ServiceTicketStatus = data?.charts?.serviceTicketStatus || [];

  const formatCurrencyLakh = (val) => {
    const num = Number(val) || 0;
    return `₹${(num / 100000).toFixed(2)}L`;
  };

  return (
    <div className="space-y-6">
      {/* 1. Header Banner with Telemetry Status & Date Filters */}
      <div className="command-hub-banner flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 p-5 sm:px-6 sm:py-5 rounded-3xl relative overflow-hidden">
        <div className="relative z-10 min-w-0 flex-1 pr-0 lg:pr-6">
          <div className="hub-kicker flex items-center space-x-2 text-xs font-semibold uppercase tracking-wider mb-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 shrink-0 animate-pulse" />
            <span>Admin Intelligence Center • Real-Time Database Metrics</span>
          </div>
          <h1 className="hub-title text-2xl sm:text-3xl font-extrabold tracking-tight">
            Enterprise <span className="gradient-solar-text">Operations & Analytics</span>
          </h1>
          <p className="hub-sub text-xs sm:text-sm mt-1.5 max-w-2xl leading-relaxed">
            Live operations telemetry across site surveys, quotations, technical approvals, orders, inventory serialization, installations, and warranty coverage.
          </p>
        </div>

        {/* Filters: Year, Period, Refresh */}
        <div className="relative z-10 flex flex-wrap items-center gap-2.5 shrink-0">
          <div className="flex items-center space-x-1.5 bg-slate-900/80 border border-slate-700 px-3 py-1.5 rounded-xl text-xs">
            <Calendar className="w-3.5 h-3.5 text-solar-400" />
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
              className="bg-transparent text-white focus:outline-none cursor-pointer font-medium"
            >
              <option value="2026">Year 2026</option>
              <option value="2025">Year 2025</option>
              <option value="2024">Year 2024</option>
            </select>
          </div>

          <div className="flex items-center space-x-1.5 bg-slate-900/80 border border-slate-700 px-3 py-1.5 rounded-xl text-xs">
            <Filter className="w-3.5 h-3.5 text-solar-400" />
            <select
              value={periodFilter}
              onChange={(e) => setPeriodFilter(e.target.value)}
              className="bg-transparent text-white focus:outline-none cursor-pointer font-medium"
            >
              <option value="full_year">All Months</option>
              <option value="h1">H1 (Jan - Jun)</option>
              <option value="h2">H2 (Jul - Dec)</option>
              <option value="q1">Q1 (Jan - Mar)</option>
              <option value="q2">Q2 (Apr - Jun)</option>
              <option value="q3">Q3 (Jul - Sep)</option>
              <option value="q4">Q4 (Oct - Dec)</option>
            </select>
          </div>

          <button
            onClick={fetchAnalytics}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
            title="Refresh database metrics"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>

        <div className="hub-glow pointer-events-none" />
      </div>

      {/* 2. SECTION TABS */}
      <div className="flex border-b border-slate-800 space-x-6 overflow-x-auto text-xs sm:text-sm font-semibold">
        <button
          onClick={() => setActiveTab('all')}
          className={`pb-3 border-b-2 transition-colors whitespace-nowrap ${activeTab === 'all'
            ? 'border-solar-500 text-solar-400'
            : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
        >
          All Intelligence Modules
        </button>
        <button
          onClick={() => setActiveTab('business')}
          className={`pb-3 border-b-2 transition-colors whitespace-nowrap ${activeTab === 'business'
            ? 'border-solar-500 text-solar-400'
            : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
        >
          Business Telemetry
        </button>
        <button
          onClick={() => setActiveTab('financial')}
          className={`pb-3 border-b-2 transition-colors whitespace-nowrap ${activeTab === 'financial'
            ? 'border-solar-500 text-solar-400'
            : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
        >
          Financial & Demo Revenue
        </button>
        <button
          onClick={() => setActiveTab('operational')}
          className={`pb-3 border-b-2 transition-colors whitespace-nowrap ${activeTab === 'operational'
            ? 'border-solar-500 text-solar-400'
            : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
        >
          Operations & Gating
        </button>
        <button
          onClick={() => setActiveTab('team')}
          className={`pb-3 border-b-2 transition-colors whitespace-nowrap ${activeTab === 'team'
            ? 'border-solar-500 text-solar-400'
            : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
        >
          Team & Technician Productivity
        </button>
      </div>

      {/* 3. BUSINESS OVERVIEW (10 KPI Metrics) */}
      {(activeTab === 'all' || activeTab === 'business') && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center space-x-1.5">
              <Layers className="w-3.5 h-3.5 text-solar-400" />
              <span>Business Overview Metrics (Real-Time Database Aggregation)</span>
            </h2>
            <span className="text-[11px] text-slate-500">10 Core Business Indices</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            {/* Total Leads */}
            <div className="p-4 rounded-2xl glass-card border-l-4 border-sky-500">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 block">Total Leads</span>
              <div className="text-xl sm:text-2xl font-bold text-white font-mono mt-0.5">{business.totalLeads}</div>
              <span className="text-[10px] text-sky-400">Pipeline Inquiries</span>
            </div>

            {/* New Leads */}
            <div className="p-4 rounded-2xl glass-card border-l-4 border-amber-500">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 block">New Leads</span>
              <div className="text-xl sm:text-2xl font-bold text-amber-400 font-mono mt-0.5">{business.newLeads}</div>
              <span className="text-[10px] text-slate-400">Awaiting contact</span>
            </div>

            {/* Converted Leads */}
            <div className="p-4 rounded-2xl glass-card border-l-4 border-emerald-500">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 block">Converted Leads</span>
              <div className="text-xl sm:text-2xl font-bold text-emerald-400 font-mono mt-0.5">{business.convertedLeads}</div>
              <span className="text-[10px] text-emerald-400/80">Won & Closed</span>
            </div>

            {/* Total Customers */}
            <div className="p-4 rounded-2xl glass-card border-l-4 border-indigo-500">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 block">Total Customers</span>
              <div className="text-xl sm:text-2xl font-bold text-indigo-300 font-mono mt-0.5">{business.totalCustomers}</div>
              <span className="text-[10px] text-slate-400">Registered Accounts</span>
            </div>

            {/* Total Employees */}
            <div className="p-4 rounded-2xl glass-card border-l-4 border-purple-500">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 block">Total Employees</span>
              <div className="text-xl sm:text-2xl font-bold text-purple-300 font-mono mt-0.5">{business.totalEmployees}</div>
              <span className="text-[10px] text-slate-400">Sales & Staff</span>
            </div>

            {/* Total Technicians */}
            <div className="p-4 rounded-2xl glass-card border-l-4 border-cyan-500">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 block">Technicians</span>
              <div className="text-xl sm:text-2xl font-bold text-cyan-400 font-mono mt-0.5">{business.totalTechnicians}</div>
              <span className="text-[10px] text-slate-400">Field Engineers</span>
            </div>

            {/* Total Projects */}
            <div className="p-4 rounded-2xl glass-card border-l-4 border-solar-500">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 block">Total Projects</span>
              <div className="text-xl sm:text-2xl font-bold text-solar-400 font-mono mt-0.5">{business.totalProjects}</div>
              <span className="text-[10px] text-slate-400">Confirmed Orders</span>
            </div>

            {/* Completed Installations */}
            <div className="p-4 rounded-2xl glass-card border-l-4 border-teal-500">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 block">Completed Installs</span>
              <div className="text-xl sm:text-2xl font-bold text-teal-400 font-mono mt-0.5">{business.completedInstallations}</div>
              <span className="text-[10px] text-slate-400">Commissioned Rooftops</span>
            </div>

            {/* Pending Installations */}
            <div className="p-4 rounded-2xl glass-card border-l-4 border-rose-500">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 block">Pending Installs</span>
              <div className="text-xl sm:text-2xl font-bold text-rose-400 font-mono mt-0.5">{business.pendingInstallations}</div>
              <span className="text-[10px] text-slate-400">In Field Execution</span>
            </div>

            {/* Installed Capacity (kW) */}
            <div className="p-4 rounded-2xl glass-card border-l-4 border-amber-400">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 block">Installed Capacity</span>
              <div className="text-xl sm:text-2xl font-bold text-amber-400 font-mono mt-0.5">
                {business.installedCapacityKw} <span className="text-xs">kW</span>
              </div>
              <span className="text-[10px] text-slate-400">Peak Solar Generation</span>
            </div>
          </div>
        </div>
      )}

      {/* 4. FINANCIAL OVERVIEW & DEMO SEPARATION */}
      {(activeTab === 'all' || activeTab === 'financial') && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center space-x-1.5">
              <DollarSign className="w-3.5 h-3.5 text-emerald-400" />
              <span>Financial Overview & Cash Flow (Reconciliation Engine)</span>
            </h2>
            <span className="text-[11px] text-slate-500">Indian Rupee (₹) Multi-Tier Ledger</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            {/* Total Confirmed Revenue (REAL) */}
            <div className="p-4 rounded-2xl glass-card border-l-4 border-emerald-500">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Total Confirmed Revenue</span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-bold border border-emerald-500/30">REAL</span>
              </div>
              <div className="text-xl sm:text-2xl font-bold text-white font-mono">
                {formatCurrencyLakh(financial.totalConfirmedRevenue)}
              </div>
              <span className="text-[10px] text-slate-400 font-mono">
                ₹{Number(financial.totalConfirmedRevenue).toLocaleString('en-IN')}
              </span>
            </div>

            {/* Total Expenses */}
            <div className="p-4 rounded-2xl glass-card border-l-4 border-rose-500">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 block">Total Expenses</span>
              <div className="text-xl sm:text-2xl font-bold text-rose-400 font-mono mt-1">
                {formatCurrencyLakh(financial.totalExpenses)}
              </div>
              <span className="text-[10px] text-slate-400 font-mono">Procurement & Field Labour</span>
            </div>

            {/* Estimated Profit */}
            <div className="p-4 rounded-2xl glass-card border-l-4 border-teal-500">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 block">Estimated Profit</span>
              <div className="text-xl sm:text-2xl font-bold text-teal-400 font-mono mt-1">
                {formatCurrencyLakh(financial.estimatedProfit)}
              </div>
              <span className="text-[10px] text-slate-400 font-mono">Gross Margin: Net Operational Gain</span>
            </div>

            {/* Pending Payments & Balances */}
            <div className="p-4 rounded-2xl glass-card border-l-4 border-amber-500">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 block">Outstanding Balances</span>
              <div className="text-xl sm:text-2xl font-bold text-amber-400 font-mono mt-1">
                {formatCurrencyLakh(financial.pendingPayments)}
              </div>
              <span className="text-[10px] text-slate-400 font-mono">Post-Commission Receivables</span>
            </div>
          </div>

          {/* DEDICATED DEMO PAYMENT SEPARATION CARD */}
          <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0 border border-amber-500/30">
                <CreditCard className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <h3 className="text-sm font-bold text-white">Simulated / Demo Payments Isolation Ledger</h3>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40 uppercase">
                    Non-Bank Transactions
                  </span>
                </div>
                <p className="text-xs text-amber-300/80 mt-0.5">
                  Demo transactions recorded via Demo UPI, Card, Net Banking, or Cash are segregated and strictly excluded from real confirmed revenue.
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-4 shrink-0 pl-12 sm:pl-0">
              <div className="text-right">
                <span className="text-[10px] text-slate-400 block uppercase">Demo Volume</span>
                <span className="text-base font-bold text-amber-400 font-mono">
                  ₹{Number(financial.demoPayments?.totalRevenue || 0).toLocaleString('en-IN')}
                </span>
              </div>
              <div className="text-right border-l border-amber-500/30 pl-4">
                <span className="text-[10px] text-slate-400 block uppercase">Transactions</span>
                <span className="text-base font-bold text-white font-mono">
                  {financial.demoPayments?.transactionCount || 0}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 5. OPERATIONAL OVERVIEW */}
      {(activeTab === 'all' || activeTab === 'operational') && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center space-x-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-solar-400" />
              <span>Operational Queues & Gating Controls</span>
            </h2>
            <span className="text-[11px] text-slate-500">Live Backlog Audits</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            <div className="p-3.5 rounded-2xl glass-card">
              <span className="text-[10px] text-slate-400 uppercase font-semibold">User Approvals</span>
              <div className="text-lg font-bold text-white font-mono mt-0.5">{operational.pendingUserApprovals}</div>
              <span className="text-[10px] text-slate-500">Staff requests</span>
            </div>
            <div className="p-3.5 rounded-2xl glass-card">
              <span className="text-[10px] text-slate-400 uppercase font-semibold">Customer Requests</span>
              <div className="text-lg font-bold text-white font-mono mt-0.5">{operational.pendingCustomerRequests}</div>
              <span className="text-[10px] text-slate-500">Awaiting review</span>
            </div>
            <div className="p-3.5 rounded-2xl glass-card">
              <span className="text-[10px] text-slate-400 uppercase font-semibold">Pending Surveys</span>
              <div className="text-lg font-bold text-amber-400 font-mono mt-0.5">{operational.pendingSurveys}</div>
              <span className="text-[10px] text-slate-500">Approval gates</span>
            </div>
            <div className="p-3.5 rounded-2xl glass-card">
              <span className="text-[10px] text-slate-400 uppercase font-semibold">Pending Quotes</span>
              <div className="text-lg font-bold text-sky-400 font-mono mt-0.5">{operational.pendingQuotations}</div>
              <span className="text-[10px] text-slate-500">BOM validations</span>
            </div>
            <div className="p-3.5 rounded-2xl glass-card">
              <span className="text-[10px] text-slate-400 uppercase font-semibold">Pending Dispatches</span>
              <div className="text-lg font-bold text-purple-400 font-mono mt-0.5">{operational.pendingDispatches}</div>
              <span className="text-[10px] text-slate-500">Warehouse releases</span>
            </div>
            <div className="p-3.5 rounded-2xl glass-card">
              <span className="text-[10px] text-slate-400 uppercase font-semibold">Ongoing Installs</span>
              <div className="text-lg font-bold text-emerald-400 font-mono mt-0.5">{operational.ongoingInstallations}</div>
              <span className="text-[10px] text-slate-500">Active sites</span>
            </div>
            <div className="p-3.5 rounded-2xl glass-card">
              <span className="text-[10px] text-slate-400 uppercase font-semibold">Overdue Installs</span>
              <div className="text-lg font-bold text-rose-400 font-mono mt-0.5">{operational.overdueInstallations}</div>
              <span className="text-[10px] text-rose-400/80">SLA alerts</span>
            </div>
            <div className="p-3.5 rounded-2xl glass-card">
              <span className="text-[10px] text-slate-400 uppercase font-semibold">Open Tickets</span>
              <div className="text-lg font-bold text-fuchsia-400 font-mono mt-0.5">{operational.openServiceTickets}</div>
              <span className="text-[10px] text-slate-500">Field complaints</span>
            </div>
            <div className="p-3.5 rounded-2xl glass-card">
              <span className="text-[10px] text-slate-400 uppercase font-semibold">Warranty Claims</span>
              <div className="text-lg font-bold text-amber-400 font-mono mt-0.5">{operational.pendingWarrantyClaims}</div>
              <span className="text-[10px] text-slate-500">Component reviews</span>
            </div>
            <div className="p-3.5 rounded-2xl glass-card">
              <span className="text-[10px] text-slate-400 uppercase font-semibold">Low-Stock Items</span>
              <div className="text-lg font-bold text-red-400 font-mono mt-0.5">{operational.lowStockEquipment}</div>
              <span className="text-[10px] text-slate-500">Below safety limit</span>
            </div>
          </div>
        </div>
      )}

      {/* 6. THE 6 RECHARTS CHARTS */}
      <div className="space-y-6">
        {/* ROW 1: Chart 1 (Revenue vs Expenses) & Chart 2 (Lead Conversion) */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Chart 1: Revenue vs Expenses */}
          <div className="p-5 sm:p-6 rounded-3xl glass-card border border-slate-800">
            <div className="mb-4">
              <div className="flex items-center justify-between">
                <h2 className="text-base font-bold text-white flex items-center space-x-2">
                  <TrendingUp className="w-4 h-4 text-solar-400" />
                  <span>Chart 1: Revenue vs Expenses</span>
                </h2>
                <span className="text-[11px] px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-mono border border-slate-700">
                  Unit: ₹ INR
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Monthly gross collection vs operational procurement expenses
              </p>
            </div>

            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={monthlyFinancials} margin={{ top: 10, right: 20, left: 15, bottom: 0 }}>
                  <defs>
                    <linearGradient id="chartRevGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="chartExpGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#f43f5e" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis dataKey="month" stroke="#64748b" tick={{ fontSize: 11 }} label={{ value: 'Month', position: 'insideBottomRight', offset: -5, fill: '#64748b', fontSize: 10 }} />
                  <YAxis
                    stroke="#64748b"
                    tick={{ fontSize: 11 }}
                    tickFormatter={(val) => `₹${val / 1000}k`}
                    label={{ value: 'Amount (₹)', angle: -90, position: 'insideLeft', fill: '#64748b', fontSize: 10 }}
                  />
                  <Tooltip content={<DarkChartTooltip prefix="₹" />} />
                  <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                  <Area type="monotone" dataKey="revenue" name="Revenue (₹)" stroke="#f59e0b" strokeWidth={2} fillOpacity={1} fill="url(#chartRevGrad)" />
                  <Area type="monotone" dataKey="expenses" name="Expenses (₹)" stroke="#f43f5e" strokeWidth={2} fillOpacity={1} fill="url(#chartExpGrad)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Chart 2: Lead Conversion */}
          <div className="p-5 sm:p-6 rounded-3xl glass-card border border-slate-800">
            <div className="mb-4">
              <div className="flex items-center justify-between">
                <h2 className="text-base font-bold text-white flex items-center space-x-2">
                  <FileText className="w-4 h-4 text-sky-400" />
                  <span>Chart 2: Lead Conversion Pipeline</span>
                </h2>
                <span className="text-[11px] px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-mono border border-slate-700">
                  Unit: Number of Leads
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Distribution of inquiry stages across sales funnel lifecycle
              </p>
            </div>

            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chart2LeadConversion} margin={{ top: 10, right: 20, left: 10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis dataKey="label" stroke="#64748b" tick={{ fontSize: 10 }} label={{ value: 'Lead Status', position: 'insideBottomRight', offset: -5, fill: '#64748b', fontSize: 10 }} />
                  <YAxis
                    stroke="#64748b"
                    tick={{ fontSize: 11 }}
                    label={{ value: 'Number of Leads', angle: -90, position: 'insideLeft', fill: '#64748b', fontSize: 10 }}
                  />
                  <Tooltip content={<DarkChartTooltip unit="Leads" />} />
                  <Bar dataKey="count" name="Leads" radius={[6, 6, 0, 0]}>
                    {chart2LeadConversion.map((entry, index) => (
                      <Cell key={`lead-${index}`} fill={entry.fill || '#38bdf8'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* ROW 2: Chart 3 (Installation Performance) & Chart 4 (Technician Performance) */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Chart 3: Installation Performance */}
          <div className="p-5 sm:p-6 rounded-3xl glass-card border border-slate-800">
            <div className="mb-4">
              <div className="flex items-center justify-between">
                <h2 className="text-base font-bold text-white flex items-center space-x-2">
                  <Hammer className="w-4 h-4 text-teal-400" />
                  <span>Chart 3: Installation Performance by Month</span>
                </h2>
                <span className="text-[11px] px-2 py-0.5 rounded bg-slate-800 text-teal-400 font-mono border border-teal-500/30">
                  Unit: Number of Installations
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Completed rooftop handovers vs active in-progress executions
              </p>
            </div>

            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chart3InstallationPerformance} margin={{ top: 10, right: 20, left: 10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis dataKey="month" stroke="#64748b" tick={{ fontSize: 11 }} label={{ value: 'Month', position: 'insideBottomRight', offset: -5, fill: '#64748b', fontSize: 10 }} />
                  <YAxis
                    stroke="#64748b"
                    tick={{ fontSize: 11 }}
                    label={{ value: 'Number of Installations', angle: -90, position: 'insideLeft', fill: '#64748b', fontSize: 10 }}
                  />
                  <Tooltip content={<DarkChartTooltip unit="Sites" />} />
                  <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                  <Bar dataKey="completed" name="Completed Installations" fill="#10b981" radius={[6, 6, 0, 0]} />
                  <Bar dataKey="inProgress" name="In-Progress" fill="#f59e0b" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Chart 4: Technician Performance */}
          <div className="p-5 sm:p-6 rounded-3xl glass-card border border-slate-800">
            <div className="mb-4">
              <div className="flex items-center justify-between">
                <h2 className="text-base font-bold text-white flex items-center space-x-2">
                  <Wrench className="w-4 h-4 text-cyan-400" />
                  <span>Chart 4: Technician Completed Jobs</span>
                </h2>
                <span className="text-[11px] px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-mono border border-slate-700">
                  Unit: Completed Jobs
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Installation and servicing throughput per certified field technician
              </p>
            </div>

            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chart4TechnicianPerformance} margin={{ top: 10, right: 20, left: 10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis dataKey="technicianName" stroke="#64748b" tick={{ fontSize: 10 }} label={{ value: 'Technician Name', position: 'insideBottomRight', offset: -5, fill: '#64748b', fontSize: 10 }} />
                  <YAxis
                    stroke="#64748b"
                    tick={{ fontSize: 11 }}
                    label={{ value: 'Completed Jobs', angle: -90, position: 'insideLeft', fill: '#64748b', fontSize: 10 }}
                  />
                  <Tooltip content={<DarkChartTooltip unit="Jobs" />} />
                  <Bar dataKey="completedJobs" name="Completed Jobs" fill="#06b6d4" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* ROW 3: Chart 5 (Project Capacity) & Chart 6 (Service Ticket Status) */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Chart 5: Project Capacity */}
          <div className="p-5 sm:p-6 rounded-3xl glass-card border border-slate-800">
            <div className="mb-4">
              <div className="flex items-center justify-between">
                <h2 className="text-base font-bold text-white flex items-center space-x-2">
                  <Zap className="w-4 h-4 text-emerald-400" />
                  <span>Chart 5: Monthly Installed Capacity (kW)</span>
                </h2>
                <span className="text-[11px] px-2 py-0.5 rounded bg-slate-800 text-emerald-400 font-mono border border-emerald-500/30">
                  Unit: Installed Capacity (kW)
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Total power wattage contracted and installed across calendar months
              </p>
            </div>

            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chart5ProjectCapacity} margin={{ top: 10, right: 20, left: 10, bottom: 0 }}>
                  <defs>
                    <linearGradient id="chartCapGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.9} />
                      <stop offset="95%" stopColor="#059669" stopOpacity={0.6} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis dataKey="month" stroke="#64748b" tick={{ fontSize: 11 }} label={{ value: 'Month', position: 'insideBottomRight', offset: -5, fill: '#64748b', fontSize: 10 }} />
                  <YAxis
                    stroke="#64748b"
                    tick={{ fontSize: 11 }}
                    label={{ value: 'Installed Capacity (kW)', angle: -90, position: 'insideLeft', fill: '#64748b', fontSize: 10 }}
                  />
                  <Tooltip content={<DarkChartTooltip unit="kW" />} />
                  <Bar dataKey="capacityKw" name="Installed Capacity (kW)" fill="url(#chartCapGrad)" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Chart 6: Service Ticket Status */}
          <div className="p-5 sm:p-6 rounded-3xl glass-card border border-slate-800">
            <div className="mb-4">
              <div className="flex items-center justify-between">
                <h2 className="text-base font-bold text-white flex items-center space-x-2">
                  <LifeBuoy className="w-4 h-4 text-fuchsia-400" />
                  <span>Chart 6: Service Ticket Status</span>
                </h2>
                <span className="text-[11px] px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-mono border border-slate-700">
                  Unit: Number of Tickets
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Support, repairs, and component claims organized by resolution state
              </p>
            </div>

            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chart6ServiceTicketStatus} margin={{ top: 10, right: 20, left: 10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis dataKey="label" stroke="#64748b" tick={{ fontSize: 10 }} label={{ value: 'Ticket Status', position: 'insideBottomRight', offset: -5, fill: '#64748b', fontSize: 10 }} />
                  <YAxis
                    stroke="#64748b"
                    tick={{ fontSize: 11 }}
                    label={{ value: 'Number of Tickets', angle: -90, position: 'insideLeft', fill: '#64748b', fontSize: 10 }}
                  />
                  <Tooltip content={<DarkChartTooltip unit="Tickets" />} />
                  <Bar dataKey="count" name="Tickets" radius={[6, 6, 0, 0]}>
                    {chart6ServiceTicketStatus.map((entry, index) => (
                      <Cell key={`ticket-${index}`} fill={entry.fill || '#38bdf8'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>

      {/* 7. EMPLOYEE & TECHNICIAN ANALYSIS TABLE */}
      {(activeTab === 'all' || activeTab === 'team') && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-2">
          {/* Sales Performance */}
          <div className="p-5 sm:p-6 rounded-3xl glass-card border border-slate-800 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Users className="w-4 h-4 text-amber-400" />
                <h3 className="text-sm font-bold text-white">Sales Executive Lead Conversion</h3>
              </div>
              <span className="text-xs text-slate-400">Team Conversion Metrics</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-900/80 uppercase text-[10px] font-bold text-slate-400 border-b border-slate-800">
                  <tr>
                    <th className="px-3 py-2.5">Sales Representative</th>
                    <th className="px-3 py-2.5">Total Leads</th>
                    <th className="px-3 py-2.5">Converted</th>
                    <th className="px-3 py-2.5 text-right">Conversion Rate</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-sans">
                  {employeeAnalysis.salesPerformance.map((sales, idx) => (
                    <tr key={idx} className="hover:bg-slate-800/40">
                      <td className="px-3 py-2.5 font-medium text-white">{sales.name}</td>
                      <td className="px-3 py-2.5 font-mono">{sales.totalLeads}</td>
                      <td className="px-3 py-2.5 font-mono text-emerald-400">{sales.convertedLeads}</td>
                      <td className="px-3 py-2.5 text-right font-mono font-bold text-solar-400">
                        {sales.conversionRate}%
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Technician Hours & Productivity */}
          <div className="p-5 sm:p-6 rounded-3xl glass-card border border-slate-800 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Wrench className="w-4 h-4 text-cyan-400" />
                <h3 className="text-sm font-bold text-white">Technician Hours & Field Jobs</h3>
              </div>
              <span className="text-xs text-slate-400">Field Engineers</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-900/80 uppercase text-[10px] font-bold text-slate-400 border-b border-slate-800">
                  <tr>
                    <th className="px-3 py-2.5">Technician</th>
                    <th className="px-3 py-2.5">Completed Jobs</th>
                    <th className="px-3 py-2.5">Working Hours</th>
                    <th className="px-3 py-2.5 text-right">Rating</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-sans">
                  {employeeAnalysis.technicianPerformance.slice(0, 5).map((tech, idx) => (
                    <tr key={idx} className="hover:bg-slate-800/40">
                      <td className="px-3 py-2.5 font-medium text-white">{tech.name}</td>
                      <td className="px-3 py-2.5 font-mono text-cyan-400 font-bold">{tech.completedJobs}</td>
                      <td className="px-3 py-2.5 font-mono">{tech.workingHours} hrs</td>
                      <td className="px-3 py-2.5 text-right font-mono font-bold text-amber-400">
                        ⭐ {tech.rating || 4.8}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
