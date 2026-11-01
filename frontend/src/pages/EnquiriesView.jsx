import React, { useState, useEffect } from 'react';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';
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
  X
} from 'lucide-react';
import Pagination from '../components/ui/Pagination';

const EnquiriesView = () => {
  const { user } = useAuth();
  const [enquiries, setEnquiries] = useState([]);
  const [technicians, setTechnicians] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Modals
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [selectedEnquiry, setSelectedEnquiry] = useState(null);
  const [scheduleForm, setScheduleForm] = useState({
    surveyorId: '',
    scheduledDate: new Date().toISOString().split('T')[0],
    notes: 'Initial rooftop solar site survey'
  });

  const [showNewEnquiryModal, setShowNewEnquiryModal] = useState(false);
  const [newEnquiryForm, setNewEnquiryForm] = useState({
    customerName: '',
    email: '',
    phone: '',
    proposedCapacityKw: 3,
    systemType: 'on_grid',
    monthlyElectricityBill: 4500,
    address: { street: '', city: 'Bengaluru', state: 'Karnataka', pincode: '560001' }
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      const params = {};
      if (filterStatus) params.status = filterStatus;

      const [enqRes, techRes] = await Promise.all([
        api.get('/enquiries', { params }),
        api.get('/technicians')
      ]);

      if (enqRes.success) setEnquiries(enqRes.data);
      if (techRes.success) {
        setTechnicians(techRes.data);
        if (techRes.data.length > 0) {
          setScheduleForm(prev => ({ ...prev, surveyorId: techRes.data[0]._id }));
        }
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

  const handleCreateEnquiry = async (e) => {
    e.preventDefault();
    try {
      const res = await api.post('/enquiries', newEnquiryForm);
      if (res.success) {
        alert('Customer lead enquiry created successfully!');
        setShowNewEnquiryModal(false);
        fetchData();
      }
    } catch (err) {
      alert(`Error: ${err.message}`);
    }
  };

  const handleScheduleSurvey = async (e) => {
    e.preventDefault();
    if (!selectedEnquiry) return;
    try {
      const res = await api.post(`/enquiries/${selectedEnquiry._id}/schedule-survey`, scheduleForm);
      if (res.success) {
        alert(res.message);
        setShowScheduleModal(false);
        fetchData();
      }
    } catch (err) {
      alert(`Schedule error: ${err.message}`);
    }
  };

  const statusBadges = {
    new: 'bg-sky-500/10 text-sky-400 border-sky-500/30 font-bold',
    assigned: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
    survey_scheduled: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/30',
    survey_completed: 'bg-teal-500/10 text-teal-400 border-teal-500/30',
    quoted: 'bg-solar-500/10 text-solar-400 border-solar-500/30',
    converted: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30 font-bold'
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="p-5 rounded-2xl glass-card border border-solar-500/20 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-solar-400 text-xs font-semibold uppercase tracking-wider mb-1">
            <MessageSquarePlus className="w-3.5 h-3.5" />
            <span>Lead Ingestion & Pipeline</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
            Customer <span className="gradient-solar-text">Enquiry Pipeline</span>
          </h1>
          <p className="text-slate-400 text-xs sm:text-sm mt-0.5">
            Capture rooftop solar interest, evaluate bill economics, and schedule site surveys.
          </p>
        </div>

        <button
          onClick={() => setShowNewEnquiryModal(true)}
          className="flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-solar-500 hover:bg-solar-400 text-midnight-950 font-bold text-xs shadow-glow-solar"
        >
          <Plus className="w-4 h-4" />
          <span>New Customer Lead</span>
        </button>
      </div>

      {/* Pipeline Table */}
      <div className="rounded-2xl glass-card overflow-hidden border border-slate-800">
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <h2 className="text-sm font-bold text-white flex items-center space-x-2">
            <MessageSquarePlus className="w-4 h-4 text-solar-400" />
            <span>Active Enquiries ({enquiries.length})</span>
          </h2>

          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-xs text-slate-300"
          >
            <option value="">All Stages</option>
            <option value="new">New Leads</option>
            <option value="survey_scheduled">Survey Scheduled</option>
            <option value="survey_completed">Survey Completed</option>
            <option value="converted">Converted Orders</option>
          </select>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-900 text-slate-400 uppercase text-[10px] border-b border-slate-800">
              <tr>
                <th className="py-2.5 px-3">Enquiry #</th>
                <th className="py-2.5 px-3">Customer</th>
                <th className="py-2.5 px-3">Contact</th>
                <th className="py-2.5 px-3">Desired Capacity</th>
                <th className="py-2.5 px-3">Est. Bill</th>
                <th className="py-2.5 px-3">Stage</th>
                <th className="py-2.5 px-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-sans">
              {enquiries.slice((currentPage - 1) * pageSize, currentPage * pageSize).map((enq) => (
                <tr key={enq._id} className="hover:bg-slate-800/30 transition">
                  <td className="py-2.5 px-3 font-mono font-bold text-solar-400">{enq.enquiryNumber}</td>
                  <td className="py-2.5 px-3">
                    <p className="font-semibold text-white">{enq.customerName}</p>
                    <p className="text-[10px] text-slate-400">{enq.address?.city}</p>
                  </td>
                  <td className="py-2.5 px-3 font-mono text-slate-300">
                    <p>{enq.phone}</p>
                    <p className="text-[10px] text-slate-500">{enq.email}</p>
                  </td>
                  <td className="py-2.5 px-3 capitalize font-medium text-slate-200">
                    {enq.proposedCapacityKw} kW {enq.systemType?.replace('_', ' ')}
                  </td>
                  <td className="py-2.5 px-3 font-mono text-slate-300">
                    ₹{enq.monthlyElectricityBill?.toLocaleString('en-IN')}/mo
                  </td>
                  <td className="py-2.5 px-3">
                    <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold uppercase border ${statusBadges[enq.status] || 'bg-slate-800 text-slate-300'}`}>
                      {enq.status?.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-right">
                    {enq.status === 'new' && (
                      <button
                        onClick={() => {
                          setSelectedEnquiry(enq);
                          setShowScheduleModal(true);
                        }}
                        className="px-2.5 py-1 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 text-[10px] font-bold rounded border border-emerald-500/40"
                      >
                        Schedule Survey
                      </button>
                    )}
                  </td>
                </tr>
              ))}
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

      {/* Schedule Survey Modal */}
      {showScheduleModal && selectedEnquiry && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="glass-card w-full max-w-md rounded-2xl border border-slate-700 p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <h3 className="text-base font-bold text-white flex items-center space-x-2">
                <Calendar className="w-5 h-5 text-emerald-400" />
                <span>Schedule Site Survey</span>
              </h3>
              <button onClick={() => setShowScheduleModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-400">
              Assign a certified solar technician to inspect roof geometry and shadow area for <strong className="text-white">{selectedEnquiry.customerName}</strong>.
            </p>

            <form onSubmit={handleScheduleSurvey} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-400 mb-1">Assign Certified Technician / Surveyor</label>
                <select
                  value={scheduleForm.surveyorId}
                  onChange={(e) => setScheduleForm({ ...scheduleForm, surveyorId: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white font-medium"
                  required
                >
                  {technicians.map((t) => (
                    <option key={t._id} value={t._id}>
                      {t.name} ({t.phone}) - {t.activeInstallations || 0} active jobs
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Survey Date</label>
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
                <button
                  type="button"
                  onClick={() => setShowScheduleModal(false)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 rounded-lg hover:bg-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-midnight-950 font-bold rounded-lg shadow-glow-electric"
                >
                  Confirm & Schedule Survey
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Create Enquiry Modal */}
      {showNewEnquiryModal && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="glass-card w-full max-w-md rounded-2xl border border-slate-700 p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <h3 className="text-base font-bold text-white flex items-center space-x-2">
                <Plus className="w-5 h-5 text-solar-400" />
                <span>Log New Solar Enquiry</span>
              </h3>
              <button onClick={() => setShowNewEnquiryModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateEnquiry} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-400 mb-1">Customer Full Name</label>
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
                  <label className="block text-slate-400 mb-1">Email</label>
                  <input
                    type="email"
                    value={newEnquiryForm.email}
                    onChange={(e) => setNewEnquiryForm({ ...newEnquiryForm, email: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white"
                    required
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Phone Number</label>
                  <input
                    type="text"
                    value={newEnquiryForm.phone}
                    onChange={(e) => setNewEnquiryForm({ ...newEnquiryForm, phone: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white font-mono"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-400 mb-1">Desired Capacity (kW)</label>
                  <select
                    value={newEnquiryForm.proposedCapacityKw}
                    onChange={(e) => setNewEnquiryForm({ ...newEnquiryForm, proposedCapacityKw: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white"
                  >
                    <option value="1">1 kW</option>
                    <option value="2">2 kW</option>
                    <option value="3">3 kW</option>
                    <option value="4">4 kW</option>
                    <option value="5">5 kW</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">System Type</label>
                  <select
                    value={newEnquiryForm.systemType}
                    onChange={(e) => setNewEnquiryForm({ ...newEnquiryForm, systemType: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white"
                  >
                    <option value="on_grid">On-Grid</option>
                    <option value="off_grid">Off-Grid</option>
                    <option value="hybrid">Hybrid</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Street Address & City</label>
                <input
                  type="text"
                  value={newEnquiryForm.address.street}
                  onChange={(e) => setNewEnquiryForm({ ...newEnquiryForm, address: { ...newEnquiryForm.address, street: e.target.value } })}
                  placeholder="Street and locality"
                  className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white"
                  required
                />
              </div>

              <div className="flex justify-end space-x-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowNewEnquiryModal(false)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 rounded-lg hover:bg-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-solar-500 hover:bg-solar-400 text-midnight-950 font-bold rounded-lg shadow-glow-solar"
                >
                  Create Enquiry
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default EnquiriesView;
