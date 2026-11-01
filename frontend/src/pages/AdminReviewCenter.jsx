import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  RotateCcw,
  Clock,
  User,
  Users,
  FileCheck2,
  ClipboardCheck,
  FileSpreadsheet,
  Truck,
  Wrench,
  LifeBuoy,
  Shield,
  Eye,
  Filter,
  Search,
  MessageSquare,
  Sparkles
} from 'lucide-react';
import api from '../api/client';
import Button from '../components/ui/Button';
import { useToast } from '../context/ToastContext';
import { useAuth } from '../context/AuthContext';

const AdminReviewCenter = () => {
  const { user } = useAuth();
  const { showToast } = useToast();

  const [activeTab, setActiveTab] = useState('user_creation');
  const [requests, setRequests] = useState([]);
  const [summary, setSummary] = useState({});
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('pending');

  // Modal State for Reject / Request Corrections
  const [actionModal, setActionModal] = useState({
    isOpen: false,
    action: 'reject', // 'reject' | 'corrections'
    targetRequest: null,
    reason: '',
    loading: false
  });

  const fetchSummary = async () => {
    try {
      const res = await api.get('/approvals/summary');
      setSummary(res.data || res || {});
    } catch (err) {
      console.error('Failed to load review summary:', err);
    }
  };

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const res = await api.get('/approvals', {
        params: {
          type: activeTab,
          status: statusFilter === 'all' ? undefined : statusFilter
        }
      });
      setRequests(res.data || res || []);
    } catch (err) {
      showToast('error', 'Failed to retrieve approval requests.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSummary();
  }, []);

  useEffect(() => {
    fetchRequests();
  }, [activeTab, statusFilter]);

  const tabs = [
    { id: 'user_creation', label: 'User Requests', icon: User, count: summary.userRequests || 0 },
    { id: 'customer_creation', label: 'Customer Requests', icon: Users, count: summary.customerRequests || 0 },
    { id: 'survey_approval', label: 'Site Surveys', icon: ClipboardCheck, count: summary.surveys || 0 },
    { id: 'quotation_approval', label: 'Quotations', icon: FileSpreadsheet, count: summary.quotations || 0 },
    { id: 'order_dispatch', label: 'Equipment Dispatches', icon: Truck, count: summary.dispatches || 0 },
    { id: 'installation_completion', label: 'Installation QA', icon: Wrench, count: summary.installations || 0 },
    { id: 'service_ticket', label: 'Service Tickets', icon: LifeBuoy, count: summary.serviceTickets || 0 },
    { id: 'warranty_claim', label: 'Warranty Claims', icon: Shield, count: 0 },
    { id: 'subsidy_document', label: 'Subsidy Docs', icon: FileCheck2, count: summary.subsidies || 0 }
  ];

  const handleApprove = async (request) => {
    // Check separation of duties
    if (request.requestedBy?._id === user?._id && user?.role !== 'admin') {
      showToast('error', 'Separation of Duties: You cannot approve your own request.');
      return;
    }

    if (!window.confirm(`Are you sure you want to approve request #${request.requestNumber}?`)) {
      return;
    }

    try {
      await api.put(`/approvals/${request._id}/approve`, {
        reviewNotes: 'Approved via Admin Review Center'
      });
      showToast('success', `Request #${request.requestNumber} approved successfully.`);
      fetchRequests();
      fetchSummary();
    } catch (err) {
      showToast('error', err.response?.data?.message || 'Failed to approve request.');
    }
  };

  const handleOpenActionModal = (request, actionType) => {
    setActionModal({
      isOpen: true,
      action: actionType,
      targetRequest: request,
      reason: '',
      loading: false
    });
  };

  const handleConfirmAction = async (e) => {
    e.preventDefault();
    const { action, targetRequest, reason } = actionModal;
    if (!reason.trim()) {
      showToast('error', action === 'reject' ? 'Rejection reason is required.' : 'Correction notes are required.');
      return;
    }

    try {
      setActionModal((prev) => ({ ...prev, loading: true }));
      if (action === 'reject') {
        await api.put(`/approvals/${targetRequest._id}/reject`, {
          rejectionReason: reason.trim()
        });
        showToast('success', `Request #${targetRequest.requestNumber} rejected.`);
      } else {
        await api.put(`/approvals/${targetRequest._id}/request-corrections`, {
          correctionNotes: reason.trim()
        });
        showToast('success', `Corrections requested on #${targetRequest.requestNumber}.`);
      }
      setActionModal({ isOpen: false, action: 'reject', targetRequest: null, reason: '', loading: false });
      fetchRequests();
      fetchSummary();
    } catch (err) {
      showToast('error', err.response?.data?.message || 'Operation failed.');
      setActionModal((prev) => ({ ...prev, loading: false }));
    }
  };

  const filteredRequests = requests.filter((r) => {
    if (!search) return true;
    const term = search.toLowerCase();
    return (
      r.title?.toLowerCase().includes(term) ||
      r.requestNumber?.toLowerCase().includes(term) ||
      r.requestedByName?.toLowerCase().includes(term) ||
      r.rejectionReason?.toLowerCase().includes(term)
    );
  });

  return (
    <div className="space-y-6">
      {/* Hero Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl relative overflow-hidden">
        <div className="space-y-1 relative z-10">
          <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-solar-500/10 border border-solar-500/20 text-solar-400 text-xs font-semibold">
            <ShieldCheck className="w-4 h-4" />
            <span>Central Operational Governance</span>
          </div>
          <h1 className="text-2xl font-black text-white tracking-tight">
            Admin Review & Approval Center
          </h1>
          <p className="text-xs sm:text-sm text-slate-400">
            Audit, review, approve, reject, or request corrections on enterprise workflows with complete MongoDB accountability.
          </p>
        </div>

        <div className="flex items-center space-x-2 shrink-0">
          <div className="px-4 py-2 rounded-xl bg-slate-800/80 border border-slate-700 text-center">
            <span className="text-[10px] uppercase font-bold text-slate-400 block">Pending Reviews</span>
            <span className="text-lg font-black text-amber-400 font-mono">
              {summary.totalPending || 0}
            </span>
          </div>
        </div>
      </div>

      {/* Module Tabs Bar */}
      <div className="flex items-center space-x-2 overflow-x-auto pb-2 scrollbar-none">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-3.5 py-2.5 rounded-xl border font-semibold text-xs whitespace-nowrap flex items-center space-x-2 transition-all ${
                isActive
                  ? 'bg-solar-500/15 border-solar-500 text-solar-400 shadow-sm'
                  : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:text-white hover:border-slate-700'
              }`}
            >
              <Icon className="w-4 h-4 shrink-0" />
              <span>{tab.label}</span>
              {tab.count > 0 && (
                <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-amber-500 text-slate-950 font-bold">
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Filter & Search Controls */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-4 rounded-2xl bg-slate-900 border border-slate-800">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by request #, submitter, title..."
            className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-solar-400"
          />
        </div>

        <div className="flex items-center space-x-2 w-full sm:w-auto">
          <span className="text-xs text-slate-400">Status:</span>
          {['pending', 'approved', 'rejected', 'corrections_requested', 'all'].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold capitalize border ${
                statusFilter === st
                  ? 'bg-slate-800 border-slate-600 text-white'
                  : 'bg-transparent border-slate-800 text-slate-500 hover:text-slate-300'
              }`}
            >
              {st.replace(/_/g, ' ')}
            </button>
          ))}
        </div>
      </div>

      {/* Requests Feed */}
      {loading ? (
        <div className="p-12 text-center text-slate-400 text-xs">Loading operational review records...</div>
      ) : filteredRequests.length === 0 ? (
        <div className="p-12 text-center rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
          <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto" />
          <h3 className="font-bold text-white text-base">All Caught Up!</h3>
          <p className="text-xs text-slate-400">
            No {statusFilter !== 'all' ? statusFilter : ''} requests found for this category.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredRequests.map((reqItem) => {
            const isPending = reqItem.status === 'pending';
            const isApproved = reqItem.status === 'approved';
            const isRejected = reqItem.status === 'rejected';
            const isCorrections = reqItem.status === 'corrections_requested';

            return (
              <div
                key={reqItem._id}
                className="p-5 sm:p-6 rounded-2xl bg-slate-900 border border-slate-800 hover:border-slate-700 transition-all space-y-4"
              >
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2 flex-wrap gap-y-1">
                      <span className="font-mono text-xs font-bold text-solar-400 bg-solar-500/10 px-2 py-0.5 rounded border border-solar-500/20">
                        #{reqItem.requestNumber}
                      </span>
                      <span
                        className={`text-[11px] px-2 py-0.5 rounded-full font-bold uppercase ${
                          isApproved
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                            : isRejected
                            ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                            : isCorrections
                            ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                            : 'bg-sky-500/20 text-sky-300 border border-sky-500/30'
                        }`}
                      >
                        {reqItem.status.replace(/_/g, ' ')}
                      </span>
                      <span className="text-xs text-slate-400 font-mono">
                        {new Date(reqItem.requestDate).toLocaleString('en-IN', {
                          day: '2-digit',
                          month: 'short',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </span>
                    </div>

                    <h3 className="text-base font-bold text-white pt-1">{reqItem.title}</h3>
                    <p className="text-xs text-slate-400">{reqItem.description}</p>
                  </div>

                  {/* Submitter Info */}
                  <div className="text-left sm:text-right text-xs shrink-0 bg-slate-950 p-2.5 rounded-xl border border-slate-800">
                    <span className="text-[10px] uppercase text-slate-500 block font-bold">Submitted By</span>
                    <span className="font-semibold text-slate-200">
                      {reqItem.requestedByName || reqItem.requestedBy?.name || 'Staff Employee'}
                    </span>
                    <span className="text-[11px] text-slate-400 block capitalize">
                      {reqItem.requestedByRole || reqItem.requestedBy?.role}
                    </span>
                  </div>
                </div>

                {/* Submitted Payload Details (JSON Snapshot Display) */}
                {reqItem.payload && (
                  <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 text-xs grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {reqItem.payload.name && (
                      <div>
                        <span className="text-[10px] text-slate-500 uppercase block font-bold">Name</span>
                        <span className="text-white font-medium">{reqItem.payload.name}</span>
                      </div>
                    )}
                    {reqItem.payload.email && (
                      <div>
                        <span className="text-[10px] text-slate-500 uppercase block font-bold">Email</span>
                        <span className="text-white font-medium font-mono">{reqItem.payload.email}</span>
                      </div>
                    )}
                    {reqItem.payload.role && (
                      <div>
                        <span className="text-[10px] text-slate-500 uppercase block font-bold">Requested Role</span>
                        <span className="text-solar-400 font-bold uppercase">{reqItem.payload.role}</span>
                      </div>
                    )}
                    {reqItem.payload.phone && (
                      <div>
                        <span className="text-[10px] text-slate-500 uppercase block font-bold">Phone</span>
                        <span className="text-white font-mono">{reqItem.payload.phone}</span>
                      </div>
                    )}
                    {reqItem.payload.department && (
                      <div>
                        <span className="text-[10px] text-slate-500 uppercase block font-bold">Department</span>
                        <span className="text-white">{reqItem.payload.department}</span>
                      </div>
                    )}
                  </div>
                )}

                {/* Rejection Reason or Correction Notes Display */}
                {reqItem.rejectionReason && (
                  <div className="p-3 rounded-xl bg-rose-950/30 border border-rose-800/40 text-xs text-rose-300 space-y-1">
                    <span className="font-bold flex items-center space-x-1.5 text-rose-400">
                      <XCircle className="w-3.5 h-3.5" />
                      <span>Rejection Reason Recorded:</span>
                    </span>
                    <p>{reqItem.rejectionReason}</p>
                  </div>
                )}

                {reqItem.correctionNotes && (
                  <div className="p-3 rounded-xl bg-amber-950/30 border border-amber-800/40 text-xs text-amber-300 space-y-1">
                    <span className="font-bold flex items-center space-x-1.5 text-amber-400">
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>Requested Corrections:</span>
                    </span>
                    <p>{reqItem.correctionNotes}</p>
                  </div>
                )}

                {/* Action Buttons for Admin */}
                <div className="pt-2 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-3">
                  <div className="text-[11px] text-slate-500 font-mono">
                    Audit Trail: {reqItem.auditTrail?.length || 1} transitions logged
                  </div>

                  {isPending && user?.role === 'admin' && (
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="secondary"
                        size="sm"
                        leftIcon={<RotateCcw className="w-3.5 h-3.5" />}
                        onClick={() => handleOpenActionModal(reqItem, 'corrections')}
                      >
                        Request Corrections
                      </Button>
                      <Button
                        variant="danger"
                        size="sm"
                        leftIcon={<XCircle className="w-3.5 h-3.5" />}
                        onClick={() => handleOpenActionModal(reqItem, 'reject')}
                      >
                        Reject Request
                      </Button>
                      <Button
                        variant="success"
                        size="sm"
                        leftIcon={<CheckCircle2 className="w-3.5 h-3.5" />}
                        onClick={() => handleApprove(reqItem)}
                      >
                        Approve & Activate
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Rejection / Corrections Action Modal */}
      {actionModal.isOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-md p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-white flex items-center space-x-2">
                {actionModal.action === 'reject' ? (
                  <>
                    <XCircle className="w-5 h-5 text-rose-500" />
                    <span>Reject Approval Request</span>
                  </>
                ) : (
                  <>
                    <RotateCcw className="w-5 h-5 text-amber-400" />
                    <span>Request Revisions & Corrections</span>
                  </>
                )}
              </h3>
              <button
                onClick={() => setActionModal({ isOpen: false, action: 'reject', targetRequest: null, reason: '', loading: false })}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-400">
              {actionModal.action === 'reject'
                ? 'Specify the formal rejection reason. This will be recorded permanently in the audit history and sent to the submitter.'
                : 'Explain what changes or additional documents the submitter must provide before approval.'}
            </p>

            <form onSubmit={handleConfirmAction} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  {actionModal.action === 'reject' ? 'Rejection Reason *' : 'Correction Notes *'}
                </label>
                <textarea
                  rows="4"
                  value={actionModal.reason}
                  onChange={(e) => setActionModal((prev) => ({ ...prev, reason: e.target.value }))}
                  placeholder={
                    actionModal.action === 'reject'
                      ? 'e.g. Incomplete customer identity proof provided; KYC verification failed.'
                      : 'e.g. Please re-upload clearer photos of the electrical distribution panel.'
                  }
                  required
                  className="w-full p-3 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs focus:border-solar-400 focus:outline-none"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-2 border-t border-slate-800">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setActionModal({ isOpen: false, action: 'reject', targetRequest: null, reason: '', loading: false })}
                >
                  Cancel
                </Button>
                <Button
                  variant={actionModal.action === 'reject' ? 'danger' : 'primary'}
                  size="sm"
                  type="submit"
                  isLoading={actionModal.loading}
                >
                  {actionModal.action === 'reject' ? 'Confirm Rejection' : 'Send Correction Request'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminReviewCenter;
