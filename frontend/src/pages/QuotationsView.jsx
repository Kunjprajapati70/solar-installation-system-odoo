import React, { useState, useEffect } from 'react';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import {
  FileSpreadsheet,
  Plus,
  Printer,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  ShieldCheck,
  Calculator,
  X,
  FileText,
  Edit,
  RotateCcw,
  Search,
  Filter,
  DollarSign,
  Calendar,
  Layers,
  Sparkles
} from 'lucide-react';
import Button from '../components/ui/Button';
import Pagination from '../components/ui/Pagination';
import PrintDocumentModal from '../components/common/PrintDocumentModal';

const QuotationsView = () => {
  const { user } = useAuth();
  const { showToast } = useToast();

  const [quotations, setQuotations] = useState([]);
  const [surveys, setSurveys] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modals
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [selectedQuotation, setSelectedQuotation] = useState(null);

  // Filters & Pagination
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [paginationInfo, setPaginationInfo] = useState({ total: 0, pages: 1 });

  // Creation form state
  const [formData, setFormData] = useState({
    siteSurveyId: '',
    systemCapacityKw: 3,
    systemType: 'on_grid',
    notes: ''
  });

  // Edit form state
  const [editForm, setEditForm] = useState({
    systemCapacityKw: 3,
    systemType: 'on_grid',
    laborCost: 15000,
    discountAmount: 0,
    validUntil: '',
    notes: '',
    bom: []
  });

  // Dynamic preview calculation state
  const [previewCalc, setPreviewCalc] = useState(null);

  const fetchQuotations = async () => {
    try {
      setLoading(true);
      const params = {
        page: currentPage,
        limit: pageSize
      };
      if (statusFilter) params.status = statusFilter;
      if (searchQuery) params.search = searchQuery;

      const res = await api.get('/quotations', { params });
      if (res.success) {
        setQuotations(res.data);
        if (res.pagination) {
          setPaginationInfo({
            total: res.pagination.total || res.data.length,
            pages: res.pagination.pages || Math.ceil((res.pagination.total || res.data.length) / pageSize)
          });
        } else {
          setPaginationInfo({ total: res.data.length, pages: 1 });
        }
      }
    } catch (err) {
      showToast(err.message || 'Failed to fetch quotations', 'error');
    } finally {
      setLoading(false);
    }
  };

  const fetchSurveys = async () => {
    try {
      const res = await api.get('/surveys?limit=100');
      if (res.success) {
        setSurveys(res.data);
        const approved = res.data.find(s => s.status === 'approved');
        if (approved) {
          setFormData(prev => ({
            ...prev,
            siteSurveyId: approved._id,
            systemCapacityKw: approved.approvalDetails?.recommendedCapacityKw || 3,
            systemType: approved.approvalDetails?.recommendedSystemType || 'on_grid'
          }));
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchSurveys();
  }, []);

  useEffect(() => {
    fetchQuotations();
  }, [currentPage, pageSize, statusFilter, searchQuery]);

  // Recalculate preview when creating quotation
  useEffect(() => {
    const fetchPreview = async () => {
      try {
        const res = await api.post('/quotations/calculate-preview', {
          capacityKw: formData.systemCapacityKw,
          systemType: formData.systemType
        });
        if (res.success) {
          setPreviewCalc(res.data);
        }
      } catch (err) {
        // quiet error
      }
    };

    fetchPreview();
  }, [formData.systemCapacityKw, formData.systemType]);

  const handleCreateQuotation = async (e) => {
    e.preventDefault();
    try {
      const res = await api.post('/quotations', formData);
      if (res.success) {
        showToast('Quotation generated successfully and equipment BOM calculated!', 'success');
        setShowCreateModal(false);
        fetchQuotations();
      }
    } catch (err) {
      showToast(`Quotation Creation Blocked: ${err.message}`, 'error');
    }
  };

  const openEditModal = (q) => {
    setSelectedQuotation(q);
    setEditForm({
      systemCapacityKw: q.systemCapacityKw || 3,
      systemType: q.systemType || 'on_grid',
      laborCost: q.pricing?.laborCost || 15000,
      discountAmount: q.pricing?.discount || 0,
      validUntil: q.validUntil ? new Date(q.validUntil).toISOString().split('T')[0] : '',
      notes: q.notes || '',
      bom: q.bom ? JSON.parse(JSON.stringify(q.bom)) : []
    });
    setShowEditModal(true);
  };

  const handleUpdateQuotation = async (e) => {
    e.preventDefault();
    if (!selectedQuotation) return;
    try {
      const payload = {
        systemCapacityKw: Number(editForm.systemCapacityKw),
        systemType: editForm.systemType,
        laborCost: Number(editForm.laborCost),
        discountAmount: Number(editForm.discountAmount),
        validUntil: editForm.validUntil,
        notes: editForm.notes,
        customBom: editForm.bom
      };

      const res = await api.put(`/quotations/${selectedQuotation._id}`, payload);
      if (res.success) {
        showToast('Quotation pricing, items, and margins recalculated and saved!', 'success');
        setShowEditModal(false);
        fetchQuotations();
      }
    } catch (err) {
      showToast(`Edit failed: ${err.message}`, 'error');
    }
  };

  const handleApproveQuotation = async (quotationId) => {
    try {
      const res = await api.put(`/quotations/${quotationId}/approve`);
      if (res.success) {
        showToast('Quotation approved! Ready to convert into confirmed project order.', 'success');
        fetchQuotations();
      }
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const handleConvertToOrder = async (quotation) => {
    try {
      const res = await api.post('/orders', {
        quotationId: quotation._id
      });
      if (res.success) {
        showToast(`Order confirmed successfully: ${res.data.orderNumber}`, 'success');
        fetchQuotations();
      }
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="p-5 rounded-2xl glass-card border border-solar-500/20 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-solar-400 text-xs font-semibold uppercase tracking-wider mb-1">
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>Smart Quotation Engine • Rules 1 & 2 Enforced</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
            Quotation <span className="gradient-solar-text">& BOM Calculation</span>
          </h1>
          <p className="text-slate-400 text-xs sm:text-sm mt-0.5">
            Rule 1: Generated only from approved site surveys. Rule 2: Automatic Bill of Materials (BOM) equipment calculation.
          </p>
        </div>

        {(user?.role === 'admin' || user?.role === 'sales') && (
          <Button
            variant="primary"
            size="md"
            leftIcon={<Plus className="w-4 h-4" />}
            onClick={() => setShowCreateModal(true)}
          >
            Generate New Quotation
          </Button>
        )}
      </div>

      {/* Filter & Search Bar */}
      <div className="p-4 rounded-xl glass-card flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 text-xs">
        <div className="flex-1 relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
          <input
            type="text"
            placeholder="Search by Quotation # or customer..."
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
            <option value="draft">Draft</option>
            <option value="sent">Sent to Customer</option>
            <option value="approved">Approved</option>
            <option value="converted">Converted to Order</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>
      </div>

      {/* Quotations List */}
      <div className="rounded-2xl glass-card overflow-hidden border border-slate-800 flex flex-col justify-between">
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <h2 className="text-sm font-bold text-white flex items-center space-x-2">
            <FileSpreadsheet className="w-4 h-4 text-solar-400" />
            <span>Commercial Quotations ({paginationInfo.total})</span>
          </h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-900 text-slate-400 uppercase text-[10px] border-b border-slate-800">
              <tr>
                <th className="py-2.5 px-3">Quotation #</th>
                <th className="py-2.5 px-3">Customer</th>
                <th className="py-2.5 px-3">Capacity & Type</th>
                <th className="py-2.5 px-3">BOM Items</th>
                <th className="py-2.5 px-3">Gross Total</th>
                <th className="py-2.5 px-3">Subsidy</th>
                <th className="py-2.5 px-3">Net Payable</th>
                <th className="py-2.5 px-3">Status</th>
                <th className="py-2.5 px-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-sans">
              {quotations.length === 0 ? (
                <tr>
                  <td colSpan="9" className="text-center py-12 text-slate-500">
                    No quotations found matching your search.
                  </td>
                </tr>
              ) : (
                quotations.map((q) => {
                  const isConverted = q.status === 'converted';
                  const isApproved = q.status === 'approved';

                  return (
                    <tr key={q._id} className="hover:bg-slate-800/30 transition">
                      <td className="py-2.5 px-3 font-mono font-bold text-solar-400">{q.quotationNumber}</td>
                      <td className="py-2.5 px-3 font-semibold text-slate-200">{q.customer?.name || 'Customer'}</td>
                      <td className="py-2.5 px-3 capitalize text-slate-300">
                        {q.systemCapacityKw} kW {q.systemType?.replace('_', ' ')}
                      </td>
                      <td className="py-2.5 px-3 text-slate-400">
                        {q.bom?.length || 0} Components
                      </td>
                      <td className="py-2.5 px-3 font-mono text-slate-300">₹{q.pricing?.grossTotal?.toLocaleString('en-IN')}</td>
                      <td className="py-2.5 px-3 font-mono text-emerald-400">-₹{q.pricing?.estimatedSubsidy?.toLocaleString('en-IN')}</td>
                      <td className="py-2.5 px-3 font-mono font-bold text-white">₹{q.pricing?.netPayable?.toLocaleString('en-IN')}</td>
                      <td className="py-2.5 px-3">
                        <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold uppercase border ${
                          isConverted
                            ? 'bg-purple-500/10 text-purple-400 border-purple-500/30'
                            : isApproved
                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                            : 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                        }`}>
                          {q.status}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-right space-x-1.5 whitespace-nowrap">
                        {/* View & Print */}
                        <button
                          onClick={() => {
                            setSelectedQuotation(q);
                            setShowPrintModal(true);
                          }}
                          className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] font-semibold rounded"
                        >
                          View
                        </button>

                        {/* Admin Edit Action (Requirement 10) */}
                        {!isConverted && (user?.role === 'admin' || user?.role === 'sales') && (
                          <button
                            onClick={() => openEditModal(q)}
                            className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-solar-400 hover:text-solar-300 text-[10px] font-semibold rounded border border-slate-700"
                            title="Edit quotation pricing, items, and margins"
                          >
                            Edit
                          </button>
                        )}

                        {/* Approve Action */}
                        {!isApproved && !isConverted && q.status !== 'rejected' && (user?.role === 'admin' || user?.role === 'sales') && (
                          <button
                            onClick={() => handleApproveQuotation(q._id)}
                            className="px-2.5 py-1 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 text-[10px] font-bold rounded border border-emerald-500/40"
                          >
                            Approve
                          </button>
                        )}

                        {/* Convert to Order Action (Requirement 11) */}
                        {isApproved && !isConverted && (
                          <button
                            onClick={() => handleConvertToOrder(q)}
                            className="px-2.5 py-1 bg-solar-500 hover:bg-solar-400 text-midnight-950 text-[10px] font-bold rounded shadow-sm"
                          >
                            Convert to Order
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

      {/* Requirement 10: Admin Quotation Edit Modal */}
      {showEditModal && selectedQuotation && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="glass-card w-full max-w-2xl rounded-2xl border border-slate-700 p-6 space-y-4 my-8">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white flex items-center space-x-2">
                <Edit className="w-5 h-5 text-solar-400" />
                <span>Edit Quotation #{selectedQuotation.quotationNumber}</span>
              </h3>
              <button onClick={() => setShowEditModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpdateQuotation} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 mb-1 font-semibold">System Capacity (kW)</label>
                  <input
                    type="number"
                    step="0.5"
                    value={editForm.systemCapacityKw}
                    onChange={(e) => setEditForm({ ...editForm, systemCapacityKw: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white font-mono font-bold"
                    required
                  />
                </div>

                <div>
                  <label className="block text-slate-300 mb-1 font-semibold">System Architecture</label>
                  <select
                    value={editForm.systemType}
                    onChange={(e) => setEditForm({ ...editForm, systemType: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white font-bold"
                  >
                    <option value="on_grid">On-Grid (Net Metered)</option>
                    <option value="hybrid">Hybrid (Storage Integrated)</option>
                    <option value="off_grid">Off-Grid Standalone</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-300 mb-1 font-semibold">Labour & Execution Cost (₹)</label>
                  <input
                    type="number"
                    value={editForm.laborCost}
                    onChange={(e) => setEditForm({ ...editForm, laborCost: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white font-mono"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 mb-1 font-semibold">Commercial Discount (₹)</label>
                  <input
                    type="number"
                    value={editForm.discountAmount}
                    onChange={(e) => setEditForm({ ...editForm, discountAmount: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white font-mono"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 mb-1 font-semibold">Quotation Validity Date</label>
                  <input
                    type="date"
                    value={editForm.validUntil}
                    onChange={(e) => setEditForm({ ...editForm, validUntil: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white font-mono"
                  />
                </div>
              </div>

              {/* Editable BOM items */}
              <div>
                <label className="block text-slate-300 mb-2 font-semibold">BOM Components & Quantities</label>
                <div className="max-h-48 overflow-y-auto space-y-2 border border-slate-800 rounded-xl p-2 bg-slate-900/60">
                  {editForm.bom.map((item, idx) => (
                    <div key={idx} className="flex items-center gap-2 text-[11px] p-2 rounded-lg bg-slate-800/60 border border-slate-700/60">
                      <div className="flex-1 truncate">
                        <span className="font-bold text-white block truncate">{item.name}</span>
                        <span className="text-[10px] text-slate-400 capitalize">{item.category}</span>
                      </div>
                      <div className="w-20">
                        <span className="text-[9px] text-slate-500 block">Qty</span>
                        <input
                          type="number"
                          min="1"
                          value={item.quantity}
                          onChange={(e) => {
                            const newBom = [...editForm.bom];
                            newBom[idx].quantity = Number(e.target.value);
                            newBom[idx].totalPrice = newBom[idx].quantity * newBom[idx].unitPrice;
                            setEditForm({ ...editForm, bom: newBom });
                          }}
                          className="w-full px-2 py-1 rounded bg-slate-900 border border-slate-700 text-white font-mono text-center"
                        />
                      </div>
                      <div className="w-24">
                        <span className="text-[9px] text-slate-500 block">Unit (₹)</span>
                        <input
                          type="number"
                          value={item.unitPrice}
                          onChange={(e) => {
                            const newBom = [...editForm.bom];
                            newBom[idx].unitPrice = Number(e.target.value);
                            newBom[idx].totalPrice = newBom[idx].quantity * newBom[idx].unitPrice;
                            setEditForm({ ...editForm, bom: newBom });
                          }}
                          className="w-full px-2 py-1 rounded bg-slate-900 border border-slate-700 text-white font-mono"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-slate-300 mb-1 font-semibold">Quotation Terms & Notes</label>
                <textarea
                  rows="2"
                  value={editForm.notes}
                  onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-2 border-t border-slate-800">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowEditModal(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                >
                  Save & Recalculate Quotation
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Create Quotation */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="glass-card w-full max-w-2xl rounded-2xl border border-slate-700 p-6 space-y-4 my-8">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white flex items-center space-x-2">
                <Calculator className="w-5 h-5 text-solar-400" />
                <span>Generate Smart Solar Quotation</span>
              </h3>
              <button onClick={() => setShowCreateModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateQuotation} className="space-y-4 text-xs">
              {/* Survey Selector */}
              <div>
                <label className="block text-slate-300 mb-1 font-semibold">
                  Select Approved Site Survey (Rule 1 Enforced)
                </label>
                <select
                  value={formData.siteSurveyId}
                  onChange={(e) => {
                    const sel = surveys.find(s => s._id === e.target.value);
                    setFormData({
                      ...formData,
                      siteSurveyId: e.target.value,
                      systemCapacityKw: sel?.approvalDetails?.recommendedCapacityKw || 3,
                      systemType: sel?.approvalDetails?.recommendedSystemType || 'on_grid'
                    });
                  }}
                  className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white font-medium"
                  required
                >
                  <option value="">-- Choose Approved Survey --</option>
                  {surveys.map((s) => (
                    <option
                      key={s._id}
                      value={s._id}
                      disabled={s.status !== 'approved'}
                    >
                      {s.surveyNumber} - {s.customer?.name} ({s.status.toUpperCase()} {s.status !== 'approved' ? '- LOCKED' : '- ELIGIBLE'})
                    </option>
                  ))}
                </select>
                <span className="text-[10px] text-slate-400 mt-1 block">
                  * Unapproved surveys are automatically disabled to prevent premature quotations.
                </span>
              </div>

              {/* Capacity and System Type */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 mb-1 font-semibold">System Capacity (kW)</label>
                  <select
                    value={formData.systemCapacityKw}
                    onChange={(e) => setFormData({ ...formData, systemCapacityKw: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white font-bold"
                  >
                    <option value="1">1 kW Rooftop</option>
                    <option value="2">2 kW Rooftop</option>
                    <option value="3">3 kW Rooftop</option>
                    <option value="4">4 kW Rooftop</option>
                    <option value="5">5 kW Rooftop</option>
                    <option value="7">7.5 kW Rooftop</option>
                    <option value="10">10 kW Rooftop</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 mb-1 font-semibold">Grid Architecture</label>
                  <select
                    value={formData.systemType}
                    onChange={(e) => setFormData({ ...formData, systemType: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white font-bold"
                  >
                    <option value="on_grid">On-Grid (Net Metered)</option>
                    <option value="hybrid">Hybrid (Storage Battery)</option>
                    <option value="off_grid">Off-Grid Standalone</option>
                  </select>
                </div>
              </div>

              {/* Live Preview of Calculated BOM */}
              {previewCalc && (
                <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
                  <span className="text-[10px] font-bold text-solar-400 uppercase tracking-wider block">
                    Automatic BOM Calculation (Rule 2)
                  </span>
                  <div className="grid grid-cols-3 gap-2 font-mono text-[11px]">
                    <div>
                      <span className="text-slate-500 block">Equipment Total</span>
                      <span className="text-white font-bold">₹{previewCalc.pricing?.equipmentTotal?.toLocaleString('en-IN')}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block">Govt Subsidy</span>
                      <span className="text-emerald-400 font-bold">-₹{previewCalc.pricing?.estimatedSubsidy?.toLocaleString('en-IN')}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block">Customer Net</span>
                      <span className="text-solar-400 font-bold">₹{previewCalc.pricing?.netPayable?.toLocaleString('en-IN')}</span>
                    </div>
                  </div>
                </div>
              )}

              <div className="flex justify-end space-x-2 pt-2 border-t border-slate-800">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowCreateModal(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                >
                  Generate Official Quotation
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Enterprise Isolated Print Document Modal */}
      {showPrintModal && selectedQuotation && (
        <PrintDocumentModal
          isOpen={showPrintModal}
          documentData={selectedQuotation}
          documentType="quotation"
          onClose={() => setShowPrintModal(false)}
        />
      )}
    </div>
  );
};

export default QuotationsView;
