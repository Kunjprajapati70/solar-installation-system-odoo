import React, { useState, useEffect } from 'react';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import {
  MessageSquarePlus,
  Plus,
  Calendar,
  Phone,
  Mail,
  MapPin,
  CheckCircle2,
  Clock,
  ArrowRight,
  Filter,
  X,
  Search,
  UserCheck,
  User,
  FileText,
  AlertCircle,
  Archive,
  History,
  Check,
  RefreshCw
} from 'lucide-react';
import Pagination from '../components/ui/Pagination';
import Button from '../components/ui/Button';

const EnquiriesView = () => {
  const { user } = useAuth();
  const { showToast } = useToast();
  const isAdmin = user?.role === 'admin';

  const [enquiries, setEnquiries] = useState([]);
  const [technicians, setTechnicians] = useState([]);
  const [salesReps, setSalesReps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Modals
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [showNewEnquiryModal, setShowNewEnquiryModal] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [selectedEnquiry, setSelectedEnquiry] = useState(null);

  // Status & Note Modal Form
  const [statusUpdateForm, setStatusUpdateForm] = useState({
    status: '',
    assignedSalesId: '',
    rejectionReason: '',
    note: ''
  });

  const [scheduleForm, setScheduleForm] = useState({
    surveyorId: '',
    scheduledDate: new Date().toISOString().split('T')[0],
    notes: 'Initial rooftop solar site survey'
  });

  const [newEnquiryForm, setNewEnquiryForm] = useState({
    customerName: '',
    email: '',
    phone: '',
    leadSource: 'website',
    proposedCapacityKw: 5,
    systemType: 'on_grid',
    monthlyElectricityBill: 4500,
    address: { street: '', city: 'Bengaluru', state: 'Karnataka', pincode: '560001' }
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      const params = {};
      if (filterStatus) params.status = filterStatus;
      if (search) params.search = search;

      const [enqRes, techRes, userRes] = await Promise.all([
        api.get('/enquiries', { params }),
        api.get('/technicians'),
        api.get('/users?role=sales')
      ]);

      if (enqRes.success) setEnquiries(enqRes.data || []);
      if (techRes.success) {
        setTechnicians(techRes.data || []);
        if (techRes.data?.length > 0) {
          setScheduleForm((prev) => ({ ...prev, surveyorId: techRes.data[0]._id }));
        }
      }
      if (userRes.success) {
        setSalesReps(userRes.data || []);
      }
    } catch (err) {
      console.error('Fetch enquiries error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [filterStatus]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchData();
  };

  const handleCreateEnquiry = async (e) => {
    e.preventDefault();
    try {
      const res = await api.post('/enquiries', newEnquiryForm);
      if (res.success) {
        showToast('Customer lead enquiry created successfully!', 'success');
        setShowNewEnquiryModal(false);
        fetchData();
      }
    } catch (err) {
      showToast(err.response?.data?.message || err.message, 'error');
    }
  };

  const handleScheduleSurvey = async (e) => {
    e.preventDefault();
    if (!selectedEnquiry) return;
    try {
      const res = await api.post(`/enquiries/${selectedEnquiry._id}/schedule-survey`, scheduleForm);
      if (res.success) {
        showToast('Site survey scheduled and assigned to technician!', 'success');
        setShowScheduleModal(false);
        fetchData();
      }
    } catch (err) {
      showToast(err.response?.data?.message || err.message, 'error');
    }
  };

  const handleConvertLead = async (enquiry) => {
    if (!window.confirm(`Convert lead ${enquiry.customerName} into an official customer account?`)) {
      return;
    }
    try {
      const res = await api.post(`/enquiries/${enquiry._id}/convert`);
      if (res.success) {
        showToast(res.message || 'Lead converted to customer successfully without duplicates!', 'success');
        fetchData();
      }
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to convert lead', 'error');
    }
  };

  const handleOpenStatusModal = (enquiry) => {
    setSelectedEnquiry(enquiry);
    setStatusUpdateForm({
      status: enquiry.status || 'new',
      assignedSalesId: enquiry.assignedSales?._id || enquiry.assignedSales || '',
      rejectionReason: enquiry.rejectionReason || '',
      note: ''
    });
    setShowStatusModal(true);
  };

  const handleSaveStatusAndNotes = async (e) => {
    e.preventDefault();
    if (!selectedEnquiry) return;
    try {
      // 1. Update status if changed
      if (statusUpdateForm.status !== selectedEnquiry.status || statusUpdateForm.rejectionReason) {
        await api.put(`/enquiries/${selectedEnquiry._id}/status`, {
          status: statusUpdateForm.status,
          rejectionReason: statusUpdateForm.rejectionReason
        });
      }

      // 2. Assign sales rep if changed
      if (statusUpdateForm.assignedSalesId && statusUpdateForm.assignedSalesId !== selectedEnquiry.assignedSales?._id) {
        await api.put(`/enquiries/${selectedEnquiry._id}/assign`, {
          salesId: statusUpdateForm.assignedSalesId
        });
      }

      // 3. Add note if provided
      if (statusUpdateForm.note?.trim()) {
        await api.post(`/enquiries/${selectedEnquiry._id}/notes`, {
          note: statusUpdateForm.note
        });
      }

      showToast('Lead record updated successfully!', 'success');
      setShowStatusModal(false);
      fetchData();
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to update lead', 'error');
    }
  };

  const statusBadges = {
    new: 'bg-sky-500/10 text-sky-400 border-sky-500/30 font-bold',
    contacted: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/30',
    follow_up_required: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
    site_survey_scheduled: 'bg-purple-500/10 text-purple-400 border-purple-500/30',
    survey_scheduled: 'bg-purple-500/10 text-purple-400 border-purple-500/30',
    survey_completed: 'bg-teal-500/10 text-teal-400 border-teal-500/30',
    quotation_sent: 'bg-solar-500/10 text-solar-400 border-solar-500/30',
    quoted: 'bg-solar-500/10 text-solar-400 border-solar-500/30',
    converted: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30 font-bold',
    won: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30 font-bold',
    rejected: 'bg-rose-500/10 text-rose-400 border-rose-500/30',
    lost: 'bg-slate-500/10 text-slate-400 border-slate-500/30'
  };

  const paginatedEnquiries = enquiries.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="command-hub-banner flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-5 sm:px-6 sm:py-5 rounded-3xl relative overflow-hidden">
        <div className="relative z-10">
          <div className="hub-kicker flex items-center space-x-2 text-xs font-semibold uppercase tracking-wider mb-1">
            <MessageSquarePlus className="w-3.5 h-3.5 text-solar-400" />
            <span>Customer Leads & Acquisition Lifecycle</span>
          </div>
          <h1 className="hub-title text-2xl sm:text-3xl font-extrabold tracking-tight">
            Customer <span className="gradient-solar-text">Leads Management</span>
          </h1>
          <p className="hub-sub text-xs sm:text-sm mt-1 max-w-2xl leading-relaxed">
            Track inquiries, assign dedicated Sales Executives, manage follow-up stages, dispatch surveys, and convert verified leads into accounts without duplicates.
          </p>
        </div>

        <div className="relative z-10 flex items-center space-x-3">
          <Button
            variant="primary"
            size="md"
            icon={Plus}
            onClick={() => setShowNewEnquiryModal(true)}
          >
            New Customer Lead
          </Button>
        </div>
        <div className="hub-glow pointer-events-none" />
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 p-4 rounded-2xl glass-card border border-slate-800">
        <form onSubmit={handleSearchSubmit} className="flex-1 flex items-center space-x-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by Lead ID, Customer Name, Email, or Phone..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-10 pr-4 py-2 text-sm text-white focus:outline-none focus:border-solar-500"
            />
          </div>
          <Button variant="secondary" size="md" type="submit">
            Search
          </Button>
        </form>

        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-2 bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={filterStatus}
              onChange={(e) => {
                setFilterStatus(e.target.value);
                setCurrentPage(1);
              }}
              className="bg-transparent text-slate-300 focus:outline-none cursor-pointer"
            >
              <option value="">All Stages</option>
              <option value="new">New</option>
              <option value="contacted">Contacted</option>
              <option value="follow_up_required">Follow-up Required</option>
              <option value="site_survey_scheduled">Survey Scheduled</option>
              <option value="survey_completed">Survey Completed</option>
              <option value="quotation_sent">Quotation Sent</option>
              <option value="converted">Converted</option>
              <option value="rejected">Rejected</option>
              <option value="lost">Lost</option>
            </select>
          </div>

          <Button
            variant="outline"
            size="md"
            icon={RefreshCw}
            onClick={fetchData}
            title="Refresh Leads"
          />
        </div>
      </div>

      {/* Pipeline Table */}
      <div className="rounded-2xl glass-card overflow-hidden border border-slate-800">
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <h2 className="text-sm font-bold text-white flex items-center space-x-2">
            <MessageSquarePlus className="w-4 h-4 text-solar-400" />
            <span>Active Leads ({enquiries.length})</span>
          </h2>
          <span className="text-xs text-slate-400">Total Leads In Database</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-900 text-slate-400 uppercase text-[10px] border-b border-slate-800">
              <tr>
                <th className="py-2.5 px-3">Lead ID & Number</th>
                <th className="py-2.5 px-3">Customer Details</th>
                <th className="py-2.5 px-3">System Specs</th>
                <th className="py-2.5 px-3">Assigned Sales</th>
                <th className="py-2.5 px-3">Stage Status</th>
                <th className="py-2.5 px-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-sans">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400">
                    <div className="flex items-center justify-center space-x-2">
                      <RefreshCw className="w-4 h-4 animate-spin text-solar-500" />
                      <span>Loading customer leads database...</span>
                    </div>
                  </td>
                </tr>
              ) : paginatedEnquiries.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400">
                    No customer leads found matching current filters.
                  </td>
                </tr>
              ) : (
                paginatedEnquiries.map((enq) => {
                  const isConverted = enq.status === 'converted' || enq.status === 'won';
                  return (
                    <tr key={enq._id} className="hover:bg-slate-800/30 transition">
                      <td className="py-2.5 px-3 font-mono font-bold text-solar-400">
                        {enq.leadId || enq.enquiryNumber}
                      </td>
                      <td className="py-2.5 px-3">
                        <p className="font-semibold text-white">{enq.customerName}</p>
                        <p className="text-[11px] text-slate-400">{enq.phone} • {enq.address?.city}</p>
                      </td>
                      <td className="py-2.5 px-3 capitalize font-medium text-slate-200">
                        {enq.proposedCapacityKw} kW {enq.systemType?.replace('_', ' ')}
                        <p className="text-[10px] text-slate-400">₹{enq.monthlyElectricityBill?.toLocaleString('en-IN')}/mo bill</p>
                      </td>
                      <td className="py-2.5 px-3">
                        {enq.assignedSales?.name ? (
                          <div className="flex items-center space-x-1.5 text-slate-300">
                            <UserCheck className="w-3.5 h-3.5 text-solar-400" />
                            <span>{enq.assignedSales.name}</span>
                          </div>
                        ) : (
                          <span className="text-slate-500 italic">Unassigned</span>
                        )}
                      </td>
                      <td className="py-2.5 px-3">
                        <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold uppercase border ${statusBadges[enq.status] || 'bg-slate-800 text-slate-300'}`}>
                          {enq.status?.replace(/_/g, ' ')}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-right space-x-1.5">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleOpenStatusModal(enq)}
                        >
                          Manage
                        </Button>

                        {!isConverted && (
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => {
                              setSelectedEnquiry(enq);
                              setShowScheduleModal(true);
                            }}
                          >
                            Survey
                          </Button>
                        )}

                        {!isConverted && (
                          <Button
                            variant="success"
                            size="sm"
                            onClick={() => handleConvertLead(enq)}
                          >
                            Convert
                          </Button>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {enquiries.length > pageSize && (
          <div className="p-3 border-t border-slate-800">
            <Pagination
              currentPage={currentPage}
              totalPages={Math.ceil(enquiries.length / pageSize) || 1}
              onPageChange={(p) => setCurrentPage(p)}
              totalItems={enquiries.length}
              pageSize={pageSize}
              onPageSizeChange={(newSize) => {
                setPageSize(newSize);
                setCurrentPage(1);
              }}
            />
          </div>
        )}
      </div>

      {/* SCHEDULE SURVEY MODAL */}
      {showScheduleModal && selectedEnquiry && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="glass-card w-full max-w-md rounded-2xl border border-slate-700 p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <h3 className="text-base font-bold text-white flex items-center space-x-2">
                <Calendar className="w-5 h-5 text-emerald-400" />
                <span>Schedule Technical Site Survey</span>
              </h3>
              <button onClick={() => setShowScheduleModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleScheduleSurvey} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-400 mb-1">Assign Field Technician / Surveyor</label>
                <select
                  value={scheduleForm.surveyorId}
                  onChange={(e) => setScheduleForm({ ...scheduleForm, surveyorId: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white"
                  required
                >
                  {technicians.map((t) => (
                    <option key={t._id} value={t._id}>
                      {t.name} ({t.technicianDetails?.specialization?.join(', ') || 'General Solar'})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Scheduled Date</label>
                <input
                  type="date"
                  value={scheduleForm.scheduledDate}
                  onChange={(e) => setScheduleForm({ ...scheduleForm, scheduledDate: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Survey Instructions</label>
                <textarea
                  rows="2"
                  value={scheduleForm.notes}
                  onChange={(e) => setScheduleForm({ ...scheduleForm, notes: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-2 border-t border-slate-800">
                <Button variant="outline" size="sm" type="button" onClick={() => setShowScheduleModal(false)}>
                  Cancel
                </Button>
                <Button variant="primary" size="sm" type="submit">
                  Confirm Schedule
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MANAGE LEAD STATUS, SALES ASSIGNMENT & NOTES MODAL */}
      {showStatusModal && selectedEnquiry && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="glass-card w-full max-w-lg rounded-2xl border border-slate-700 p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <h3 className="text-base font-bold text-white flex items-center space-x-2">
                <UserCheck className="w-5 h-5 text-solar-400" />
                <span>Manage Lead • {selectedEnquiry.customerName}</span>
              </h3>
              <button onClick={() => setShowStatusModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveStatusAndNotes} className="space-y-3.5 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1 font-semibold uppercase">Lead Status</label>
                  <select
                    value={statusUpdateForm.status}
                    onChange={(e) => setStatusUpdateForm({ ...statusUpdateForm, status: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white"
                  >
                    <option value="new">New</option>
                    <option value="contacted">Contacted</option>
                    <option value="follow_up_required">Follow-up Required</option>
                    <option value="site_survey_scheduled">Survey Scheduled</option>
                    <option value="survey_completed">Survey Completed</option>
                    <option value="quotation_sent">Quotation Sent</option>
                    <option value="converted">Converted</option>
                    <option value="rejected">Rejected</option>
                    <option value="lost">Lost</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-400 mb-1 font-semibold uppercase">Assigned Sales Executive</label>
                  <select
                    value={statusUpdateForm.assignedSalesId}
                    onChange={(e) => setStatusUpdateForm({ ...statusUpdateForm, assignedSalesId: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white"
                  >
                    <option value="">Unassigned</option>
                    {salesReps.map((rep) => (
                      <option key={rep._id} value={rep._id}>
                        {rep.name} ({rep.email})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {(statusUpdateForm.status === 'rejected' || statusUpdateForm.status === 'lost') && (
                <div>
                  <label className="block text-rose-400 mb-1 font-semibold uppercase">Rejection / Lost Reason *</label>
                  <input
                    type="text"
                    required
                    value={statusUpdateForm.rejectionReason}
                    onChange={(e) => setStatusUpdateForm({ ...statusUpdateForm, rejectionReason: e.target.value })}
                    placeholder="e.g. Budget constraints, decided to postpone rooftop install"
                    className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-rose-500/50 text-white"
                  />
                </div>
              )}

              <div>
                <label className="block text-slate-400 mb-1 font-semibold uppercase">Add Internal Discussion Note</label>
                <textarea
                  rows="2"
                  value={statusUpdateForm.note}
                  onChange={(e) => setStatusUpdateForm({ ...statusUpdateForm, note: e.target.value })}
                  placeholder="Record customer preferences, shadow analysis notes, call summary..."
                  className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white"
                />
              </div>

              {/* Lead History Audit */}
              {selectedEnquiry.leadHistory?.length > 0 && (
                <div>
                  <span className="text-[10px] text-slate-500 uppercase block mb-1">Lead Audit Trail:</span>
                  <div className="max-h-24 overflow-y-auto space-y-1 p-2 rounded-lg bg-slate-950 border border-slate-800 text-[11px]">
                    {selectedEnquiry.leadHistory.map((h, i) => (
                      <div key={i} className="text-slate-400 flex items-center justify-between">
                        <span>{h.action} ({h.toStatus})</span>
                        <span className="font-mono text-[10px] text-slate-500">{new Date(h.timestamp).toLocaleDateString()}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex justify-end space-x-2 pt-2 border-t border-slate-800">
                <Button variant="outline" size="sm" type="button" onClick={() => setShowStatusModal(false)}>
                  Cancel
                </Button>
                <Button variant="primary" size="sm" type="submit">
                  Save Changes
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CREATE NEW ENQUIRY MODAL */}
      {showNewEnquiryModal && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="glass-card w-full max-w-lg rounded-2xl border border-slate-700 p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <h3 className="text-base font-bold text-white flex items-center space-x-2">
                <Plus className="w-5 h-5 text-solar-400" />
                <span>Create New Customer Lead</span>
              </h3>
              <button onClick={() => setShowNewEnquiryModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateEnquiry} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-400 mb-1">Customer Full Name *</label>
                <input
                  type="text"
                  value={newEnquiryForm.customerName}
                  onChange={(e) => setNewEnquiryForm({ ...newEnquiryForm, customerName: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-400 mb-1">Phone *</label>
                  <input
                    type="text"
                    value={newEnquiryForm.phone}
                    onChange={(e) => setNewEnquiryForm({ ...newEnquiryForm, phone: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white"
                    required
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Email *</label>
                  <input
                    type="email"
                    value={newEnquiryForm.email}
                    onChange={(e) => setNewEnquiryForm({ ...newEnquiryForm, email: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-400 mb-1">Interested Solar Capacity (kW)</label>
                  <input
                    type="number"
                    value={newEnquiryForm.proposedCapacityKw}
                    onChange={(e) => setNewEnquiryForm({ ...newEnquiryForm, proposedCapacityKw: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">System Type</label>
                  <select
                    value={newEnquiryForm.systemType}
                    onChange={(e) => setNewEnquiryForm({ ...newEnquiryForm, systemType: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white"
                  >
                    <option value="on_grid">On-Grid Rooftop</option>
                    <option value="off_grid">Off-Grid with Battery</option>
                    <option value="hybrid">Hybrid System</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-400 mb-1">Lead Source</label>
                  <select
                    value={newEnquiryForm.leadSource}
                    onChange={(e) => setNewEnquiryForm({ ...newEnquiryForm, leadSource: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white"
                  >
                    <option value="website">Website Form</option>
                    <option value="referral">Customer Referral</option>
                    <option value="campaign">Marketing Campaign</option>
                    <option value="walk_in">Walk-in / Direct</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">City</label>
                  <input
                    type="text"
                    value={newEnquiryForm.address.city}
                    onChange={(e) => setNewEnquiryForm({ ...newEnquiryForm, address: { ...newEnquiryForm.address, city: e.target.value } })}
                    className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white"
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-2 pt-2 border-t border-slate-800">
                <Button variant="outline" size="sm" type="button" onClick={() => setShowNewEnquiryModal(false)}>
                  Cancel
                </Button>
                <Button variant="primary" size="sm" type="submit">
                  Save Customer Lead
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default EnquiriesView;
