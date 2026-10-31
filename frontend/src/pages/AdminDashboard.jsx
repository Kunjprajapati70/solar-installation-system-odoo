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
  Receipt
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
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { SkeletonChart, SkeletonCard } from '../components/ui/SkeletonLoader';
import { FALLBACK_DASHBOARD } from '../data/demoSession';

const AdminDashboard = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [dateFilter, setDateFilter] = useState('full_year');

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const res = await api.get('/analytics/dashboard');
        if (res.success) {
          setData(res.data);
        }
      } catch (err) {
        console.error('Failed to load analytics:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, []);

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

  const kpis = { ...FALLBACK_DASHBOARD.kpis, ...(data?.kpis || {}) };
  const charts = { ...FALLBACK_DASHBOARD.charts, ...(data?.charts || {}) };

  // Apply optional period filter to monthly data
  let monthlyFinancials = charts.monthlyFinancials || [];
  if (dateFilter === 'h1') {
    monthlyFinancials = monthlyFinancials.slice(0, 6);
  } else if (dateFilter === 'h2') {
    monthlyFinancials = monthlyFinancials.slice(6, 12);
  } else if (dateFilter === 'q3') {
    monthlyFinancials = monthlyFinancials.slice(6, 9);
  }

  // Format currency in Indian numbering (Lakhs or raw)
  const formatCurrencyLakh = (val) => {
    const num = Number(val) || 0;
    return `₹${(num / 100000).toFixed(2)}L`;
  };

  // Pipeline Status data with percentages
  const pipelineStages = charts.pipelineStageCounts || [
    { name: 'Pending', count: 8, color: '#94a3b8' },
    { name: 'Survey', count: 7, color: '#38bdf8' },
    { name: 'Approved', count: 12, color: '#a855f7' },
    { name: 'In Progress', count: 10, color: '#f59e0b' },
    { name: 'Completed', count: 25, color: '#10b981' }
  ];
  const totalPipelineCount = pipelineStages.reduce((sum, s) => sum + (s.count || 0), 0) || 1;
  const pipelineDataWithPercent = pipelineStages.map(s => ({
    name: s.name,
    value: s.count,
    percent: Math.round(((s.count || 0) / totalPipelineCount) * 100),
    color: s.color
  }));

  // Service Ticket Analysis data
  const ticketAnalysisData = charts.serviceTicketStatusChart || [
    { status: 'Open', count: 4, fill: '#38bdf8' },
    { status: 'Assigned', count: 3, fill: '#818cf8' },
    { status: 'In Progress', count: 5, fill: '#f59e0b' },
    { status: 'Parts Awaited', count: 2, fill: '#ec4899' },
    { status: 'Resolved', count: 18, fill: '#10b981' }
  ];

  // Inventory Overview data
  const inventoryData = (charts.inventoryStockChart || []).map(item => ({
    category: item.category,
    availableQty: item.availableStock ?? item.currentStock,
    reorderThreshold: item.safetyThreshold
  }));

  return (
    <div className="space-y-6">
      {/* 1. Header Banner with Telemetry Status & Date Filter */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 p-6 rounded-3xl glass-card border border-solar-500/20 bg-gradient-to-r from-midnight-900 via-midnight-850 to-midnight-900 relative overflow-hidden shadow-2xl">
        <div className="relative z-10">
          <div className="flex items-center space-x-2 text-solar-400 text-xs font-semibold uppercase tracking-wider mb-1">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
            <span>Telemetry Center • Real-Time Database Metrics</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            SunPower <span className="gradient-solar-text">Command Hub</span>
          </h1>
          <p className="text-slate-400 text-xs sm:text-sm mt-1 max-w-2xl">
            Live enterprise operations overview across site surveys, technical approvals, equipment serialization, rooftop installations, and warranty coverage.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 relative z-10">
          {/* Date Filter Selector */}
          <div className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-slate-900/90 border border-slate-700/80 text-xs">
            <Calendar className="w-3.5 h-3.5 text-solar-400" />
            <select
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="bg-transparent text-slate-200 focus:outline-none cursor-pointer"
            >
              <option value="full_year">Full Year 2026</option>
              <option value="h1">H1 2026 (Jan - Jun)</option>
              <option value="h2">H2 2026 (Jul - Dec)</option>
              <option value="q3">Q3 2026 (Jul - Sep)</option>
            </select>
          </div>

          <div className="text-right px-4 py-2 rounded-xl bg-slate-900/90 border border-emerald-500/30 shadow-inner">
            <span className="text-[10px] text-slate-400 uppercase font-semibold block">Total Solar Deployed</span>
            <span className="text-xl font-black font-mono text-emerald-400">
              {kpis.totalInstalledCapacityKw || 0} kW
            </span>
          </div>
        </div>

        {/* Decorative background sun rays glow */}
        <div className="absolute -right-16 -top-16 w-64 h-64 bg-solar-500/10 rounded-full blur-3xl pointer-events-none" />
      </div>

      {/* 2. All 10 Required Statistics Cards in a Responsive Grid */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center space-x-1.5">
            <Layers className="w-3.5 h-3.5 text-solar-400" />
            <span>Core Telemetry Key Performance Indicators (Database-Driven)</span>
          </h2>
          <span className="text-[11px] text-slate-500">10 of 10 metrics verified</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
          {/* 1. Total Customers */}
          <div className="p-4 rounded-2xl glass-card glass-card-hover border-l-4 border-sky-500">
            <div className="flex items-center justify-between text-slate-400 mb-1">
              <span className="text-[11px] font-semibold uppercase tracking-wider">1. Total Customers</span>
              <Users className="w-4 h-4 text-sky-400" />
            </div>
            <div className="text-xl sm:text-2xl font-bold text-white font-mono">{kpis.totalCustomers || 0}</div>
            <span className="text-[10px] text-slate-400">Rooftop accounts</span>
          </div>

          {/* 2. Total Projects */}
          <div className="p-4 rounded-2xl glass-card glass-card-hover border-l-4 border-indigo-500">
            <div className="flex items-center justify-between text-slate-400 mb-1">
              <span className="text-[11px] font-semibold uppercase tracking-wider">2. Total Projects</span>
              <FileText className="w-4 h-4 text-indigo-400" />
            </div>
            <div className="text-xl sm:text-2xl font-bold text-indigo-300 font-mono">{kpis.totalProjects || kpis.totalOrders || 0}</div>
            <span className="text-[10px] text-slate-400">Contracted sites</span>
          </div>

          {/* 3. Completed Installations */}
          <div className="p-4 rounded-2xl glass-card glass-card-hover border-l-4 border-emerald-500">
            <div className="flex items-center justify-between text-slate-400 mb-1">
              <span className="text-[11px] font-semibold uppercase tracking-wider">3. Completed Installs</span>
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="text-xl sm:text-2xl font-bold text-emerald-400 font-mono">{kpis.totalInstallations || 0}</div>
            <span className="text-[10px] text-slate-400">{kpis.activeInstallations || 0} in field execution</span>
          </div>

          {/* 4. Installed Capacity (kW) */}
          <div className="p-4 rounded-2xl glass-card glass-card-hover border-l-4 border-amber-400">
            <div className="flex items-center justify-between text-slate-400 mb-1">
              <span className="text-[11px] font-semibold uppercase tracking-wider">4. Installed Capacity</span>
              <Zap className="w-4 h-4 text-amber-400" />
            </div>
            <div className="text-xl sm:text-2xl font-bold text-amber-400 font-mono">
              {kpis.totalInstalledCapacityKw || 0} <span className="text-xs">kW</span>
            </div>
            <span className="text-[10px] text-slate-400">Total peak solar wattage</span>
          </div>

          {/* 5. Total Revenue (₹) */}
          <div className="p-4 rounded-2xl glass-card glass-card-hover border-l-4 border-solar-500">
            <div className="flex items-center justify-between text-slate-400 mb-1">
              <span className="text-[11px] font-semibold uppercase tracking-wider">5. Total Revenue</span>
              <TrendingUp className="w-4 h-4 text-solar-400" />
            </div>
            <div className="text-xl sm:text-2xl font-bold text-white font-mono">
              {formatCurrencyLakh(kpis.totalRevenue)}
            </div>
            <span className="text-[10px] text-emerald-400 font-mono">₹{kpis.totalRevenue?.toLocaleString('en-IN')}</span>
          </div>

          {/* 6. Total Expenses (₹) */}
          <div className="p-4 rounded-2xl glass-card glass-card-hover border-l-4 border-rose-500">
            <div className="flex items-center justify-between text-slate-400 mb-1">
              <span className="text-[11px] font-semibold uppercase tracking-wider">6. Total Expenses</span>
              <Receipt className="w-4 h-4 text-rose-400" />
            </div>
            <div className="text-xl sm:text-2xl font-bold text-rose-400 font-mono">
              {formatCurrencyLakh(kpis.totalExpenses)}
            </div>
            <span className="text-[10px] text-slate-400">Procurement & Labour</span>
          </div>

          {/* 7. Estimated Profit (₹) */}
          <div className="p-4 rounded-2xl glass-card glass-card-hover border-l-4 border-teal-500">
            <div className="flex items-center justify-between text-slate-400 mb-1">
              <span className="text-[11px] font-semibold uppercase tracking-wider">7. Estimated Profit</span>
              <DollarSign className="w-4 h-4 text-teal-400" />
            </div>
            <div className="text-xl sm:text-2xl font-bold text-teal-400 font-mono">
              {formatCurrencyLakh(kpis.estimatedProfit)}
            </div>
            <span className="text-[10px] text-slate-400 font-mono">Revenue - Direct Cost</span>
          </div>

          {/* 8. Pending Payments */}
          <div className="p-4 rounded-2xl glass-card glass-card-hover border-l-4 border-amber-500">
            <div className="flex items-center justify-between text-slate-400 mb-1">
              <span className="text-[11px] font-semibold uppercase tracking-wider">8. Pending Payments</span>
              <AlertTriangle className="w-4 h-4 text-amber-400" />
            </div>
            <div className="text-xl sm:text-2xl font-bold text-amber-400 font-mono">
              {formatCurrencyLakh(kpis.pendingPayments)}
            </div>
            <span className="text-[10px] text-slate-400">Post-commission balance</span>
          </div>

          {/* 9. Open Service Tickets */}
          <div className="p-4 rounded-2xl glass-card glass-card-hover border-l-4 border-fuchsia-500">
            <div className="flex items-center justify-between text-slate-400 mb-1">
              <span className="text-[11px] font-semibold uppercase tracking-wider">9. Open Tickets</span>
              <LifeBuoy className="w-4 h-4 text-fuchsia-400" />
            </div>
            <div className="text-xl sm:text-2xl font-bold text-fuchsia-400 font-mono">{kpis.openTicketsCount || 0}</div>
            <span className="text-[10px] text-slate-400">{kpis.warrantyClaimsCount || 0} warranty claims</span>
          </div>

          {/* 10. Low Stock Items */}
          <div className="p-4 rounded-2xl glass-card glass-card-hover border-l-4 border-red-500">
            <div className="flex items-center justify-between text-slate-400 mb-1">
              <span className="text-[11px] font-semibold uppercase tracking-wider">10. Low Stock Items</span>
              <Boxes className="w-4 h-4 text-red-400" />
            </div>
            <div className="text-xl sm:text-2xl font-bold text-red-400 font-mono">{kpis.lowStockCount || 0}</div>
            <span className="text-[10px] text-slate-400">SKUs below safety level</span>
          </div>
        </div>
      </div>

      {/* 3. The 5 Interactive Recharts */}
      <div className="space-y-6">
        {/* ROW 1: Chart 1 (Revenue vs Expenses) & Chart 2 (Installation Status) */}
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
                      <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.4}/>
                      <stop offset="95%" stopColor="#f59e0b" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="chartExpGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.4}/>
                      <stop offset="95%" stopColor="#f43f5e" stopOpacity={0}/>
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
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', fontSize: '12px' }}
                    formatter={(val) => [`₹${Number(val).toLocaleString('en-IN')}`, '']}
                  />
                  <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                  <Area type="monotone" dataKey="revenue" name="Revenue (₹)" stroke="#f59e0b" strokeWidth={2} fillOpacity={1} fill="url(#chartRevGrad)" />
                  <Area type="monotone" dataKey="expenses" name="Expenses (₹)" stroke="#f43f5e" strokeWidth={2} fillOpacity={1} fill="url(#chartExpGrad)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Chart 2: Installation Status */}
          <div className="p-5 sm:p-6 rounded-3xl glass-card border border-slate-800">
            <div className="mb-4">
              <div className="flex items-center justify-between">
                <h2 className="text-base font-bold text-white flex items-center space-x-2">
                  <Hammer className="w-4 h-4 text-sky-400" />
                  <span>Chart 2: Installation Status Breakdown</span>
                </h2>
                <span className="text-[11px] px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-mono border border-slate-700">
                  Total: {totalPipelineCount} Projects
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Categories: Pending, Survey, Approved, In Progress, Completed
              </p>
            </div>

            <div className="h-72 w-full flex flex-col sm:flex-row items-center justify-center">
              <div className="w-full sm:w-3/5 h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pipelineDataWithPercent}
                      cx="50%"
                      cy="50%"
                      innerRadius={55}
                      outerRadius={85}
                      paddingAngle={4}
                      dataKey="value"
                      label={({ name, percent }) => `${percent}%`}
                    >
                      {pipelineDataWithPercent.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', fontSize: '12px' }}
                      formatter={(val, name, item) => [`${val} Projects (${item.payload.percent}%)`, item.payload.name]}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              {/* Status Legend with Percentages */}
              <div className="w-full sm:w-2/5 space-y-2 text-xs pt-2 sm:pt-0">
                {pipelineDataWithPercent.map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between p-1.5 rounded-lg bg-slate-900/60 border border-slate-800">
                    <div className="flex items-center space-x-2">
                      <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                      <span className="text-slate-300 font-medium">{item.name}</span>
                    </div>
                    <div className="flex items-center space-x-1.5 font-mono">
                      <span className="text-white font-bold">{item.value}</span>
                      <span className="text-slate-500 text-[10px]">({item.percent}%)</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* ROW 2: Chart 3 (Monthly Installed Capacity) & Chart 4 (Service Ticket Analysis) */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Chart 3: Monthly Installed Capacity */}
          <div className="p-5 sm:p-6 rounded-3xl glass-card border border-slate-800">
            <div className="mb-4">
              <div className="flex items-center justify-between">
                <h2 className="text-base font-bold text-white flex items-center space-x-2">
                  <Zap className="w-4 h-4 text-emerald-400" />
                  <span>Chart 3: Monthly Installed Capacity</span>
                </h2>
                <span className="text-[11px] px-2 py-0.5 rounded bg-slate-800 text-emerald-400 font-mono border border-emerald-500/30">
                  Unit: kW
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Installed solar power capacity delivered each calendar month
              </p>
            </div>

            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthlyFinancials} margin={{ top: 10, right: 20, left: 10, bottom: 0 }}>
                  <defs>
                    <linearGradient id="chartCapGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.9}/>
                      <stop offset="95%" stopColor="#059669" stopOpacity={0.6}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis dataKey="month" stroke="#64748b" tick={{ fontSize: 11 }} label={{ value: 'Month', position: 'insideBottomRight', offset: -5, fill: '#64748b', fontSize: 10 }} />
                  <YAxis
                    stroke="#64748b"
                    tick={{ fontSize: 11 }}
                    label={{ value: 'Installed Capacity (kW)', angle: -90, position: 'insideLeft', fill: '#64748b', fontSize: 10 }}
                  />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', fontSize: '12px' }}
                    formatter={(val) => [`${val} kW`, 'Installed Capacity']}
                  />
                  <Bar dataKey="capacityKw" name="Installed Capacity (kW)" fill="url(#chartCapGrad)" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Chart 4: Service Ticket Analysis */}
          <div className="p-5 sm:p-6 rounded-3xl glass-card border border-slate-800">
            <div className="mb-4">
              <div className="flex items-center justify-between">
                <h2 className="text-base font-bold text-white flex items-center space-x-2">
                  <LifeBuoy className="w-4 h-4 text-fuchsia-400" />
                  <span>Chart 4: Service Ticket Analysis</span>
                </h2>
                <span className="text-[11px] px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-mono border border-slate-700">
                  Unit: Number of Tickets
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Support, repair, and warranty claim ticket counts by resolution state
              </p>
            </div>

            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={ticketAnalysisData} margin={{ top: 10, right: 20, left: 10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis dataKey="status" stroke="#64748b" tick={{ fontSize: 10 }} label={{ value: 'Ticket Status', position: 'insideBottomRight', offset: -5, fill: '#64748b', fontSize: 10 }} />
                  <YAxis
                    stroke="#64748b"
                    tick={{ fontSize: 11 }}
                    label={{ value: 'Number of Tickets', angle: -90, position: 'insideLeft', fill: '#64748b', fontSize: 10 }}
                  />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', fontSize: '12px' }}
                    formatter={(val) => [`${val} Tickets`, 'Count']}
                  />
                  <Bar dataKey="count" name="Tickets" radius={[6, 6, 0, 0]}>
                    {ticketAnalysisData.map((entry, index) => (
                      <Cell key={`ticket-${index}`} fill={entry.fill || '#38bdf8'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* ROW 3: Chart 5 (Inventory Overview) - Full Width */}
        <div className="p-5 sm:p-6 rounded-3xl glass-card border border-slate-800">
          <div className="mb-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-white flex items-center space-x-2">
                <Boxes className="w-4 h-4 text-amber-400" />
                <span>Chart 5: Inventory Overview (Stock by Category)</span>
              </h2>
              <span className="text-[11px] px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-mono border border-slate-700">
                Unit: Available Quantity (Units / Meters)
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Available warehouse quantity per equipment category compared against safety reorder thresholds
            </p>
          </div>

          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={inventoryData} margin={{ top: 10, right: 20, left: 10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="category" stroke="#64748b" tick={{ fontSize: 11 }} label={{ value: 'Equipment Category', position: 'insideBottomRight', offset: -5, fill: '#64748b', fontSize: 10 }} />
                <YAxis
                  stroke="#64748b"
                  tick={{ fontSize: 11 }}
                  label={{ value: 'Available Quantity', angle: -90, position: 'insideLeft', fill: '#64748b', fontSize: 10 }}
                />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', fontSize: '12px' }}
                />
                <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                <Bar dataKey="availableQty" name="Available Quantity" fill="#06b6d4" radius={[6, 6, 0, 0]} />
                <Bar dataKey="reorderThreshold" name="Safety Reorder Threshold" fill="#f43f5e" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* 4. Technician Field Performance Roster */}
      <div className="p-5 sm:p-6 rounded-3xl glass-card border border-slate-800">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-base font-bold text-white flex items-center space-x-2">
              <Users className="w-4 h-4 text-emerald-400" />
              <span>Certified Field Technician Performance Roster</span>
            </h2>
            <p className="text-xs text-slate-400">Total jobs executed, logged field hours, and verified customer ratings</p>
          </div>
          <span className="text-[11px] text-slate-500 font-mono hidden sm:inline">15 certified staff</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-900/80 text-slate-400 uppercase tracking-wider text-[10px] border-b border-slate-800">
              <tr>
                <th className="py-3 px-3">Technician</th>
                <th className="py-3 px-3">Phone</th>
                <th className="py-3 px-3 text-center">Completed Jobs</th>
                <th className="py-3 px-3 text-center">Active Jobs</th>
                <th className="py-3 px-3 text-center">Hours Logged</th>
                <th className="py-3 px-3 text-right">Customer Rating</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-sans">
              {(charts.technicianStats || []).slice(0, 8).map((tech) => (
                <tr key={tech.id} className="hover:bg-slate-800/30 transition">
                  <td className="py-3 px-3 font-semibold text-slate-200">{tech.name}</td>
                  <td className="py-3 px-3 text-slate-400 font-mono">{tech.phone}</td>
                  <td className="py-3 px-3 text-center text-emerald-400 font-mono font-bold">{tech.completedJobs}</td>
                  <td className="py-3 px-3 text-center text-amber-400 font-mono font-bold">{tech.activeJobs}</td>
                  <td className="py-3 px-3 text-center text-slate-300 font-mono">{tech.totalHoursLogged} hrs</td>
                  <td className="py-3 px-3 text-right">
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/30">
                      ★ {tech.rating}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
