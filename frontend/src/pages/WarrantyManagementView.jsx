import React, { useState, useEffect } from 'react';
import api from '../api/client';
import { useToast } from '../context/ToastContext';
import {
  ShieldCheck,
  Search,
  CheckCircle2,
  AlertTriangle,
  Clock,
  FileCheck2,
  Printer,
  History,
  X,
  Calendar,
  Layers,
  Award,
  Filter
} from 'lucide-react';
import Button from '../components/ui/Button';
import Pagination from '../components/ui/Pagination';
import PrintDocumentModal from '../components/common/PrintDocumentModal';
import EquipmentSerialSelect from '../components/common/EquipmentSerialSelect';

const WarrantyManagementView = () => {
  const { showToast } = useToast();
  const [warranties, setWarranties] = useState([]);
  const [summary, setSummary] = useState({ total: 0, active: 0, expired: 0, expiringSoon: 0 });
  const [loading, setLoading] = useState(true);

  // Filters & Pagination
  const [filterCategory, setFilterCategory] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [searchSerial, setSearchSerial] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [paginationInfo, setPaginationInfo] = useState({ total: 0, pages: 1 });

  // Lookup & Details
  const [lookupResult, setLookupResult] = useState(null);
  const [selectedWarranty, setSelectedWarranty] = useState(null);
  const [showCertModal, setShowCertModal] = useState(false);

  const fetchWarranties = async () => {
    try {
      setLoading(true);
      const params = {
        page: currentPage,
        limit: pageSize
      };
      if (filterCategory) params.category = filterCategory;
      if (filterStatus) params.status = filterStatus;
      if (searchSerial) params.search = searchSerial;

      const [listRes, summaryRes] = await Promise.allSettled([
        api.get('/warranties', { params }),
        api.get('/warranties/summary')
      ]);

      if (listRes.status === 'fulfilled' && listRes.value.success) {
        setWarranties(listRes.value.data);
        if (listRes.value.pagination) {
          setPaginationInfo({
            total: listRes.value.pagination.total || listRes.value.data.length,
            pages: listRes.value.pagination.pages || Math.ceil((listRes.value.pagination.total || listRes.value.data.length) / pageSize)
          });
        } else {
          setPaginationInfo({ total: listRes.value.data.length, pages: 1 });
        }
      }

      if (summaryRes.status === 'fulfilled' && summaryRes.value.success) {
        setSummary(summaryRes.value.data);
      }
    } catch (err) {
      showToast(err.message || 'Fetch warranties error', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWarranties();
  }, [currentPage, pageSize, filterCategory, filterStatus]);

  const handleLookup = async (e) => {
    e.preventDefault();
    if (!searchSerial.trim()) {
      setLookupResult(null);
      fetchWarranties();
      return;
    }

    try {
      const res = await api.get(`/warranties/lookup/${searchSerial.trim()}`);
      if (res.success) {
        setLookupResult(res.data);
        setSelectedWarranty(res.data.warranty || res.data);
        showToast('Serial verified successfully against active warranty registry!', 'success');
      }
    } catch (err) {
      showToast(err.message || 'Serial lookup failed', 'error');
      setLookupResult(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="p-5 rounded-2xl glass-card border border-solar-500/20 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-solar-400 text-xs font-semibold uppercase tracking-wider mb-1">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Automatic Warranty Lifecycle & Eligibility Engine</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
            Warranty <span className="gradient-solar-text">Management Center</span>
          </h1>
          <p className="text-slate-400 text-xs sm:text-sm mt-0.5">
            Auto-activated on confirmed delivery. Category SLA rules, serial verification, and ₹0 repair validation.
          </p>
        </div>

        {/* Category Standard SLA Badges */}
        <div className="flex flex-wrap items-center gap-2 text-[11px] font-mono">
          <span className="px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-700 text-emerald-400">
            Panels: 25 Yrs
          </span>
          <span className="px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-700 text-sky-400">
            Inverter: 5-10 Yrs
          </span>
          <span className="px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-700 text-purple-400">
            Battery: 5 Yrs
          </span>
          <span className="px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-700 text-amber-400">
            Structure: 10 Yrs
          </span>
        </div>
      </div>

      {/* Summary KPI Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <div className="p-4 rounded-xl glass-card border-l-4 border-solar-500">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Total Warranties</span>
          <p className="text-2xl font-bold text-white font-mono mt-1">{summary.total || paginationInfo.total}</p>
          <span className="text-[10px] text-slate-500">Issued Certificates</span>
        </div>

        <div className="p-4 rounded-xl glass-card border-l-4 border-emerald-500">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Active & Valid</span>
          <p className="text-2xl font-bold text-emerald-400 font-mono mt-1">{summary.active || 0}</p>
          <span className="text-[10px] text-emerald-400/80">Eligible for ₹0 Service</span>
        </div>

        <div className="p-4 rounded-xl glass-card border-l-4 border-amber-500">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Expiring Soon</span>
          <p className="text-2xl font-bold text-amber-400 font-mono mt-1">{summary.expiringSoon || 0}</p>
          <span className="text-[10px] text-slate-500">Within next 60 days</span>
        </div>

        <div className="p-4 rounded-xl glass-card border-l-4 border-rose-500">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Expired (Paid Service)</span>
          <p className="text-2xl font-bold text-rose-400 font-mono mt-1">{summary.expired || 0}</p>
          <span className="text-[10px] text-slate-500">Standard Parts & Labour</span>
        </div>
      </div>

      {/* Serial Number Lookup Box */}
      <div className="p-4 rounded-xl glass-card space-y-3">
        <form onSubmit={handleLookup} className="flex flex-col sm:flex-row items-stretch sm:items-end gap-2">
          <div className="flex-1">
            <EquipmentSerialSelect
              operation="warranty"
              value={searchSerial}
              onChange={setSearchSerial}
              label="Warranty serial lookup"
              placeholder="Search installed serial, brand, or model..."
            />
          </div>
          <Button
            type="submit"
            variant="primary"
            size="md"
          >
            Check Eligibility
          </Button>
        </form>

        {/* Instant Lookup Assessment Result Banner */}
        {lookupResult && (
          <div className={`p-4 rounded-xl border text-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 ${
            lookupResult.isEligibleForFreeRepair
              ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-300'
              : 'bg-rose-500/10 border-rose-500/40 text-rose-300'
          }`}>
            <div className="space-y-1">
              <div className="flex items-center space-x-2 font-bold text-sm">
                {lookupResult.isEligibleForFreeRepair ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                ) : (
                  <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0" />
                )}
                <span>
                  {lookupResult.isEligibleForFreeRepair
                    ? 'IN-WARRANTY: 100% Free Service & Parts Covered (₹0 Bill)'
                    : 'OUT-OF-WARRANTY: Expired SLA - Standard Repair Charges Apply'}
                </span>
              </div>
              <p className="text-slate-300 text-[11px]">
                Serial: <span className="font-mono font-bold text-white">{searchSerial.toUpperCase()}</span> • Remaining Warranty: <strong className="text-white font-mono">{lookupResult.remainingDays || 0} days</strong>
              </p>
            </div>

            {selectedWarranty && (
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setShowCertModal(true)}
              >
                View Certificate
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Warranties Table Card */}
      <div className="rounded-2xl glass-card overflow-hidden border border-slate-800 flex flex-col justify-between">
        <div className="p-4 border-b border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <h2 className="text-sm font-bold text-white flex items-center space-x-2">
            <ShieldCheck className="w-4 h-4 text-solar-400" />
            <span>Active Equipment Warranties ({paginationInfo.total})</span>
          </h2>

          <div className="flex items-center space-x-2">
            <select
              value={filterCategory}
              onChange={(e) => {
                setFilterCategory(e.target.value);
                setCurrentPage(1);
              }}
              className="px-2.5 py-1 rounded bg-slate-900 border border-slate-700 text-white text-xs"
            >
              <option value="">All Categories</option>
              <option value="panel">Panels</option>
              <option value="inverter">Inverters</option>
              <option value="battery">Batteries</option>
              <option value="structure">Structure</option>
            </select>

            <select
              value={filterStatus}
              onChange={(e) => {
                setFilterStatus(e.target.value);
                setCurrentPage(1);
              }}
              className="px-2.5 py-1 rounded bg-slate-900 border border-slate-700 text-white text-xs"
            >
              <option value="">All Statuses</option>
              <option value="active">Active</option>
              <option value="expired">Expired</option>
              <option value="upcoming_expiry">Expiring Soon</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-900/90 text-slate-400 uppercase tracking-wider text-[10px] border-b border-slate-800">
              <tr>
                <th className="py-2.5 px-3">Certificate #</th>
                <th className="py-2.5 px-3">Serial Number</th>
                <th className="py-2.5 px-3">Category</th>
                <th className="py-2.5 px-3">Customer</th>
                <th className="py-2.5 px-3">Delivery Date</th>
                <th className="py-2.5 px-3">Expiry Date</th>
                <th className="py-2.5 px-3">Status</th>
                <th className="py-2.5 px-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-sans">
              {warranties.length === 0 ? (
                <tr>
                  <td colSpan="8" className="text-center py-12 text-slate-500">
                    No warranty certificates found matching your criteria.
                  </td>
                </tr>
              ) : (
                warranties.map((w) => (
                  <tr key={w._id} className="hover:bg-slate-800/30 transition">
                    <td className="py-2.5 px-3 font-mono font-semibold text-solar-400">{w.certificateNumber}</td>
                    <td className="py-2.5 px-3 font-mono font-bold text-white">{w.serialNumber}</td>
                    <td className="py-2.5 px-3 capitalize text-slate-300">{w.category} ({w.durationYears}y)</td>
                    <td className="py-2.5 px-3 text-slate-200">{w.customer?.name || 'Customer'}</td>
                    <td className="py-2.5 px-3 text-slate-400 font-mono">
                      {w.startDate ? new Date(w.startDate).toLocaleDateString() : 'N/A'}
                    </td>
                    <td className="py-2.5 px-3 text-slate-400 font-mono">
                      {w.expiryDate ? new Date(w.expiryDate).toLocaleDateString() : 'N/A'}
                    </td>
                    <td className="py-2.5 px-3">
                      <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold border uppercase ${
                        w.isExpired || w.status === 'expired'
                          ? 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                          : w.isUpcomingExpiry
                          ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                          : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                      }`}>
                        {w.currentStatusLabel || w.status}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-right">
                      <button
                        onClick={() => {
                          setSelectedWarranty(w);
                          setShowCertModal(true);
                        }}
                        className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
                      >
                        View Certificate
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Server-side Pagination */}
        <Pagination
          currentPage={currentPage}
          totalPages={paginationInfo.pages}
          totalItems={paginationInfo.total}
          pageSize={pageSize}
          onPageChange={(p) => setCurrentPage(p)}
          onPageSizeChange={(sz) => {
            setPageSize(sz);
            setCurrentPage(1);
          }}
        />
      </div>

      {/* Official Isolated Printable Warranty Certificate Modal */}
      {showCertModal && selectedWarranty && (
        <PrintDocumentModal
          isOpen={showCertModal}
          documentData={selectedWarranty}
          documentType="warranty"
          onClose={() => setShowCertModal(false)}
        />
      )}
    </div>
  );
};

export default WarrantyManagementView;
