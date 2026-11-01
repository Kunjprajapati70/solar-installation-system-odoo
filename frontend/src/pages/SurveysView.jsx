import React, { useState, useEffect } from 'react';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import {
  ClipboardCheck,
  CheckCircle2,
  XCircle,
  Clock,
  Eye,
  Camera,
  Layers,
  MapPin,
  Calendar,
  AlertCircle,
  Plus,
  ShieldCheck,
  Zap,
  X,
  Edit,
  RotateCcw,
  Check,
  Search,
  Filter,
  User,
  Phone,
  Home
} from 'lucide-react';
import Button from '../components/ui/Button';
import Pagination from '../components/ui/Pagination';

const SurveysView = () => {
  const { user } = useAuth();
  const { showToast } = useToast();

  const [surveys, setSurveys] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [technicians, setTechnicians] = useState([]);
  const [loading, setLoading] = useState(true);

  // Selected survey for View inspection modal
  const [viewSurvey, setViewSurvey] = useState(null);
  const [selectedSurvey, setSelectedSurvey] = useState(null);

  // Modals
  const [showApprovalModal, setShowApprovalModal] = useState(false);
  const [showNewSurveyModal, setShowNewSurveyModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);

  // Filters & Pagination
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [paginationInfo, setPaginationInfo] = useState({ total: 0, pages: 1 });

  const [approvalForm, setApprovalForm] = useState({
    recommendedCapacityKw: 3,
    recommendedSystemType: 'on_grid',
    approvalNotes: 'Roof integrity and shadow-free irradiance verified by engineering.'
  });

  const [newSurveyForm, setNewSurveyForm] = useState({
    customerId: '',
    surveyorId: '',
    roofType: 'rcc_flat',
    totalAreaSqft: 650,
    shadowFreeAreaSqft: 500,
    requiredCapacityKw: 3,
    systemType: 'on_grid',
    averageMonthlyConsumptionKwh: 380,
    monthlyBillAmount: 3500,
    notes: 'South-facing unobstructed rooftop with sturdy RCC slab.'
  });

  const fetchSurveys = async () => {
    try {
      setLoading(true);
      const params = {
        page: currentPage,
        limit: pageSize
      };
      if (statusFilter) params.status = statusFilter;
      if (searchQuery) params.search = searchQuery;

      const res = await api.get('/surveys', { params });
      if (res.success) {
        setSurveys(res.data);
        if (res.pagination) {
          setPaginationInfo({
            total: res.pagination.total || res.data.length,
            pages: res.pagination.pages || Math.ceil((res.pagination.total || res.data.length) / pageSize)
          });
        } else {
          setPaginationInfo({ total: res.data.length, pages: 1 });
        }
        if (res.data.length > 0 && !selectedSurvey) {
          setSelectedSurvey(res.data[0]);
        }
      }
    } catch (err) {
      showToast(err.message || 'Failed to fetch surveys', 'error');
    } finally {
      setLoading(false);
    }
  };

  const fetchSupportingData = async () => {
    try {
      const [custRes, techRes] = await Promise.allSettled([
        api.get('/customers?limit=100'),
        api.get('/technicians?limit=50')
      ]);

      if (custRes.status === 'fulfilled' && custRes.value.success) {
        setCustomers(custRes.value.data);
        if (custRes.value.data.length > 0) {
          setNewSurveyForm(prev => ({ ...prev, customerId: custRes.value.data[0]._id }));
        }
      }
      if (techRes.status === 'fulfilled' && techRes.value.success) {
        setTechnicians(techRes.value.data);
        if (techRes.value.data.length > 0) {
          setNewSurveyForm(prev => ({ ...prev, surveyorId: techRes.value.data[0]._id }));
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchSupportingData();
  }, []);

  useEffect(() => {
    fetchSurveys();
  }, [currentPage, pageSize, statusFilter, searchQuery]);

  const handleCreateSurvey = async (e) => {
    e.preventDefault();
    if (!newSurveyForm.customerId) {
      showToast('Please select a customer for this site survey', 'error');
      return;
    }
    try {
      const payload = {
        customerId: newSurveyForm.customerId,
        surveyorId: newSurveyForm.surveyorId || undefined,
        scheduledDate: new Date(),
        roofDetails: {
          roofType: newSurveyForm.roofType,
          totalRoofAreaSqft: Number(newSurveyForm.totalAreaSqft) || 500,
          shadowFreeAreaSqft: Number(newSurveyForm.shadowFreeAreaSqft) || 400,
          tiltAngleDeg: 18,
          azimuthDeg: 180,
          structuralIntegrity: 'good'
        },
        electricalDetails: {
          phase: newSurveyForm.systemType === 'off_grid' ? 'single' : 'three_phase',
          sanctionedLoadKw: Number(newSurveyForm.requiredCapacityKw) || 3,
          averageMonthlyConsumptionKwh: Number(newSurveyForm.averageMonthlyConsumptionKwh) || 350,
          monthlyBillAmount: Number(newSurveyForm.monthlyBillAmount) || 3000,
          existingMeterType: 'digital_bidirectional',
          earthingStatus: 'adequate'
        },
        notes: newSurveyForm.notes
      };

      const res = await api.post('/surveys', payload);
      if (res.success) {
        showToast('Site Survey created successfully! Status is Pending Approval.', 'success');
        setShowNewSurveyModal(false);
        fetchSurveys();
        setSelectedSurvey(res.data);
      }
    } catch (err) {
      showToast(`Create survey error: ${err.message}`, 'error');
    }
  };

  const handleApprove = async (surveyToApprove) => {
    const target = surveyToApprove || selectedSurvey;
    if (!target) return;
    try {
      const res = await api.put(`/surveys/${target._id}/approve`, approvalForm);
      if (res.success) {
        showToast(res.message || 'Survey approved! Quotation engine unlocked.', 'success');
        setShowApprovalModal(false);
        if (showViewModal && viewSurvey?._id === target._id) {
          setViewSurvey(res.data);
        }
        setSelectedSurvey(res.data);
        fetchSurveys();
      }
    } catch (err) {
      showToast(`Approval error: ${err.message}`, 'error');
    }
  };

  const handleReject = async (surveyId) => {
    const reason = window.prompt('Please enter site survey rejection reason:');
    if (!reason) return;
    try {
      const res = await api.put(`/surveys/${surveyId}/reject`, { reason });
      if (res.success) {
        showToast(res.message || 'Site survey marked as rejected.', 'warning');
        if (showViewModal && viewSurvey?._id === surveyId) {
          setViewSurvey(res.data);
        }
        fetchSurveys();
      }
    } catch (err) {
      showToast(`Rejection error: ${err.message}`, 'error');
    }
  };

  const openViewModal = (survey) => {
    setViewSurvey(survey);
    setShowViewModal(true);
  };

  const statusBadges = {
    scheduled: 'bg-sky-500/10 text-sky-400 border-sky-500/30',
    in_progress: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
    completed: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/30',
    approved: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30 font-bold',
    rejected: 'bg-rose-500/10 text-rose-400 border-rose-500/30'
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="p-5 rounded-2xl glass-card border border-solar-500/20 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-solar-400 text-xs font-semibold uppercase tracking-wider mb-1">
            <ClipboardCheck className="w-3.5 h-3.5" />
            <span>Site Survey Module • Business Rule 1 Enforced</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
            Site Survey <span className="gradient-solar-text">& Technical Approvals</span>
          </h1>
          <p className="text-slate-400 text-xs sm:text-sm mt-0.5">
            Rule 1: Commercial quotations can only be created from formally approved site surveys.
          </p>
        </div>

        {(user?.role === 'admin' || user?.role === 'sales') && (
          <Button
            variant="primary"
            size="md"
            leftIcon={<Plus className="w-4 h-4" />}
            onClick={() => setShowNewSurveyModal(true)}
          >
            Create Site Survey
          </Button>
        )}
      </div>

      {/* Filter & Search Bar */}
      <div className="p-4 rounded-xl glass-card flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 text-xs">
        <div className="flex-1 relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
          <input
            type="text"
            placeholder="Search by Survey #, Customer name, city..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full pl-9 pr-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-solar-500 font-sans"
          />
        </div>

        <div className="flex items-center space-x-2">
          <Filter className="w-4 h-4 text-slate-400" />
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white font-medium focus:outline-none focus:border-solar-500"
          >
            <option value="">All Statuses</option>
            <option value="scheduled">Scheduled</option>
            <option value="in_progress">In Progress</option>
            <option value="completed">Completed</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>
      </div>

      {/* Main Grid: Surveys List + Detail Pane */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Table Column (2 cols) */}
        <div className="lg:col-span-2 rounded-2xl glass-card overflow-hidden border border-slate-800 flex flex-col justify-between">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-900 text-slate-400 uppercase text-[10px] border-b border-slate-800">
                <tr>
                  <th className="py-2.5 px-3">Survey #</th>
                  <th className="py-2.5 px-3">Customer & Site</th>
                  <th className="py-2.5 px-3">Surveyor</th>
                  <th className="py-2.5 px-3">Roof Area</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-sans">
                {surveys.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="text-center py-12 text-slate-500">
                      No site surveys matching the search criteria.
                    </td>
                  </tr>
                ) : (
                  surveys.map((survey) => {
                    const isSelected = selectedSurvey?._id === survey._id;
                    const isApproved = survey.status === 'approved';
                    const isRejected = survey.status === 'rejected';

                    return (
                      <tr
                        key={survey._id}
                        onClick={() => setSelectedSurvey(survey)}
                        className={`cursor-pointer transition ${
                          isSelected ? 'bg-solar-500/10' : 'hover:bg-slate-800/40'
                        }`}
                      >
                        <td className="py-2.5 px-3 font-mono font-bold text-solar-400">
                          {survey.surveyNumber}
                        </td>
                        <td className="py-2.5 px-3">
                          <p className="font-semibold text-slate-200">{survey.customer?.name || 'Customer'}</p>
                          <p className="text-[10px] text-slate-400 truncate max-w-[150px]">
                            {survey.customer?.installationAddress?.city || 'Gujarat'}
                          </p>
                        </td>
                        <td className="py-2.5 px-3 text-slate-300">
                          {survey.surveyor?.name || 'Assigned Tech'}
                        </td>
                        <td className="py-2.5 px-3 text-slate-400 font-mono">
                          {survey.roofDetails?.shadowFreeAreaSqft || 500} sqft
                        </td>
                        <td className="py-2.5 px-3">
                          <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] uppercase border ${statusBadges[survey.status] || 'bg-slate-800 text-slate-400 border-slate-700'}`}>
                            {survey.status}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-right space-x-1.5">
                          {/* Approve Action */}
                          {!isApproved && !isRejected && (user?.role === 'admin' || user?.role === 'sales') && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedSurvey(survey);
                                setApprovalForm(prev => ({
                                  ...prev,
                                  recommendedCapacityKw: survey.enquiry?.proposedCapacityKw || 3
                                }));
                                setShowApprovalModal(true);
                              }}
                              className="px-2.5 py-1 rounded bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 border border-emerald-500/40 text-[10px] font-bold"
                            >
                              Approve
                            </button>
                          )}

                          {/* View Button (Requirement 8) */}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedSurvey(survey);
                              openViewModal(survey);
                            }}
                            className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 text-[10px] font-medium"
                          >
                            View
                          </button>
                        </td>
                      </tr>
                    );
                  })
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

        {/* Selected Survey Detail Inspection (Right Column) */}
        <div className="rounded-2xl glass-card p-5 border border-slate-800 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <h3 className="text-sm font-bold text-white flex items-center space-x-2">
              <Eye className="w-4 h-4 text-solar-400" />
              <span>Survey Technical Audit</span>
            </h3>
            {selectedSurvey && (
              <span className="text-xs font-mono text-solar-400 font-bold">{selectedSurvey.surveyNumber}</span>
            )}
          </div>

          {!selectedSurvey ? (
            <div className="text-center py-12 text-slate-500 text-xs">
              <ClipboardCheck className="w-10 h-10 mx-auto text-slate-600 mb-2" />
              <p>Select a survey from the table to inspect roof metrics, azimuth, electrical phase, and approval state.</p>
            </div>
          ) : (
            <div className="space-y-4 text-xs">
              {/* Approval Status Banner */}
              <div className={`p-3 rounded-xl border flex items-center justify-between ${
                selectedSurvey.status === 'approved'
                  ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-300'
                  : selectedSurvey.status === 'rejected'
                  ? 'bg-rose-500/10 border-rose-500/40 text-rose-300'
                  : 'bg-amber-500/10 border-amber-500/40 text-amber-300'
              }`}>
                <div className="flex items-center space-x-2">
                  {selectedSurvey.status === 'approved' ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                  ) : selectedSurvey.status === 'rejected' ? (
                    <XCircle className="w-5 h-5 text-rose-400" />
                  ) : (
                    <Clock className="w-5 h-5 text-amber-400" />
                  )}
                  <div>
                    <span className="font-bold uppercase tracking-wider block">
                      {selectedSurvey.status === 'approved'
                        ? 'Survey Approved'
                        : selectedSurvey.status === 'rejected'
                        ? 'Survey Rejected'
                        : 'Awaiting Technical Approval'}
                    </span>
                    <span className="text-[10px] text-slate-400">
                      {selectedSurvey.status === 'approved'
                        ? 'Quotation generation unlocked'
                        : selectedSurvey.status === 'rejected'
                        ? 'Engineering criteria not met'
                        : 'Quotation generation locked (Rule 1)'}
                    </span>
                  </div>
                </div>

                {selectedSurvey.status !== 'approved' && selectedSurvey.status !== 'rejected' && (user?.role === 'admin' || user?.role === 'sales') && (
                  <button
                    onClick={() => setShowApprovalModal(true)}
                    className="px-3 py-1 bg-emerald-500 hover:bg-emerald-400 text-midnight-950 font-bold rounded-lg text-xs"
                  >
                    Approve
                  </button>
                )}
              </div>

              {/* Customer & Site Address */}
              <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Client & Location</span>
                <p className="font-bold text-white text-xs">{selectedSurvey.customer?.name || 'Solar Client'}</p>
                <p className="text-slate-400 text-[11px]">
                  {selectedSurvey.customer?.installationAddress?.street}, {selectedSurvey.customer?.installationAddress?.city}, {selectedSurvey.customer?.installationAddress?.state}
                </p>
              </div>

              {/* Roof Details Card */}
              <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 space-y-1.5">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Roof Geometry</span>
                <div className="grid grid-cols-2 gap-2 text-slate-300 font-mono text-[11px]">
                  <span>Roof Type: <strong className="text-white">{selectedSurvey.roofDetails?.roofType || 'RCC Flat'}</strong></span>
                  <span>Shadow-Free: <strong className="text-white">{selectedSurvey.roofDetails?.shadowFreeAreaSqft || 500} sqft</strong></span>
                  <span>Tilt Angle: <strong className="text-white">{selectedSurvey.roofDetails?.tiltAngleDeg || 18}°</strong></span>
                  <span>Azimuth: <strong className="text-white">{selectedSurvey.roofDetails?.azimuthDeg || 180}° S</strong></span>
                </div>
              </div>

              {/* Electrical Parameters */}
              <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 space-y-1.5">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Electrical Parameters</span>
                <div className="grid grid-cols-2 gap-2 text-slate-300 font-mono text-[11px]">
                  <span>Phase: <strong className="text-white capitalize">{selectedSurvey.electricalDetails?.phase || 'Three'} Phase</strong></span>
                  <span>Sanctioned Load: <strong className="text-white">{selectedSurvey.electricalDetails?.sanctionedLoadKw || 3} kW</strong></span>
                  <span>Existing Meter: <strong className="text-white">{selectedSurvey.electricalDetails?.existingMeterType || 'Digital Bi-dir'}</strong></span>
                  <span>Earthing Pit: <strong className="text-emerald-400">{selectedSurvey.electricalDetails?.earthingStatus || 'Adequate'}</strong></span>
                </div>
              </div>

              {/* Surveyor Notes */}
              <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800">
                <span className="text-[10px] text-slate-500 uppercase font-semibold block mb-1">Surveyor Field Notes:</span>
                <p className="text-slate-300 italic">{selectedSurvey.surveyorNotes || 'No special notes logged.'}</p>
              </div>

              {/* Quick Action Button to Open Full Modal */}
              <Button
                variant="secondary"
                size="sm"
                fullWidth
                leftIcon={<Eye className="w-3.5 h-3.5" />}
                onClick={() => openViewModal(selectedSurvey)}
              >
                Open Full Technical Audit Modal
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Requirement 8: Comprehensive View Survey Details Modal */}
      {showViewModal && viewSurvey && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="glass-card w-full max-w-2xl rounded-2xl border border-slate-700 p-6 space-y-5 my-8">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center space-x-2">
                <ClipboardCheck className="w-5 h-5 text-solar-400" />
                <h3 className="text-base font-bold text-white">
                  Site Survey Full Audit • <span className="font-mono text-solar-400">{viewSurvey.surveyNumber}</span>
                </h3>
              </div>
              <button
                onClick={() => setShowViewModal(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Status & Timing Banner */}
            <div className="flex flex-wrap items-center justify-between p-3 rounded-xl bg-slate-900 border border-slate-800 text-xs gap-2">
              <div className="flex items-center space-x-2">
                <span className="text-slate-400">Current Status:</span>
                <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase border ${statusBadges[viewSurvey.status] || 'bg-slate-800 text-slate-300'}`}>
                  {viewSurvey.status}
                </span>
              </div>
              <div className="text-slate-400 font-mono text-[11px]">
                Scheduled: {new Date(viewSurvey.scheduledDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
              </div>
            </div>

            {/* Customer & Location Details */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3.5 rounded-xl bg-slate-900/90 border border-slate-800 text-xs">
              <div>
                <span className="text-[10px] text-slate-500 uppercase font-bold block mb-1">Customer Profile</span>
                <p className="font-bold text-white text-sm">{viewSurvey.customer?.name || 'Customer'}</p>
                <p className="text-slate-400">{viewSurvey.customer?.email}</p>
                <p className="text-slate-400 font-mono">{viewSurvey.customer?.phone}</p>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 uppercase font-bold block mb-1">Installation Site Address</span>
                <p className="text-slate-200">
                  {viewSurvey.customer?.installationAddress?.street || 'Site Premises'}, {viewSurvey.customer?.installationAddress?.city || 'City'}, {viewSurvey.customer?.installationAddress?.state || 'State'} - {viewSurvey.customer?.installationAddress?.pincode}
                </p>
                <p className="text-slate-500 text-[11px] mt-1 font-mono">Assigned Surveyor: {viewSurvey.surveyor?.name || 'Technical Team'}</p>
              </div>
            </div>

            {/* Roof & Irradiance Details */}
            <div className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-800 text-xs space-y-2">
              <span className="text-[10px] text-solar-400 uppercase font-bold block">Rooftop Physical Inspection & Shadow Analysis</span>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 font-mono text-[11px]">
                <div className="p-2 rounded bg-slate-800/60 border border-slate-700/60">
                  <span className="text-slate-400 block text-[10px]">Roof Type</span>
                  <span className="font-bold text-white capitalize">{viewSurvey.roofDetails?.roofType?.replace('_', ' ') || 'RCC Flat'}</span>
                </div>
                <div className="p-2 rounded bg-slate-800/60 border border-slate-700/60">
                  <span className="text-slate-400 block text-[10px]">Total Area</span>
                  <span className="font-bold text-white">{viewSurvey.roofDetails?.totalRoofAreaSqft || 650} sqft</span>
                </div>
                <div className="p-2 rounded bg-slate-800/60 border border-slate-700/60">
                  <span className="text-slate-400 block text-[10px]">Shadow-Free</span>
                  <span className="font-bold text-emerald-400">{viewSurvey.roofDetails?.shadowFreeAreaSqft || 500} sqft</span>
                </div>
                <div className="p-2 rounded bg-slate-800/60 border border-slate-700/60">
                  <span className="text-slate-400 block text-[10px]">Azimuth & Tilt</span>
                  <span className="font-bold text-white">{viewSurvey.roofDetails?.tiltAngleDeg || 18}° / {viewSurvey.roofDetails?.azimuthDeg || 180}°</span>
                </div>
              </div>
            </div>

            {/* Electrical Infrastructure */}
            <div className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-800 text-xs space-y-2">
              <span className="text-[10px] text-sky-400 uppercase font-bold block">Grid & Electrical Infrastructure</span>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 font-mono text-[11px]">
                <div className="p-2 rounded bg-slate-800/60 border border-slate-700/60">
                  <span className="text-slate-400 block text-[10px]">Phase Connection</span>
                  <span className="font-bold text-white capitalize">{viewSurvey.electricalDetails?.phase || 'Three'} Phase</span>
                </div>
                <div className="p-2 rounded bg-slate-800/60 border border-slate-700/60">
                  <span className="text-slate-400 block text-[10px]">Sanctioned Load</span>
                  <span className="font-bold text-white">{viewSurvey.electricalDetails?.sanctionedLoadKw || 3} kW</span>
                </div>
                <div className="p-2 rounded bg-slate-800/60 border border-slate-700/60">
                  <span className="text-slate-400 block text-[10px]">Monthly Energy</span>
                  <span className="font-bold text-white">{viewSurvey.electricalDetails?.averageMonthlyConsumptionKwh || 380} kWh</span>
                </div>
                <div className="p-2 rounded bg-slate-800/60 border border-slate-700/60">
                  <span className="text-slate-400 block text-[10px]">Meter Type</span>
                  <span className="font-bold text-white">{viewSurvey.electricalDetails?.existingMeterType || 'Bi-directional'}</span>
                </div>
              </div>
            </div>

            {/* Approval Details or Rejection Info */}
            {viewSurvey.approvalDetails?.isApproved && (
              <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-xs space-y-1">
                <span className="text-[10px] font-bold text-emerald-400 uppercase">Approval Verification</span>
                <p className="text-slate-300">
                  Approved capacity: <strong className="text-white font-mono">{viewSurvey.approvalDetails.recommendedCapacityKw} kW</strong> ({viewSurvey.approvalDetails.recommendedSystemType})
                </p>
                <p className="text-slate-400 italic">"{viewSurvey.approvalDetails.approvalNotes}"</p>
                {viewSurvey.approvalDetails.approvedAt && (
                  <span className="text-[10px] text-slate-500 block">
                    Approved at: {new Date(viewSurvey.approvalDetails.approvedAt).toLocaleString()}
                  </span>
                )}
              </div>
            )}

            {/* Surveyor Notes */}
            <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 text-xs">
              <span className="text-[10px] text-slate-500 uppercase font-bold block mb-1">Field Notes:</span>
              <p className="text-slate-300 italic">{viewSurvey.surveyorNotes || 'Structural integrity verified sound for rooftop module mounting.'}</p>
            </div>

            {/* Action Buttons in Modal */}
            <div className="flex items-center justify-between pt-3 border-t border-slate-800">
              <Button
                variant="ghost"
                size="md"
                onClick={() => setShowViewModal(false)}
              >
                Close Audit
              </Button>

              <div className="flex items-center space-x-2">
                {viewSurvey.status !== 'approved' && viewSurvey.status !== 'rejected' && (user?.role === 'admin' || user?.role === 'sales') && (
                  <>
                    <Button
                      variant="danger"
                      size="md"
                      onClick={() => handleReject(viewSurvey._id)}
                    >
                      Reject Survey
                    </Button>
                    <Button
                      variant="electric"
                      size="md"
                      leftIcon={<CheckCircle2 className="w-4 h-4" />}
                      onClick={() => {
                        setShowViewModal(false);
                        setSelectedSurvey(viewSurvey);
                        setApprovalForm(prev => ({
                          ...prev,
                          recommendedCapacityKw: viewSurvey.enquiry?.proposedCapacityKw || 3
                        }));
                        setShowApprovalModal(true);
                      }}
                    >
                      Approve Survey
                    </Button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Survey Approval Modal */}
      {showApprovalModal && selectedSurvey && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="glass-card w-full max-w-md rounded-2xl border border-slate-700 p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <h3 className="text-base font-bold text-white flex items-center space-x-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                <span>Approve Site Survey</span>
              </h3>
              <button onClick={() => setShowApprovalModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-400">
              Confirm technical parameters for <strong className="text-white">{selectedSurvey.customer?.name}</strong>. Once approved, Quotation Generation will be immediately unlocked.
            </p>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleApprove(selectedSurvey);
              }}
              className="space-y-3 text-xs"
            >
              <div>
                <label className="block text-slate-400 mb-1">Recommended System Capacity (kW)</label>
                <select
                  value={approvalForm.recommendedCapacityKw}
                  onChange={(e) => setApprovalForm({ ...approvalForm, recommendedCapacityKw: Number(e.target.value) })}
                  className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white font-bold"
                >
                  <option value="1">1 kW Rooftop Solar</option>
                  <option value="2">2 kW Rooftop Solar</option>
                  <option value="3">3 kW Rooftop Solar (Recommended for 400 kWh/mo)</option>
                  <option value="4">4 kW Rooftop Solar</option>
                  <option value="5">5 kW Rooftop Solar</option>
                  <option value="7">7.5 kW Rooftop Solar</option>
                  <option value="10">10 kW Commercial Solar</option>
                  <option value="15">15 kW Commercial Solar</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Recommended Grid Architecture</label>
                <select
                  value={approvalForm.recommendedSystemType}
                  onChange={(e) => setApprovalForm({ ...approvalForm, recommendedSystemType: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white font-bold"
                >
                  <option value="on_grid">On-Grid (Net Metered with Discom)</option>
                  <option value="hybrid">Hybrid (Net Metered + Battery Storage)</option>
                  <option value="off_grid">Off-Grid (Self-Sustaining Battery Standalone)</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Technical Lead Approval Endorsement</label>
                <textarea
                  rows="2"
                  value={approvalForm.approvalNotes}
                  onChange={(e) => setApprovalForm({ ...approvalForm, approvalNotes: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-2 border-t border-slate-800">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowApprovalModal(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="electric"
                  size="sm"
                  leftIcon={<Check className="w-4 h-4" />}
                >
                  Confirm & Unlock Quotation
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* New Survey Creation Modal */}
      {showNewSurveyModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="glass-card w-full max-w-xl rounded-2xl border border-slate-700 p-6 space-y-4 my-8">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <h3 className="text-base font-bold text-white flex items-center space-x-2">
                <Plus className="w-5 h-5 text-solar-400" />
                <span>Schedule New Technical Site Survey</span>
              </h3>
              <button onClick={() => setShowNewSurveyModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateSurvey} className="space-y-3 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 mb-1 font-semibold">Select Customer</label>
                  <select
                    value={newSurveyForm.customerId}
                    onChange={(e) => setNewSurveyForm({ ...newSurveyForm, customerId: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white"
                    required
                  >
                    <option value="">-- Choose Customer --</option>
                    {customers.map((c) => (
                      <option key={c._id} value={c._id}>
                        {c.name} ({c.installationAddress?.city || 'City'})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 mb-1 font-semibold">Assign Technical Surveyor</label>
                  <select
                    value={newSurveyForm.surveyorId}
                    onChange={(e) => setNewSurveyForm({ ...newSurveyForm, surveyorId: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white"
                  >
                    <option value="">-- Assign Technician --</option>
                    {technicians.map((t) => (
                      <option key={t._id} value={t._id}>
                        {t.name} ({t.phone})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1">Roof Type</label>
                  <select
                    value={newSurveyForm.roofType}
                    onChange={(e) => setNewSurveyForm({ ...newSurveyForm, roofType: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white"
                  >
                    <option value="rcc_flat">Flat RCC Slab</option>
                    <option value="tin_shed">Industrial Metal Shed</option>
                    <option value="tiled">Slanted Mangalore Tiles</option>
                    <option value="elevated">Elevated Pergola / Superstructure</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-400 mb-1">Total Roof Area (sqft)</label>
                  <input
                    type="number"
                    value={newSurveyForm.totalAreaSqft}
                    onChange={(e) => setNewSurveyForm({ ...newSurveyForm, totalAreaSqft: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white font-mono"
                    required
                  />
                </div>

                <div>
                  <label className="block text-slate-400 mb-1">Shadow-Free Area (sqft)</label>
                  <input
                    type="number"
                    value={newSurveyForm.shadowFreeAreaSqft}
                    onChange={(e) => setNewSurveyForm({ ...newSurveyForm, shadowFreeAreaSqft: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white font-mono"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1">Capacity Required (kW)</label>
                  <input
                    type="number"
                    step="0.5"
                    value={newSurveyForm.requiredCapacityKw}
                    onChange={(e) => setNewSurveyForm({ ...newSurveyForm, requiredCapacityKw: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white font-mono"
                    required
                  />
                </div>

                <div>
                  <label className="block text-slate-400 mb-1">Monthly Energy (kWh)</label>
                  <input
                    type="number"
                    value={newSurveyForm.averageMonthlyConsumptionKwh}
                    onChange={(e) => setNewSurveyForm({ ...newSurveyForm, averageMonthlyConsumptionKwh: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white font-mono"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 mb-1">Monthly Electric Bill (₹)</label>
                  <input
                    type="number"
                    value={newSurveyForm.monthlyBillAmount}
                    onChange={(e) => setNewSurveyForm({ ...newSurveyForm, monthlyBillAmount: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Surveyor Initial Notes</label>
                <textarea
                  rows="2"
                  value={newSurveyForm.notes}
                  onChange={(e) => setNewSurveyForm({ ...newSurveyForm, notes: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-2 border-t border-slate-800">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowNewSurveyModal(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                >
                  Create Survey Record
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default SurveysView;
