import React, { useState, useEffect } from 'react';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';
import {
  LifeBuoy,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Wrench,
  DollarSign,
  ShieldCheck,
  ShieldAlert,
  ArrowRight,
  Filter,
  Plus,
  Eye,
  Search,
  User,
  History,
  X
} from 'lucide-react';
import Button from '../components/ui/Button';
import Pagination from '../components/ui/Pagination';

const ServiceTicketsView = () => {
  const { user } = useAuth();
  const [tickets, setTickets] = useState([]);
  const [technicians, setTechnicians] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterWarranty, setFilterWarranty] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Modals
  const [showResolveModal, setShowResolveModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState(null);

  const [createForm, setCreateForm] = useState({
    customerId: '',
    equipmentSerialNumber: '',
    issueCategory: 'inverter_fault',
    priority: 'medium',
    title: '',
    description: ''
  });
  const [warrantyStatusCheck, setWarrantyStatusCheck] = useState(null);

  const [resolveForm, setResolveForm] = useState({
    actionTaken: 'Replaced DC fuse and updated inverter firmware.',
    partsReplaced: '1x DC Surge Arrester',
    partsCost: 1500,
    labourCost: 800,
    notes: 'Restored to normal operating state.'
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      const params = {};
      if (filterWarranty) params.warrantyStatus = filterWarranty;

      const [tickRes, techRes, custRes] = await Promise.allSettled([
        api.get('/service-tickets', { params }),
        api.get('/technicians'),
        api.get('/customers')
      ]);

      if (tickRes.status === 'fulfilled' && tickRes.value.success) setTickets(tickRes.value.data);
      if (techRes.status === 'fulfilled' && techRes.value.success) setTechnicians(techRes.value.data);
      if (custRes.status === 'fulfilled' && custRes.value.success) {
        setCustomers(custRes.value.data);
        if (custRes.value.data.length > 0 && !createForm.customerId) {
          setCreateForm(prev => ({ ...prev, customerId: custRes.value.data[0]._id }));
        }
      }
    } catch (err) {
      console.error('Fetch tickets error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [filterWarranty]);

  // Live Serial Warranty Check
  const checkSerialWarranty = async (serial) => {
    if (!serial || serial.length < 4) {
      setWarrantyStatusCheck(null);
      return;
    }
    try {
      const res = await api.get(`/warranties/lookup/${serial.trim()}`);
      if (res.success) {
        setWarrantyStatusCheck(res.data);
      } else {
        setWarrantyStatusCheck(null);
      }
    } catch (err) {
      setWarrantyStatusCheck(null);
    }
  };

  const handleCreateTicket = async (e) => {
    e.preventDefault();
    if (!createForm.customerId || !createForm.title) {
      alert('Please provide customer and issue title');
      return;
    }

    try {
      const res = await api.post('/service-tickets', createForm);
      if (res.success) {
        alert(res.message);
        setShowCreateModal(false);
        setCreateForm({
          customerId: customers[0]?._id || '',
          equipmentSerialNumber: '',
          issueCategory: 'inverter_fault',
          priority: 'medium',
          title: '',
          description: ''
        });
        setWarrantyStatusCheck(null);
        fetchData();
      }
    } catch (err) {
      alert(`Ticket creation failed: ${err.message}`);
    }
  };

  const handleAssignTechnician = async (ticketId, technicianId) => {
    try {
      const res = await api.post(`/service-tickets/${ticketId}/assign`, { technicianId });
      if (res.success) {
        alert(res.message);
        fetchData();
      }
    } catch (err) {
      alert(`Assignment failed: ${err.message}`);
    }
  };

  // Rule 6 & 7: Resolve Ticket and calculate charges
  const handleResolve = async (e) => {
    e.preventDefault();
    if (!selectedTicket) return;
    try {
      const res = await api.post(`/service-tickets/${selectedTicket._id}/resolve`, resolveForm);
      if (res.success) {
        alert(res.message);
        setShowResolveModal(false);
        fetchData();
      }
    } catch (err) {
      alert(`Resolve failed: ${err.message}`);
    }
  };

  const filteredTickets = tickets.filter(t => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      t.ticketNumber?.toLowerCase().includes(q) ||
      t.customer?.name?.toLowerCase().includes(q) ||
      t.equipmentSerialNumber?.toLowerCase().includes(q) ||
      t.title?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6">
      {/* 1. Header with Rules 6 & 7 Enforcement notice */}
      <div className="p-5 rounded-3xl glass-card border border-solar-500/20 bg-gradient-to-r from-midnight-900 via-midnight-850 to-midnight-900 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-solar-400 text-xs font-semibold uppercase tracking-wider mb-1">
            <LifeBuoy className="w-3.5 h-3.5" />
            <span>Service Desk • Rules 6 & 7 Enforced</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
            Service Tickets <span className="gradient-solar-text">& Warranty Repair Billing</span>
          </h1>
          <p className="text-slate-400 text-xs sm:text-sm mt-0.5">
            Rule 6: In-warranty eligible repairs are billed at ₹0.00. Rule 7: Out-of-warranty repairs support parts and labour charges.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="primary"
            onClick={() => setShowCreateModal(true)}
            className="text-xs flex items-center space-x-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>Raise Service Ticket</span>
          </Button>

          <div className="flex items-center space-x-2 text-xs">
            <select
              value={filterWarranty}
              onChange={(e) => setFilterWarranty(e.target.value)}
              className="px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-slate-300 focus:outline-none focus:border-solar-500"
            >
              <option value="">All Warranty Statuses</option>
              <option value="in_warranty">In-Warranty (₹0 Free)</option>
              <option value="out_of_warranty">Out-of-Warranty (Paid)</option>
            </select>
          </div>
        </div>
      </div>

      {/* 2. Search Bar */}
      <div className="p-3.5 rounded-2xl glass-card border border-slate-800 flex items-center justify-between gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search tickets by ticket #, customer name, serial number, or fault title..."
            className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-900 border border-slate-700/80 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-solar-500"
          />
        </div>
        <span className="text-xs font-mono text-slate-400 px-2 hidden sm:inline">
          {filteredTickets.length} Tickets
        </span>
      </div>

      {/* 3. Tickets List Table */}
      <div className="rounded-3xl glass-card overflow-hidden border border-slate-800">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-900 text-slate-400 uppercase text-[10px] border-b border-slate-800">
              <tr>
                <th className="py-3 px-3">Ticket #</th>
                <th className="py-3 px-3">Customer</th>
                <th className="py-3 px-3">Equipment Serial</th>
                <th className="py-3 px-3">Issue Title</th>
                <th className="py-3 px-3">Warranty Eligibility</th>
                <th className="py-3 px-3">Customer Charge</th>
                <th className="py-3 px-3">Technician</th>
                <th className="py-3 px-3">Status</th>
                <th className="py-3 px-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-sans">
              {filteredTickets.length === 0 ? (
                <tr>
                  <td colSpan="9" className="text-center py-8 text-slate-500">
                    No service tickets found matching your query.
                  </td>
                </tr>
              ) : (
                filteredTickets.slice((currentPage - 1) * pageSize, currentPage * pageSize).map((t) => {
                  const isInWarranty = t.warrantyStatusAtTicket === 'in_warranty';
                  return (
                    <tr key={t._id} className="hover:bg-slate-800/30 transition">
                      <td className="py-3 px-3 font-mono font-bold text-solar-400">{t.ticketNumber}</td>
                      <td className="py-3 px-3 font-semibold text-slate-200">{t.customer?.name}</td>
                      <td className="py-3 px-3 font-mono text-slate-300">{t.equipmentSerialNumber || 'N/A'}</td>
                      <td className="py-3 px-3">
                        <p className="font-semibold text-white truncate max-w-[180px]">{t.title}</p>
                        <p className="text-[10px] text-slate-400 truncate max-w-[180px]">{t.description}</p>
                      </td>
                      <td className="py-3 px-3">
                        {isInWarranty ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                            <ShieldCheck className="w-3 h-3 mr-1" /> In-Warranty
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/10 text-rose-400 border border-rose-500/30">
                            <ShieldAlert className="w-3 h-3 mr-1" /> Out-of-Warranty
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-3 font-mono">
                        {isInWarranty ? (
                          <span className="text-emerald-400 font-bold">₹0.00 (Covered)</span>
                        ) : (
                          <span className="text-solar-400 font-bold">
                            ₹{t.charges?.totalCustomerPayable?.toLocaleString('en-IN') || 'Pending Bill'}
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-3">
                        {t.assignedTechnician ? (
                          <span className="text-slate-300 font-medium">{t.assignedTechnician.name}</span>
                        ) : (
                          <select
                            onChange={(e) => handleAssignTechnician(t._id, e.target.value)}
                            className="px-2 py-1 rounded bg-slate-900 border border-slate-700 text-[10px] text-slate-400"
                          >
                            <option value="">Assign Tech...</option>
                            {technicians.map((tech) => (
                              <option key={tech._id} value={tech._id}>{tech.name}</option>
                            ))}
                          </select>
                        )}
                      </td>
                      <td className="py-3 px-3">
                        <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold uppercase border ${
                          t.status === 'resolved'
                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                            : 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                        }`}>
                          {t.status.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-right space-x-1.5">
                        <button
                          onClick={() => {
                            setSelectedTicket(t);
                            setShowDetailModal(true);
                          }}
                          className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] font-semibold rounded-lg transition"
                          title="View Details & Repair History"
                        >
                          Details
                        </button>

                        {t.status !== 'resolved' && (
                          <button
                            onClick={() => {
                              setSelectedTicket(t);
                              setShowResolveModal(true);
                            }}
                            className="px-2.5 py-1 bg-emerald-500 hover:bg-emerald-400 text-midnight-950 text-[10px] font-bold rounded-lg shadow-glow-electric transition"
                          >
                            Resolve & Bill
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {filteredTickets.length > pageSize && (
          <div className="p-3 border-t border-slate-800">
            <Pagination
              currentPage={currentPage}
              totalPages={Math.ceil(filteredTickets.length / pageSize) || 1}
              onPageChange={(p) => setCurrentPage(p)}
              totalItems={filteredTickets.length}
              pageSize={pageSize}
              onPageSizeChange={(newSize) => {
                setPageSize(newSize);
                setCurrentPage(1);
              }}
            />
          </div>
        )}
      </div>

      {/* 4. Create Service Ticket Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="glass-card w-full max-w-xl rounded-3xl border border-slate-700 p-6 space-y-4 my-8 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center space-x-2">
                <div className="p-2 rounded-xl bg-solar-500/10 text-solar-400 border border-solar-500/30">
                  <LifeBuoy className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Raise New Service Ticket</h3>
                  <p className="text-[11px] text-slate-400">Rules 6 & 7: Automated Warranty Verification</p>
                </div>
              </div>
              <button onClick={() => setShowCreateModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateTicket} className="space-y-3.5 text-xs">
              {/* Customer Selection */}
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Customer Account</label>
                <select
                  required
                  value={createForm.customerId}
                  onChange={(e) => setCreateForm({ ...createForm, customerId: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white focus:outline-none focus:border-solar-500"
                >
                  <option value="">Select Customer Account</option>
                  {customers.map((c) => (
                    <option key={c._id} value={c._id}>
                      {c.name} ({c.customerCode || c.phone}) - {c.installationAddress?.city}
                    </option>
                  ))}
                </select>
              </div>

              {/* Equipment Serial Number & Live Warranty Check */}
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Equipment Serial Number (Optional)</label>
                <input
                  type="text"
                  value={createForm.equipmentSerialNumber}
                  onChange={(e) => {
                    const serial = e.target.value;
                    setCreateForm({ ...createForm, equipmentSerialNumber: serial });
                    checkSerialWarranty(serial);
                  }}
                  placeholder="e.g. SN-PANEL-2026-0001 or SN-INV-2026-0002"
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white font-mono focus:outline-none focus:border-solar-500"
                />

                {warrantyStatusCheck && (
                  <div className={`mt-2 p-2.5 rounded-xl border flex items-center justify-between text-xs font-mono ${
                    warrantyStatusCheck.isWarrantyEligible
                      ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                      : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
                  }`}>
                    <div className="flex items-center space-x-1.5">
                      {warrantyStatusCheck.isWarrantyEligible ? (
                        <ShieldCheck className="w-4 h-4 text-emerald-400" />
                      ) : (
                        <ShieldAlert className="w-4 h-4 text-rose-400" />
                      )}
                      <span>Warranty Status: {warrantyStatusCheck.warranty?.status?.toUpperCase()}</span>
                    </div>
                    <span className="font-bold">
                      {warrantyStatusCheck.isWarrantyEligible ? '₹0.00 Repair Eligible' : 'Out-of-Warranty (Billable)'}
                    </span>
                  </div>
                )}
              </div>

              {/* Issue Category & Priority */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Issue Category</label>
                  <select
                    value={createForm.issueCategory}
                    onChange={(e) => setCreateForm({ ...createForm, issueCategory: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white focus:outline-none focus:border-solar-500"
                  >
                    <option value="inverter_fault">Inverter Fault / Error Code</option>
                    <option value="panel_damage">Panel Damage / Micro-crack</option>
                    <option value="battery_degradation">Battery Capacity Degradation</option>
                    <option value="grid_sync_issue">Grid Sync & Net-Metering Drop</option>
                    <option value="wiring_issue">Cable / Earthing Issue</option>
                    <option value="routine_maintenance">Periodic Scheduled Maintenance</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Priority</label>
                  <select
                    value={createForm.priority}
                    onChange={(e) => setCreateForm({ ...createForm, priority: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white focus:outline-none focus:border-solar-500 font-bold"
                  >
                    <option value="low">Low Priority</option>
                    <option value="medium">Medium Priority</option>
                    <option value="high">High (Generation Impacted)</option>
                    <option value="critical">Critical (Safety / Inverter Offline)</option>
                  </select>
                </div>
              </div>

              {/* Title & Description */}
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Issue Title</label>
                <input
                  type="text"
                  required
                  value={createForm.title}
                  onChange={(e) => setCreateForm({ ...createForm, title: e.target.value })}
                  placeholder="e.g. Inverter Error code E029 on Phase 1"
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white focus:outline-none focus:border-solar-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Detailed Fault Description</label>
                <textarea
                  rows="3"
                  value={createForm.description}
                  onChange={(e) => setCreateForm({ ...createForm, description: e.target.value })}
                  placeholder="Describe observed symptoms, error displays, trip behavior..."
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white focus:outline-none focus:border-solar-500"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-3 border-t border-slate-800">
                <Button variant="secondary" size="sm" type="button" onClick={() => setShowCreateModal(false)}>
                  Cancel
                </Button>
                <Button variant="primary" size="sm" type="submit">
                  Submit Service Request
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 5. Ticket Details Modal */}
      {showDetailModal && selectedTicket && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="glass-card w-full max-w-xl rounded-3xl border border-slate-700 p-6 space-y-4 my-8 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <span className="font-mono text-solar-400 font-bold text-xs">{selectedTicket.ticketNumber}</span>
                <h3 className="text-base font-bold text-white">{selectedTicket.title}</h3>
              </div>
              <button onClick={() => setShowDetailModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3 p-3 rounded-2xl bg-slate-900 border border-slate-800 font-mono">
                <div>
                  <span className="text-slate-500 block">Customer:</span>
                  <span className="text-white font-bold">{selectedTicket.customer?.name}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Equipment Serial:</span>
                  <span className="text-solar-400">{selectedTicket.equipmentSerialNumber || 'N/A'}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Category:</span>
                  <span className="capitalize text-slate-300">{selectedTicket.issueCategory}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Assigned Tech:</span>
                  <span className="text-slate-300">{selectedTicket.assignedTechnician?.name || 'Unassigned'}</span>
                </div>
              </div>

              <div>
                <span className="text-slate-400 font-semibold block mb-1">Issue Description:</span>
                <p className="p-3 rounded-xl bg-slate-900 border border-slate-800 text-slate-300">
                  {selectedTicket.description || 'No description provided.'}
                </p>
              </div>

              {/* Repair Resolution & Billing */}
              <div className="p-3.5 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
                <span className="font-bold text-white uppercase text-[11px] text-solar-400 block">
                  Repair & Billing Audit
                </span>
                <div className="grid grid-cols-2 gap-2 font-mono text-slate-300">
                  <p>Warranty Status: <strong className={selectedTicket.warrantyStatusAtTicket === 'in_warranty' ? 'text-emerald-400' : 'text-rose-400'}>{selectedTicket.warrantyStatusAtTicket}</strong></p>
                  <p>Parts Replaced: <strong>{selectedTicket.repairDetails?.partsReplaced || 'N/A'}</strong></p>
                  <p>Parts Cost: <strong>₹{selectedTicket.charges?.partsCost || 0}</strong></p>
                  <p>Labour Cost: <strong>₹{selectedTicket.charges?.labourCost || 0}</strong></p>
                  <p className="col-span-2 pt-1 border-t border-slate-800 text-sm">
                    Total Customer Payable: <strong className="text-emerald-400">₹{selectedTicket.charges?.totalCustomerPayable || 0}</strong>
                  </p>
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-2 border-t border-slate-800">
              <Button variant="secondary" size="sm" onClick={() => setShowDetailModal(false)}>
                Close
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* 6. Resolve & Calculate Charges Modal (Rules 6 & 7) */}
      {showResolveModal && selectedTicket && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="glass-card w-full max-w-md rounded-3xl border border-slate-700 p-6 space-y-4 my-8 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <h3 className="text-base font-bold text-white flex items-center space-x-2">
                <Wrench className="w-5 h-5 text-emerald-400" />
                <span>Resolve Service Ticket & Calculate Bill</span>
              </h3>
              <button onClick={() => setShowResolveModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Rule 6 / 7 Alert Banner */}
            <div className={`p-3 rounded-xl border text-xs font-semibold ${
              selectedTicket.warrantyStatusAtTicket === 'in_warranty'
                ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-300'
                : 'bg-amber-500/10 border-amber-500/40 text-amber-300'
            }`}>
              {selectedTicket.warrantyStatusAtTicket === 'in_warranty'
                ? 'RULE 6 ENFORCED: In-warranty covered equipment. Final customer payable is strictly ₹0.00.'
                : 'RULE 7 ENFORCED: Out-of-warranty equipment. Itemized parts & technician labour will be billed to customer.'}
            </div>

            <form onSubmit={handleResolve} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-400 mb-1">Action Taken / Resolution Summary</label>
                <textarea
                  rows="2"
                  value={resolveForm.actionTaken}
                  onChange={(e) => setResolveForm({ ...resolveForm, actionTaken: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Parts Replaced (if any)</label>
                <input
                  type="text"
                  value={resolveForm.partsReplaced}
                  onChange={(e) => setResolveForm({ ...resolveForm, partsReplaced: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white font-mono"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1">Equipment Parts Cost (₹)</label>
                  <input
                    type="number"
                    value={resolveForm.partsCost}
                    onChange={(e) => setResolveForm({ ...resolveForm, partsCost: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Technician Labour Fee (₹)</label>
                  <input
                    type="number"
                    value={resolveForm.labourCost}
                    onChange={(e) => setResolveForm({ ...resolveForm, labourCost: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white font-mono"
                  />
                </div>
              </div>

              {/* Total Calculation Preview */}
              <div className="p-3 bg-slate-900 rounded-xl border border-slate-800 text-xs font-mono flex justify-between items-center">
                <span className="text-slate-400">Net Customer Payable:</span>
                <span className="font-bold text-sm text-emerald-400">
                  {selectedTicket.warrantyStatusAtTicket === 'in_warranty'
                    ? '₹0.00 (100% Free SLA)'
                    : `₹${(Number(resolveForm.partsCost) + Number(resolveForm.labourCost)).toLocaleString('en-IN')}`}
                </span>
              </div>

              <div className="flex justify-end space-x-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowResolveModal(false)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl hover:bg-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-midnight-950 font-bold rounded-xl shadow-glow-electric"
                >
                  Resolve & Record Repair History
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ServiceTicketsView;
