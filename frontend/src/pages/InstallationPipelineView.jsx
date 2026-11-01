import React, { useState, useEffect } from 'react';
import api from '../api/client';
import {
  Hammer,
  CheckCircle2,
  Clock,
  Calendar,
  MapPin,
  Zap,
  UserCheck,
  Filter,
  Eye,
  Camera
} from 'lucide-react';
import Pagination from '../components/ui/Pagination';

const InstallationPipelineView = () => {
  const [installations, setInstallations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('');
  const [selectedInst, setSelectedInst] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const fetchInstallations = async () => {
    try {
      setLoading(true);
      const params = {};
      if (filterStatus) params.status = filterStatus;

      const res = await api.get('/installations', { params });
      if (res.success) {
        setInstallations(res.data);
      }
    } catch (err) {
      console.error('Fetch installations error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInstallations();
  }, [filterStatus]);

  const statusBadges = {
    assigned: 'bg-sky-500/10 text-sky-400 border-sky-500/30',
    in_progress: 'bg-amber-500/10 text-amber-400 border-amber-500/30 font-bold',
    testing_in_progress: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/30',
    completed: 'bg-teal-500/10 text-teal-400 border-teal-500/30',
    customer_accepted: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30 font-bold'
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="p-5 rounded-2xl glass-card border border-solar-500/20 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-solar-400 text-xs font-semibold uppercase tracking-wider mb-1">
            <Hammer className="w-3.5 h-3.5" />
            <span>Field Installation Operations</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
            Installation <span className="gradient-solar-text">Management Pipeline</span>
          </h1>
          <p className="text-slate-400 text-xs sm:text-sm mt-0.5">
            Stage-by-stage monitoring: mounting, wiring, inverter connection, electrical testing, and customer acceptance.
          </p>
        </div>

        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-slate-300"
        >
          <option value="">All Operational Statuses</option>
          <option value="assigned">Assigned</option>
          <option value="in_progress">In Progress</option>
          <option value="customer_accepted">Customer Accepted</option>
        </select>
      </div>

      {/* Installations Table */}
      <div className="rounded-2xl glass-card overflow-hidden border border-slate-800">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-900 text-slate-400 uppercase text-[10px] border-b border-slate-800">
              <tr>
                <th className="py-2.5 px-3">Installation #</th>
                <th className="py-2.5 px-3">Customer Site</th>
                <th className="py-2.5 px-3">Capacity</th>
                <th className="py-2.5 px-3">Lead Technician</th>
                <th className="py-2.5 px-3">Field Testing</th>
                <th className="py-2.5 px-3">Working Hours</th>
                <th className="py-2.5 px-3">Customer Sign-off</th>
                <th className="py-2.5 px-3">Status</th>
                <th className="py-2.5 px-3 text-right">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-sans">
              {installations.slice((currentPage - 1) * pageSize, currentPage * pageSize).map((inst) => {
                const isAccepted = inst.customerAcceptance?.isAccepted;
                return (
                  <tr key={inst._id} className="hover:bg-slate-800/30 transition">
                    <td className="py-2.5 px-3 font-mono font-bold text-solar-400">{inst.installationNumber}</td>
                    <td className="py-2.5 px-3">
                      <p className="font-semibold text-white">{inst.customer?.name}</p>
                      <p className="text-[10px] text-slate-400 truncate max-w-[150px]">
                        {inst.customer?.installationAddress?.city}
                      </p>
                    </td>
                    <td className="py-2.5 px-3 font-mono text-slate-200">{inst.systemCapacityKw} kW</td>
                    <td className="py-2.5 px-3 text-slate-300 font-medium">
                      {inst.leadTechnician?.name || 'Unassigned'}
                    </td>
                    <td className="py-2.5 px-3 font-mono text-[11px]">
                      {inst.testingResults?.vocVolts > 0 ? (
                        <span className="text-emerald-400">
                          {inst.testingResults.vocVolts}V / {inst.testingResults.earthingResistanceOhms}Ω
                        </span>
                      ) : (
                        <span className="text-slate-500 italic">Pending Test</span>
                      )}
                    </td>
                    <td className="py-2.5 px-3 font-mono text-slate-300">
                      {inst.totalWorkingHours || 0} hrs
                    </td>
                    <td className="py-2.5 px-3">
                      {isAccepted ? (
                        <span className="inline-flex items-center text-emerald-400 font-bold text-[11px]">
                          <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> Accepted
                        </span>
                      ) : (
                        <span className="text-amber-400 text-[11px]">Awaiting Handover</span>
                      )}
                    </td>
                    <td className="py-2.5 px-3">
                      <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold uppercase border ${statusBadges[inst.status] || 'bg-slate-800 text-slate-300'}`}>
                        {inst.status?.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-right">
                      <button
                        onClick={() => setSelectedInst(inst)}
                        className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px]"
                      >
                        Inspect
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {installations.length > pageSize && (
          <div className="p-3 border-t border-slate-800">
            <Pagination
              currentPage={currentPage}
              totalPages={Math.ceil(installations.length / pageSize) || 1}
              onPageChange={(p) => setCurrentPage(p)}
              totalItems={installations.length}
              pageSize={pageSize}
              onPageSizeChange={(newSize) => {
                setPageSize(newSize);
                setCurrentPage(1);
              }}
            />
          </div>
        )}
      </div>

      {/* Selected Installation Modal / Detail Drawer */}
      {selectedInst && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="glass-card w-full max-w-lg rounded-2xl border border-slate-700 p-6 space-y-4 my-8">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <h3 className="text-base font-bold text-white flex items-center space-x-2">
                <Hammer className="w-5 h-5 text-solar-400" />
                <span>Installation Audit: {selectedInst.installationNumber}</span>
              </h3>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 bg-slate-900 rounded-xl border border-slate-800 space-y-1">
                <p className="font-semibold text-white">Customer: {selectedInst.customer?.name}</p>
                <p className="text-slate-400">{selectedInst.customer?.installationAddress?.street}, {selectedInst.customer?.installationAddress?.city}</p>
                <p className="font-mono text-emerald-400">Lead Tech: {selectedInst.leadTechnician?.name}</p>
              </div>

              {/* Electrical Testing Summary */}
              <div className="p-3 bg-slate-900 rounded-xl border border-slate-800 space-y-1.5 font-mono text-[11px]">
                <span className="text-[10px] uppercase font-bold text-slate-400 font-sans">Testing Parameters</span>
                <div className="grid grid-cols-2 gap-2 text-slate-300">
                  <span>Open Circuit Voc: <strong className="text-white">{selectedInst.testingResults?.vocVolts || 0} V</strong></span>
                  <span>Short Circuit Isc: <strong className="text-white">{selectedInst.testingResults?.iscAmperes || 0} A</strong></span>
                  <span>Earthing Ohms: <strong className="text-emerald-400">{selectedInst.testingResults?.earthingResistanceOhms || 0} Ω</strong></span>
                  <span>Grid Sync: <strong className="text-white uppercase">{selectedInst.testingResults?.inverterSyncStatus || 'N/A'}</strong></span>
                </div>
              </div>

              {/* Photos Gallery */}
              {selectedInst.installationPhotos?.length > 0 && (
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Attached Site Photos</span>
                  <div className="grid grid-cols-2 gap-2">
                    {selectedInst.installationPhotos.map((photo, i) => (
                      <div key={i} className="rounded-lg overflow-hidden border border-slate-700">
                        <img src={photo.url} alt={photo.caption} className="w-full h-24 object-cover" />
                        <p className="p-1 text-[10px] text-slate-300 bg-slate-900 truncate">{photo.caption}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="flex justify-end pt-2 border-t border-slate-800">
              <button
                onClick={() => setSelectedInst(null)}
                className="px-4 py-2 bg-slate-800 text-slate-300 font-bold text-xs rounded-lg hover:bg-slate-700"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default InstallationPipelineView;
