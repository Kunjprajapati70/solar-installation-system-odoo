import React, { useState, useEffect } from 'react';
import api from '../api/client';
import {
  BarChart3,
  Download,
  Printer,
  Calendar,
  FileSpreadsheet,
  CheckCircle2,
  TrendingUp,
  Layers,
  Boxes,
  LifeBuoy,
  Users,
  Zap,
  Hammer
} from 'lucide-react';
import Button from '../components/ui/Button';

const ReportsView = () => {
  const [reportType, setReportType] = useState('financial'); // financial, installations, technician, inventory, service
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [installationsList, setInstallationsList] = useState([]);
  const [inventoryList, setInventoryList] = useState([]);
  const [ticketsList, setTicketsList] = useState([]);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        setLoading(true);
        const asList = (payload) => (Array.isArray(payload) ? payload : []);
        const [dashRes, instRes, invRes, tickRes] = await Promise.allSettled([
          api.get('/analytics/dashboard'),
          api.get('/installations', { params: { limit: 1000 } }),
          api.get('/inventory', { params: { limit: 1000 } }),
          api.get('/service-tickets', { params: { limit: 1000 } })
        ]);

        if (dashRes.status === 'fulfilled' && dashRes.value.success) setData(dashRes.value.data);
        if (instRes.status === 'fulfilled' && instRes.value.success) setInstallationsList(asList(instRes.value.data));
        if (invRes.status === 'fulfilled' && invRes.value.success) setInventoryList(asList(invRes.value.data));
        if (tickRes.status === 'fulfilled' && tickRes.value.success) setTicketsList(asList(tickRes.value.data));
      } catch (err) {
        console.error('Fetch reports data error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, []);

  const handleExportCSV = () => {
    let csvContent = 'data:text/csv;charset=utf-8,';

    if (reportType === 'financial' && data?.charts?.monthlyFinancials) {
      csvContent += 'Month,Revenue (INR),Expenses (INR),Net Profit (INR),Installations,Capacity (kW)\n';
      data.charts.monthlyFinancials.forEach(row => {
        csvContent += `${row.month} 2026,${row.revenue},${row.expenses},${row.profit},${row.installationsCount},${row.capacityKw}\n`;
      });
    } else if (reportType === 'technician' && data?.charts?.technicianStats) {
      csvContent += 'Technician Name,Phone,Completed Jobs,Active Jobs,Hours Logged,Rating\n';
      data.charts.technicianStats.forEach(tech => {
        csvContent += `"${tech.name}",${tech.phone},${tech.completedJobs},${tech.activeJobs},${tech.totalHoursLogged},${tech.rating}\n`;
      });
    } else if (reportType === 'installations') {
      csvContent += 'Installation #,Customer,Capacity (kW),Status,Lead Technician,Total Hours,Commissioned Date\n';
      installationsList.forEach(inst => {
        csvContent += `"${inst.installationNumber}","${inst.customer?.name || 'Customer'}",${inst.systemCapacityKw},"${inst.status}","${inst.leadTechnician?.name || 'Assigned'}",${inst.totalWorkingHours || 0},"${inst.completedAt ? new Date(inst.completedAt).toLocaleDateString() : 'In Progress'}"\n`;
      });
    } else if (reportType === 'inventory') {
      csvContent += 'SKU,Item Name,Category,Current Stock,Allocated,Available,Reorder Level,Unit\n';
      inventoryList.forEach(inv => {
        csvContent += `"${inv.sku}","${inv.name}","${inv.category}",${inv.currentStock},${inv.allocatedStock},${inv.availableStock},${inv.reorderLevel},"${inv.unit}"\n`;
      });
    } else if (reportType === 'service') {
      csvContent += 'Ticket #,Customer,Serial Number,Category,Priority,Warranty Status,Customer Payable,Status\n';
      ticketsList.forEach(t => {
        csvContent += `"${t.ticketNumber}","${t.customer?.name || 'N/A'}","${t.equipmentSerialNumber || 'N/A'}","${t.issueCategory}","${t.priority}","${t.warrantyStatusAtTicket}",${t.charges?.totalCustomerPayable || 0},"${t.status}"\n`;
      });
    }

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `SunPower_${reportType}_report_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrint = () => {
    document.body.classList.add('printing-active');
    const done = () => {
      document.body.classList.remove('printing-active');
      window.removeEventListener('afterprint', done);
    };
    window.addEventListener('afterprint', done);
    window.print();
    setTimeout(done, 1500);
  };

  const reportTitles = {
    financial: 'Monthly Financials & Profit',
    installations: 'Installation Capacity Register',
    technician: 'Technician Hours & SLAs',
    inventory: 'Warehouse Inventory',
    service: 'Service & Warranty Repairs'
  };

  return (
    <div id="printable-document" className="printable-document-container print-report-root space-y-6">
      <div className="print-only mb-4 pb-3 border-b-2 border-slate-900">
        <h1 className="text-xl font-black text-slate-900">SunPower Solutions Pvt. Ltd.</h1>
        <p className="text-sm font-semibold text-slate-700">{reportTitles[reportType]} — Printed {new Date().toLocaleDateString('en-IN')}</p>
      </div>

      {/* Header */}
      <div className="no-print p-5 rounded-3xl glass-card border border-solar-500/20 bg-gradient-to-r from-midnight-900 via-midnight-850 to-midnight-900 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-solar-400 text-xs font-semibold uppercase tracking-wider mb-1">
            <BarChart3 className="w-3.5 h-3.5" />
            <span>Business Intelligence, Audits & CSV Export</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
            Enterprise <span className="gradient-solar-text">Management Reports</span>
          </h1>
          <p className="text-slate-400 text-xs sm:text-sm mt-0.5">
            Export monthly financials, installation pipelines, technician hours, stock health, and service tickets.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <Button
            variant="primary"
            onClick={handleExportCSV}
            className="no-print text-xs flex items-center space-x-1.5"
          >
            <Download className="w-4 h-4" />
            <span>Export CSV Report</span>
          </Button>
          <Button
            variant="secondary"
            onClick={handlePrint}
            className="no-print text-xs flex items-center space-x-1.5"
          >
            <Printer className="w-4 h-4" />
            <span>Print View</span>
          </Button>
        </div>
      </div>

      {/* Report Selector Tabs */}
      <div className="no-print flex border-b border-slate-800 space-x-4 overflow-x-auto text-xs font-semibold pb-1">
        <button
          onClick={() => setReportType('financial')}
          className={`py-2 px-3 border-b-2 transition whitespace-nowrap flex items-center space-x-1.5 ${
            reportType === 'financial' ? 'border-solar-500 text-solar-400' : 'border-transparent text-slate-400 hover:text-white'
          }`}
        >
          <TrendingUp className="w-3.5 h-3.5" />
          <span>1. Monthly Financials & Profit</span>
        </button>
        <button
          onClick={() => setReportType('installations')}
          className={`py-2 px-3 border-b-2 transition whitespace-nowrap flex items-center space-x-1.5 ${
            reportType === 'installations' ? 'border-solar-500 text-solar-400' : 'border-transparent text-slate-400 hover:text-white'
          }`}
        >
          <Hammer className="w-3.5 h-3.5" />
          <span>2. Installation Capacity ({installationsList.length})</span>
        </button>
        <button
          onClick={() => setReportType('technician')}
          className={`py-2 px-3 border-b-2 transition whitespace-nowrap flex items-center space-x-1.5 ${
            reportType === 'technician' ? 'border-solar-500 text-solar-400' : 'border-transparent text-slate-400 hover:text-white'
          }`}
        >
          <Users className="w-3.5 h-3.5" />
          <span>3. Technician Hours & SLAs</span>
        </button>
        <button
          onClick={() => setReportType('inventory')}
          className={`py-2 px-3 border-b-2 transition whitespace-nowrap flex items-center space-x-1.5 ${
            reportType === 'inventory' ? 'border-solar-500 text-solar-400' : 'border-transparent text-slate-400 hover:text-white'
          }`}
        >
          <Boxes className="w-3.5 h-3.5" />
          <span>4. Warehouse Inventory ({inventoryList.length})</span>
        </button>
        <button
          onClick={() => setReportType('service')}
          className={`py-2 px-3 border-b-2 transition whitespace-nowrap flex items-center space-x-1.5 ${
            reportType === 'service' ? 'border-solar-500 text-solar-400' : 'border-transparent text-slate-400 hover:text-white'
          }`}
        >
          <LifeBuoy className="w-3.5 h-3.5" />
          <span>5. Service & Warranty Repairs</span>
        </button>
      </div>

      {/* Render Active Report Table */}
      <div className="rounded-3xl glass-card overflow-hidden border border-slate-800">
        {reportType === 'financial' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-900 text-slate-400 uppercase text-[10px] border-b border-slate-800">
                <tr>
                  <th className="py-3 px-3">Month</th>
                  <th className="py-3 px-3">Revenue (₹)</th>
                  <th className="py-3 px-3">Expenses (₹)</th>
                  <th className="py-3 px-3">Net Profit Margin (₹)</th>
                  <th className="py-3 px-3">Completed Projects</th>
                  <th className="py-3 px-3">Installed Capacity</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono">
                {data?.charts?.monthlyFinancials?.map((row, idx) => (
                  <tr key={idx} className="hover:bg-slate-800/30 transition">
                    <td className="py-2.5 px-3 font-sans font-semibold text-white">{row.month} 2026</td>
                    <td className="py-2.5 px-3 text-solar-400 font-bold">₹{row.revenue?.toLocaleString('en-IN')}</td>
                    <td className="py-2.5 px-3 text-rose-400">₹{row.expenses?.toLocaleString('en-IN')}</td>
                    <td className="py-2.5 px-3 text-emerald-400 font-bold">₹{row.profit?.toLocaleString('en-IN')}</td>
                    <td className="py-2.5 px-3 text-slate-200 font-sans">{row.installationsCount}</td>
                    <td className="py-2.5 px-3 text-slate-300">{row.capacityKw} kW</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {reportType === 'installations' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-900 text-slate-400 uppercase text-[10px] border-b border-slate-800">
                <tr>
                  <th className="py-3 px-3">Installation #</th>
                  <th className="py-3 px-3">Customer</th>
                  <th className="py-3 px-3">Capacity</th>
                  <th className="py-3 px-3">Status</th>
                  <th className="py-3 px-3">Lead Technician</th>
                  <th className="py-3 px-3">Field Hours</th>
                  <th className="py-3 px-3">Commissioned Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono">
                {installationsList.map((inst) => (
                  <tr key={inst._id} className="hover:bg-slate-800/30 transition">
                    <td className="py-2.5 px-3 font-bold text-solar-400">{inst.installationNumber}</td>
                    <td className="py-2.5 px-3 font-sans text-white">{inst.customer?.name}</td>
                    <td className="py-2.5 px-3 text-emerald-400 font-bold">{inst.systemCapacityKw} kW</td>
                    <td className="py-2.5 px-3 uppercase text-[10px]">{inst.status}</td>
                    <td className="py-2.5 px-3 font-sans text-slate-300">{inst.leadTechnician?.name || 'Assigned'}</td>
                    <td className="py-2.5 px-3 text-slate-300">{inst.totalWorkingHours || 0} hrs</td>
                    <td className="py-2.5 px-3 text-slate-400">
                      {inst.completedAt ? new Date(inst.completedAt).toLocaleDateString() : 'In Progress'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {reportType === 'technician' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-900 text-slate-400 uppercase text-[10px] border-b border-slate-800">
                <tr>
                  <th className="py-3 px-3">Technician Name</th>
                  <th className="py-3 px-3">Phone</th>
                  <th className="py-3 px-3 text-center">Completed Installations</th>
                  <th className="py-3 px-3 text-center">Active Jobs</th>
                  <th className="py-3 px-3 text-center">Hours Logged</th>
                  <th className="py-3 px-3 text-right">Customer Rating</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono">
                {data?.charts?.technicianStats?.map((tech) => (
                  <tr key={tech.id} className="hover:bg-slate-800/30 transition">
                    <td className="py-2.5 px-3 font-sans font-semibold text-white">{tech.name}</td>
                    <td className="py-2.5 px-3 text-slate-400">{tech.phone}</td>
                    <td className="py-2.5 px-3 text-emerald-400 font-bold text-center">{tech.completedJobs}</td>
                    <td className="py-2.5 px-3 text-amber-400 text-center">{tech.activeJobs}</td>
                    <td className="py-2.5 px-3 text-slate-300 text-center">{tech.totalHoursLogged} hrs</td>
                    <td className="py-2.5 px-3 text-solar-400 font-sans font-bold text-right">★ {tech.rating}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {reportType === 'inventory' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-900 text-slate-400 uppercase text-[10px] border-b border-slate-800">
                <tr>
                  <th className="py-3 px-3">SKU</th>
                  <th className="py-3 px-3">Item Description</th>
                  <th className="py-3 px-3">Category</th>
                  <th className="py-3 px-3 text-right">Total Stock</th>
                  <th className="py-3 px-3 text-right">Allocated</th>
                  <th className="py-3 px-3 text-right">Available</th>
                  <th className="py-3 px-3 text-right">Safety Level</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono">
                {inventoryList.map((inv) => (
                  <tr key={inv._id} className="hover:bg-slate-800/30 transition">
                    <td className="py-2.5 px-3 font-bold text-solar-400">{inv.sku}</td>
                    <td className="py-2.5 px-3 font-sans text-white">{inv.name}</td>
                    <td className="py-2.5 px-3 capitalize text-slate-400">{inv.category}</td>
                    <td className="py-2.5 px-3 text-right font-bold">{inv.currentStock} {inv.unit}</td>
                    <td className="py-2.5 px-3 text-right text-amber-400">{inv.allocatedStock}</td>
                    <td className="py-2.5 px-3 text-right text-emerald-400 font-bold">{inv.availableStock}</td>
                    <td className="py-2.5 px-3 text-right text-rose-400">{inv.reorderLevel}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {reportType === 'service' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-900 text-slate-400 uppercase text-[10px] border-b border-slate-800">
                <tr>
                  <th className="py-3 px-3">Ticket #</th>
                  <th className="py-3 px-3">Customer</th>
                  <th className="py-3 px-3">Serial</th>
                  <th className="py-3 px-3">Category</th>
                  <th className="py-3 px-3">Warranty Eligibility</th>
                  <th className="py-3 px-3">Customer Payable</th>
                  <th className="py-3 px-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono">
                {ticketsList.map((t) => (
                  <tr key={t._id} className="hover:bg-slate-800/30 transition">
                    <td className="py-2.5 px-3 font-bold text-solar-400">{t.ticketNumber}</td>
                    <td className="py-2.5 px-3 font-sans text-white">{t.customer?.name || 'Customer'}</td>
                    <td className="py-2.5 px-3 text-slate-400">{t.equipmentSerialNumber || 'N/A'}</td>
                    <td className="py-2.5 px-3 capitalize text-slate-300">{t.issueCategory}</td>
                    <td className="py-2.5 px-3">
                      <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                        t.warrantyStatusAtTicket === 'in_warranty'
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                          : 'bg-rose-500/10 text-rose-400 border border-rose-500/30'
                      }`}>
                        {t.warrantyStatusAtTicket}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 font-bold text-emerald-400">
                      ₹{t.charges?.totalCustomerPayable || 0}
                    </td>
                    <td className="py-2.5 px-3 uppercase text-[10px]">{t.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default ReportsView;
