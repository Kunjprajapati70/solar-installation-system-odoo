import React, { useState, useEffect } from 'react';
import api from '../api/client';
import {
  FileCheck2,
  CheckCircle2,
  Clock,
  ExternalLink,
  ShieldCheck,
  FileText,
  DollarSign,
  Building2,
  Filter
} from 'lucide-react';
import Pagination from '../components/ui/Pagination';

const SubsidiesView = () => {
  const [subsidies, setSubsidies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const fetchSubsidies = async () => {
    try {
      setLoading(true);
      const params = {};
      if (filterStatus) params.status = filterStatus;

      const res = await api.get('/subsidies', { params });
      if (res.success) {
        setSubsidies(res.data);
      }
    } catch (err) {
      console.error('Fetch subsidies error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubsidies();
  }, [filterStatus]);

  const handleUpdateStatus = async (subsidyId, newStatus) => {
    try {
      const res = await api.put(`/subsidies/${subsidyId}/status`, { status: newStatus });
      if (res.success) {
        alert(`Status updated to ${newStatus}`);
        fetchSubsidies();
      }
    } catch (err) {
      alert(err.message);
    }
  };

  const statusBadges = {
    application_submitted: 'bg-sky-500/10 text-sky-400 border-sky-500/30',
    feasibility_approved: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/30',
    meter_installation_passed: 'bg-purple-500/10 text-purple-400 border-purple-500/30',
    inspection_completed: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
    subsidy_approved: 'bg-teal-500/10 text-teal-400 border-teal-500/30',
    disbursed: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30 font-bold'
  };

  const totalEligible = subsidies.reduce((sum, s) => sum + (s.subsidyEligibleAmount || 0), 0);
  const totalDisbursed = subsidies.reduce((sum, s) => sum + (s.subsidyDisbursedAmount || 0), 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="p-5 rounded-2xl glass-card border border-solar-500/20 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-solar-400 text-xs font-semibold uppercase tracking-wider mb-1">
            <FileCheck2 className="w-3.5 h-3.5" />
            <span>National Solar Rooftop Mission</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
            PM Surya Ghar <span className="gradient-solar-text">Subsidy Documentation</span>
          </h1>
          <p className="text-slate-400 text-xs sm:text-sm mt-0.5">
            Liaison document repository, net-meter inspection reports, and direct bank disbursement tracking.
          </p>
        </div>

        <div className="flex items-center space-x-3 text-xs">
          <div className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-700 text-right">
            <span className="text-[10px] text-slate-400 uppercase block">Eligible Subsidies</span>
            <span className="text-sm font-bold font-mono text-emerald-400">₹{(totalEligible / 100000).toFixed(2)} Lakhs</span>
          </div>
        </div>
      </div>

      {/* Subsidies Table */}
      <div className="rounded-2xl glass-card overflow-hidden border border-slate-800">
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <h2 className="text-sm font-bold text-white flex items-center space-x-2">
            <FileCheck2 className="w-4 h-4 text-solar-400" />
            <span>Registered Subsidy Claims ({subsidies.length})</span>
          </h2>

          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-xs text-slate-300"
          >
            <option value="">All Statuses</option>
            <option value="application_submitted">Application Submitted</option>
            <option value="inspection_completed">Inspection Completed</option>
            <option value="disbursed">Disbursed into Customer Account</option>
          </select>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-900 text-slate-400 uppercase text-[10px] border-b border-slate-800">
              <tr>
                <th className="py-2.5 px-3">Application #</th>
                <th className="py-2.5 px-3">Customer</th>
                <th className="py-2.5 px-3">State DISCOM</th>
                <th className="py-2.5 px-3">Capacity</th>
                <th className="py-2.5 px-3">Eligible Subsidy</th>
                <th className="py-2.5 px-3">Verification Docs</th>
                <th className="py-2.5 px-3">Disbursement Status</th>
                <th className="py-2.5 px-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-sans">
              {subsidies.slice((currentPage - 1) * pageSize, currentPage * pageSize).map((sub) => (
                <tr key={sub._id} className="hover:bg-slate-800/30 transition">
                  <td className="py-2.5 px-3 font-mono font-bold text-solar-400">{sub.applicationNumber}</td>
                  <td className="py-2.5 px-3">
                    <p className="font-semibold text-white">{sub.customer?.name}</p>
                    <p className="text-[10px] text-slate-400 font-mono">Cons: {sub.consumerNumber}</p>
                  </td>
                  <td className="py-2.5 px-3 text-slate-300 truncate max-w-[140px]">{sub.stateDiscom}</td>
                  <td className="py-2.5 px-3 font-mono text-slate-200">{sub.capacityKw} kW</td>
                  <td className="py-2.5 px-3 font-mono font-bold text-emerald-400">
                    ₹{sub.subsidyEligibleAmount?.toLocaleString('en-IN')}
                  </td>
                  <td className="py-2.5 px-3">
                    <span className="inline-flex items-center text-[10px] text-sky-400">
                      <CheckCircle2 className="w-3.5 h-3.5 mr-1 text-emerald-400" />
                      {sub.documents?.length || 2} Docs Uploaded
                    </span>
                  </td>
                  <td className="py-2.5 px-3">
                    <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold uppercase border ${statusBadges[sub.status] || 'bg-slate-800 text-slate-300'}`}>
                      {sub.status?.replace(/_/g, ' ')}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-right">
                    {sub.status !== 'disbursed' ? (
                      <button
                        onClick={() => handleUpdateStatus(sub._id, 'disbursed')}
                        className="px-2.5 py-1 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 text-[10px] font-bold rounded border border-emerald-500/40"
                      >
                        Mark Disbursed
                      </button>
                    ) : (
                      <span className="text-emerald-400 text-[10px] font-bold">✓ Direct Credit Paid</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {subsidies.length > pageSize && (
          <div className="p-3 border-t border-slate-800">
            <Pagination
              currentPage={currentPage}
              totalPages={Math.ceil(subsidies.length / pageSize) || 1}
              onPageChange={(p) => setCurrentPage(p)}
              totalItems={subsidies.length}
              pageSize={pageSize}
              onPageSizeChange={(newSize) => {
                setPageSize(newSize);
                setCurrentPage(1);
              }}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default SubsidiesView;
