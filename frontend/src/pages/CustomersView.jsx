import React, { useState, useEffect } from 'react';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';
import {
  Users,
  Search,
  MapPin,
  Phone,
  Mail,
  Zap,
  Building2,
  Eye,
  Plus,
  ShieldCheck,
  Edit2,
  FileSpreadsheet,
  Receipt,
  Hammer,
  LifeBuoy,
  X,
  Filter,
  ArrowUpDown
} from 'lucide-react';
import Pagination from '../components/ui/Pagination';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import { SkeletonCard } from '../components/ui/SkeletonLoader';

const CustomersView = () => {
  const { user } = useAuth();
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [connectionFilter, setConnectionFilter] = useState('');
  const [sortBy, setSortBy] = useState('code'); // code, name, load
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Selected Customer Details Modal State
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [customerSummary, setCustomerSummary] = useState(null);
  const [activeTab, setActiveTab] = useState('overview'); // overview, quotes, payments, installations, service

  // Customer Form Modal State (Add / Edit)
  const [showFormModal, setShowFormModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [customerForm, setCustomerForm] = useState({
    name: '',
    email: '',
    phone: '',
      connectionType: 'on_grid',
      sanctionedLoadKw: 3,
      consumerNumber: '',
      discomName: 'Gujarat Urja Vikas Nigam (UGVCL)',
      currentPhase: 'single',
    installationAddress: {
      street: '',
      city: 'Ahmedabad',
      state: 'Gujarat',
      pincode: '380015'
    }
  });

  const fetchCustomers = async () => {
    try {
      setLoading(true);
      const params = {};
      if (search) params.search = search;
      if (connectionFilter) params.connectionType = connectionFilter;

      params.limit = 500;
      const res = await api.get('/customers', { params });
      if (res.success) {
        setCustomers(Array.isArray(res.data) ? res.data : []);
      }
    } catch (err) {
      console.error('Fetch customers error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, [connectionFilter]);

  const handleSelectCustomer = async (cust) => {
    setSelectedCustomer(cust);
    setActiveTab('overview');
    try {
      const res = await api.get(`/customers/${cust._id}/summary`);
      if (res.success) {
        setCustomerSummary(res.data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleOpenAddModal = () => {
    setIsEditing(false);
    setCustomerForm({
      name: '',
      email: '',
      phone: '',
      connectionType: 'on_grid',
      sanctionedLoadKw: 3,
      consumerNumber: `CNS-${Math.floor(100000 + Math.random() * 900000)}`,
      discomName: 'Gujarat Urja Vikas Nigam (UGVCL)',
      currentPhase: 'single',
      installationAddress: {
        street: '',
        city: 'Ahmedabad',
        state: 'Gujarat',
        pincode: '380015'
      }
    });
    setShowFormModal(true);
  };

  const handleOpenEditModal = (cust, e) => {
    e.stopPropagation();
    setIsEditing(true);
    setSelectedCustomer(cust);
    setCustomerForm({
      name: cust.name,
      email: cust.email || '',
      phone: cust.phone || '',
      connectionType: cust.connectionType || 'on_grid',
      sanctionedLoadKw: cust.sanctionedLoadKw || 3,
      consumerNumber: cust.consumerNumber || '',
      discomName: cust.discomName || 'UGVCL',
      currentPhase: cust.currentPhase === 3 || cust.currentPhase === 'three' ? 'three' : 'single',
      installationAddress: {
        street: cust.installationAddress?.street || '',
        city: cust.installationAddress?.city || 'Ahmedabad',
        state: cust.installationAddress?.state || 'Gujarat',
        pincode: cust.installationAddress?.pincode || '380015'
      }
    });
    setShowFormModal(true);
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    try {
      if (isEditing && selectedCustomer) {
        const res = await api.put(`/customers/${selectedCustomer._id}`, customerForm);
        if (res.success) {
          alert('Customer record updated successfully!');
          setShowFormModal(false);
          fetchCustomers();
        }
      } else {
        const res = await api.post('/customers', customerForm);
        if (res.success) {
          alert('New customer registered successfully!');
          setShowFormModal(false);
          fetchCustomers();
        }
      }
    } catch (err) {
      alert(`Operation failed: ${err.message}`);
    }
  };

  // Sorting logic
  const sortedCustomers = [...customers].sort((a, b) => {
    if (sortBy === 'name') return a.name.localeCompare(b.name);
    if (sortBy === 'load') return (b.sanctionedLoadKw || 0) - (a.sanctionedLoadKw || 0);
    return (a.customerCode || '').localeCompare(b.customerCode || '');
  });

  // Pagination logic
  const totalItems = sortedCustomers.length;
  const totalPages = Math.ceil(totalItems / pageSize) || 1;
  const paginatedCustomers = sortedCustomers.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  return (
    <div className="space-y-6">
      {/* 1. Header with CRM stats & Add Customer CTA */}
      <div className="p-5 rounded-3xl glass-card border border-solar-500/20 bg-gradient-to-r from-midnight-900 via-midnight-850 to-midnight-900 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-solar-400 text-xs font-semibold uppercase tracking-wider mb-1">
            <Users className="w-3.5 h-3.5" />
            <span>Customer Management & Rooftop Portfolio</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
            Customer <span className="gradient-solar-text">Directory & Accounts</span>
          </h1>
          <p className="text-slate-400 text-xs sm:text-sm mt-0.5">
            Manage consumer records, DISCOM meters, project quotations, payments, and active warranties.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {(user?.role === 'admin' || user?.role === 'sales') && (
            <Button
              variant="primary"
              onClick={handleOpenAddModal}
              className="text-xs flex items-center space-x-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>Add Customer</span>
            </Button>
          )}

          <span className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-700 text-xs font-mono text-slate-300">
            Total: <strong className="text-solar-400">{customers.length}</strong>
          </span>
        </div>
      </div>

      {/* 2. Search, Connection Filter & Sort Controls */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-3 p-3.5 rounded-2xl glass-card border border-slate-800">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            fetchCustomers();
          }}
          className="relative flex-1 w-full"
        >
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            placeholder="Search by customer name, code (CUST-2026-...), phone, or city..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-900 border border-slate-700/80 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-solar-500"
          />
        </form>

        <div className="flex items-center space-x-2 w-full md:w-auto">
          {/* Connection Filter */}
          <select
            value={connectionFilter}
            onChange={(e) => {
              setConnectionFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="bg-slate-900 border border-slate-700/80 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-solar-500"
          >
            <option value="">All Grid Connections</option>
            <option value="on_grid">On-Grid</option>
            <option value="hybrid">Hybrid</option>
            <option value="off_grid">Off-Grid</option>
          </select>

          {/* Sort By */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="bg-slate-900 border border-slate-700/80 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-solar-500"
          >
            <option value="code">Sort by Code</option>
            <option value="name">Sort by Name</option>
            <option value="load">Sort by Sanctioned Load</option>
          </select>
        </div>
      </div>

      {/* 3. Customer Cards Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      ) : paginatedCustomers.length === 0 ? (
        <div className="p-12 text-center rounded-2xl glass-card border border-slate-800 text-slate-400 space-y-2">
          <Users className="w-10 h-10 text-slate-600 mx-auto" />
          <p className="text-sm font-bold text-white">No customers matching your criteria</p>
          <p className="text-xs text-slate-500">Try modifying your search query or connection filter</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {paginatedCustomers.map((cust) => (
            <div
              key={cust._id}
              onClick={() => handleSelectCustomer(cust)}
              className="p-5 rounded-2xl glass-card border border-slate-800 hover:border-slate-700 cursor-pointer transition space-y-3 group hover:shadow-glow-solar"
            >
              <div className="flex items-center justify-between">
                <span className="font-mono text-solar-400 font-bold text-xs">{cust.customerCode}</span>
                <div className="flex items-center space-x-1.5">
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-slate-800 text-slate-300 border border-slate-700">
                    {cust.connectionType?.replace('_', ' ')}
                  </span>
                  {(user?.role === 'admin' || user?.role === 'sales') && (
                    <button
                      onClick={(e) => handleOpenEditModal(cust, e)}
                      className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition"
                      title="Edit Customer Details"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>

              <div>
                <h3 className="font-bold text-white text-sm group-hover:text-solar-400 transition">
                  {cust.name}
                </h3>
                <p className="text-xs text-slate-400 flex items-center mt-1">
                  <MapPin className="w-3.5 h-3.5 mr-1 text-slate-500 shrink-0" />
                  <span>
                    {cust.installationAddress?.street ? `${cust.installationAddress.street}, ` : ''}
                    {cust.installationAddress?.city || 'City'}
                  </span>
                </p>
              </div>

              <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 space-y-1 font-mono text-[11px] text-slate-300">
                <div className="flex justify-between">
                  <span className="text-slate-500">Consumer #:</span>
                  <span className="font-bold">{cust.consumerNumber}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">DISCOM:</span>
                  <span className="truncate max-w-[150px]">{cust.discomName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Sanctioned Load:</span>
                  <span className="text-emerald-400 font-bold">{cust.sanctionedLoadKw} kW ({cust.currentPhase} Phase)</span>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400 font-mono">
                <span className="flex items-center">
                  <Phone className="w-3 h-3 mr-1" />
                  {cust.phone}
                </span>
                <span className="text-solar-400 text-[11px] font-sans font-semibold group-hover:translate-x-0.5 transition">
                  Inspect Portfolio →
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={(page) => setCurrentPage(page)}
          totalItems={totalItems}
          pageSize={pageSize}
          onPageSizeChange={(newSize) => {
            setPageSize(newSize);
            setCurrentPage(1);
          }}
        />
      )}

      {/* 4. Customer Detailed Portfolio Modal (Quotations, Payments, Installations, Warranties, Tickets) */}
      {selectedCustomer && customerSummary && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="glass-card w-full max-w-3xl rounded-3xl border border-slate-700 p-6 space-y-4 my-8 shadow-2xl">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <div className="flex items-center space-x-2">
                  <span className="font-mono text-solar-400 text-xs font-bold">{selectedCustomer.customerCode}</span>
                  <span className="px-2 py-0.5 rounded text-[10px] uppercase font-bold bg-slate-800 text-slate-300">
                    {selectedCustomer.connectionType}
                  </span>
                </div>
                <h3 className="text-lg font-bold text-white mt-0.5">{selectedCustomer.name}</h3>
                <p className="text-xs text-slate-400">
                  {selectedCustomer.installationAddress?.street}, {selectedCustomer.installationAddress?.city}, {selectedCustomer.installationAddress?.state} - {selectedCustomer.installationAddress?.pincode}
                </p>
              </div>
              <button
                onClick={() => setSelectedCustomer(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Navigation Tabs */}
            <div className="flex items-center space-x-1 border-b border-slate-800 pb-2 overflow-x-auto text-xs">
              <button
                onClick={() => setActiveTab('overview')}
                className={`px-3 py-1.5 rounded-lg font-medium transition ${
                  activeTab === 'overview'
                    ? 'bg-solar-500/15 text-solar-400 border border-solar-500/30'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Overview & DISCOM
              </button>
              <button
                onClick={() => setActiveTab('quotes')}
                className={`px-3 py-1.5 rounded-lg font-medium transition ${
                  activeTab === 'quotes'
                    ? 'bg-solar-500/15 text-solar-400 border border-solar-500/30'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Quotations ({customerSummary.quotations?.length || 0})
              </button>
              <button
                onClick={() => setActiveTab('orders')}
                className={`px-3 py-1.5 rounded-lg font-medium transition ${
                  activeTab === 'orders'
                    ? 'bg-solar-500/15 text-solar-400 border border-solar-500/30'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Orders ({customerSummary.orders?.length || 0})
              </button>
              <button
                onClick={() => setActiveTab('installations')}
                className={`px-3 py-1.5 rounded-lg font-medium transition ${
                  activeTab === 'installations'
                    ? 'bg-solar-500/15 text-solar-400 border border-solar-500/30'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Installations ({customerSummary.installations?.length || 0})
              </button>
              <button
                onClick={() => setActiveTab('payments')}
                className={`px-3 py-1.5 rounded-lg font-medium transition ${
                  activeTab === 'payments'
                    ? 'bg-solar-500/15 text-solar-400 border border-solar-500/30'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Payments ({customerSummary.payments?.length || 0})
              </button>
              <button
                onClick={() => setActiveTab('warranties')}
                className={`px-3 py-1.5 rounded-lg font-medium transition ${
                  activeTab === 'warranties'
                    ? 'bg-solar-500/15 text-solar-400 border border-solar-500/30'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Warranties ({customerSummary.warranties?.length || 0})
              </button>
              <button
                onClick={() => setActiveTab('service')}
                className={`px-3 py-1.5 rounded-lg font-medium transition ${
                  activeTab === 'service'
                    ? 'bg-solar-500/15 text-solar-400 border border-solar-500/30'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Service History ({customerSummary.tickets?.length || 0})
              </button>
            </div>

            {/* Tab 1: Overview & Grid Parameters */}
            {activeTab === 'overview' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
                  <h4 className="font-bold text-white uppercase text-[11px] tracking-wider text-solar-400">
                    DISCOM & Grid Connection
                  </h4>
                  <div className="space-y-1.5 font-mono text-slate-300">
                    <p><span className="text-slate-500">Consumer Number:</span> {selectedCustomer.consumerNumber}</p>
                    <p><span className="text-slate-500">DISCOM Provider:</span> {selectedCustomer.discomName}</p>
                    <p><span className="text-slate-500">Sanctioned Load:</span> {selectedCustomer.sanctionedLoadKw} kW</p>
                    <p><span className="text-slate-500">Grid Phase:</span> {selectedCustomer.currentPhase} Phase</p>
                    <p><span className="text-slate-500">Tariff Category:</span> {selectedCustomer.tariffCategory || 'LT-Residential'}</p>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
                  <h4 className="font-bold text-white uppercase text-[11px] tracking-wider text-solar-400">
                    Contact & Communication
                  </h4>
                  <div className="space-y-1.5 text-slate-300">
                    <p><span className="text-slate-500">Phone:</span> <span className="font-mono">{selectedCustomer.phone}</span></p>
                    <p><span className="text-slate-500">Email:</span> <span className="font-mono">{selectedCustomer.email || 'N/A'}</span></p>
                    <p><span className="text-slate-500">Joined:</span> {new Date(selectedCustomer.createdAt).toLocaleDateString()}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Tab 2: Quotations */}
            {activeTab === 'quotes' && (
              <div className="space-y-2 text-xs">
                {customerSummary.quotations?.length === 0 ? (
                  <p className="text-slate-500 text-center py-6">No quotations generated yet for this customer.</p>
                ) : (
                  customerSummary.quotations?.map((q) => (
                    <div key={q._id} className="p-3 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between font-mono">
                      <div>
                        <span className="font-bold text-white">{q.quotationNumber}</span>
                        <p className="text-[11px] text-slate-400">{q.systemCapacityKw} kW • {q.systemType}</p>
                      </div>
                      <div className="text-right">
                        <span className="text-solar-400 font-bold text-sm">₹{q.totalAmount?.toLocaleString('en-IN')}</span>
                        <p className="text-[10px] text-emerald-400 uppercase font-semibold">{q.status}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* Tab 3: Orders */}
            {activeTab === 'orders' && (
              <div className="space-y-2 text-xs">
                {customerSummary.orders?.length === 0 ? (
                  <p className="text-slate-500 text-center py-6">No active contracts found.</p>
                ) : (
                  customerSummary.orders?.map((o) => (
                    <div key={o._id} className="p-3 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between font-mono">
                      <div>
                        <span className="font-bold text-white">{o.orderNumber}</span>
                        <p className="text-[11px] text-slate-400">{o.systemCapacityKw} kW • Delivery status: {o.deliveryStatus}</p>
                      </div>
                      <div className="text-right">
                        <span className="text-solar-400 font-bold">₹{o.totalAmount?.toLocaleString('en-IN')}</span>
                        <p className="text-[10px] text-emerald-400 uppercase font-bold">{o.status}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* Tab 4: Installations Details */}
            {activeTab === 'installations' && (
              <div className="space-y-2 text-xs">
                {customerSummary.installations?.length === 0 ? (
                  <p className="text-slate-500 text-center py-6">No installation jobs recorded.</p>
                ) : (
                  customerSummary.installations?.map((inst) => (
                    <div key={inst._id} className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
                      <div className="flex items-center justify-between font-mono">
                        <span className="font-bold text-white">{inst.installationNumber}</span>
                        <span className="text-emerald-400 uppercase font-bold text-[10px] px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/30">
                          {inst.status}
                        </span>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-300 font-mono">
                        <p>Lead Tech: <strong className="text-white">{inst.leadTechnician?.name || 'Assigned'}</strong></p>
                        <p>Hours: <strong className="text-white">{inst.totalWorkingHours || 0} hrs</strong></p>
                        <p>Voc: <strong className="text-solar-400">{inst.testingResults?.vocVolts || 240} V</strong></p>
                        <p>Earthing: <strong className="text-emerald-400">{inst.testingResults?.earthingResistanceOhms || 1.8} Ω</strong></p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* Tab 5: Payments */}
            {activeTab === 'payments' && (
              <div className="space-y-2 text-xs">
                {customerSummary.payments?.length === 0 ? (
                  <p className="text-slate-500 text-center py-6">No payment records found.</p>
                ) : (
                  customerSummary.payments?.map((p) => (
                    <div key={p._id} className="p-3 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between font-mono">
                      <div>
                        <span className="font-bold text-white">{p.receiptNumber}</span>
                        <p className="text-[11px] text-slate-400">{p.paymentStage?.replace('_', ' ')} • {p.paymentMode}</p>
                      </div>
                      <div className="text-right">
                        <span className="text-emerald-400 font-bold text-sm">₹{p.amount?.toLocaleString('en-IN')}</span>
                        <p className="text-[10px] text-slate-500">{new Date(p.paidAt || p.createdAt).toLocaleDateString()}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* Tab 6: Warranties */}
            {activeTab === 'warranties' && (
              <div className="space-y-2 text-xs">
                {customerSummary.warranties?.length === 0 ? (
                  <p className="text-slate-500 text-center py-6">No warranties issued yet (issued upon confirmed delivery).</p>
                ) : (
                  customerSummary.warranties?.map((w) => (
                    <div key={w._id} className="p-3 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between font-mono">
                      <div>
                        <span className="font-bold text-white">{w.serialNumber}</span>
                        <p className="text-[11px] text-slate-400 capitalize">{w.category} ({w.durationYears} Years Coverage)</p>
                      </div>
                      <div className="text-right">
                        <span className="text-emerald-400 text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/30 uppercase">
                          {w.status}
                        </span>
                        <p className="text-[10px] text-slate-400 mt-1">Exp: {new Date(w.expiryDate).toLocaleDateString()}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* Tab 7: Service History */}
            {activeTab === 'service' && (
              <div className="space-y-2 text-xs">
                {customerSummary.tickets?.length === 0 ? (
                  <p className="text-slate-500 text-center py-6">No service tickets or complaints lodged.</p>
                ) : (
                  customerSummary.tickets?.map((t) => (
                    <div key={t._id} className="p-3 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between font-mono">
                      <div>
                        <span className="font-bold text-white">{t.ticketNumber} - {t.title}</span>
                        <p className="text-[11px] text-slate-400 font-sans">{t.issueCategory} • {t.isWarrantyEligible ? '₹0 In-Warranty' : 'Out-of-Warranty'}</p>
                      </div>
                      <div className="text-right">
                        <span className="text-amber-400 uppercase font-bold text-[10px]">{t.status}</span>
                        <p className="text-[10px] text-slate-500">{new Date(t.createdAt).toLocaleDateString()}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* Modal Footer */}
            <div className="flex justify-end pt-3 border-t border-slate-800">
              <Button variant="secondary" size="sm" onClick={() => setSelectedCustomer(null)}>
                Close Portfolio
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* 5. Add / Edit Customer Form Modal */}
      {showFormModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="glass-card w-full max-w-xl rounded-3xl border border-slate-700 p-6 space-y-4 my-8 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white">
                {isEditing ? `Edit Customer Details: ${selectedCustomer?.name}` : 'Register New Customer Account'}
              </h3>
              <button onClick={() => setShowFormModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleFormSubmit} className="space-y-3.5 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Full Name</label>
                  <input
                    type="text"
                    required
                    value={customerForm.name}
                    onChange={(e) => setCustomerForm({ ...customerForm, name: e.target.value })}
                    placeholder="e.g. Ramesh Patel"
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white focus:outline-none focus:border-solar-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Mobile Phone</label>
                  <input
                    type="text"
                    required
                    value={customerForm.phone}
                    onChange={(e) => setCustomerForm({ ...customerForm, phone: e.target.value })}
                    placeholder="+91 98765 43210"
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white focus:outline-none focus:border-solar-500 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Email Address</label>
                  <input
                    type="email"
                    value={customerForm.email}
                    onChange={(e) => setCustomerForm({ ...customerForm, email: e.target.value })}
                    placeholder="customer@gmail.com"
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white focus:outline-none focus:border-solar-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Connection Type</label>
                  <select
                    value={customerForm.connectionType}
                    onChange={(e) => setCustomerForm({ ...customerForm, connectionType: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white focus:outline-none focus:border-solar-500"
                  >
                    <option value="on_grid">On-Grid</option>
                    <option value="hybrid">Hybrid</option>
                    <option value="off_grid">Off-Grid</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Consumer Number</label>
                  <input
                    type="text"
                    required
                    value={customerForm.consumerNumber}
                    onChange={(e) => setCustomerForm({ ...customerForm, consumerNumber: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white focus:outline-none focus:border-solar-500 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Sanctioned Load (kW)</label>
                  <input
                    type="number"
                    min="1"
                    max="100"
                    value={customerForm.sanctionedLoadKw}
                    onChange={(e) => setCustomerForm({ ...customerForm, sanctionedLoadKw: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white focus:outline-none focus:border-solar-500 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Current Phase</label>
                  <select
                    value={customerForm.currentPhase}
                    onChange={(e) => setCustomerForm({ ...customerForm, currentPhase: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white focus:outline-none focus:border-solar-500 font-mono"
                  >
                    <option value="single">Single Phase</option>
                    <option value="three">Three Phase</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Street Address</label>
                  <input
                    type="text"
                    value={customerForm.installationAddress.street}
                    onChange={(e) => setCustomerForm({
                      ...customerForm,
                      installationAddress: { ...customerForm.installationAddress, street: e.target.value }
                    })}
                    placeholder="Plot 12, Green Park"
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white focus:outline-none focus:border-solar-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">City</label>
                  <input
                    type="text"
                    value={customerForm.installationAddress.city}
                    onChange={(e) => setCustomerForm({
                      ...customerForm,
                      installationAddress: { ...customerForm.installationAddress, city: e.target.value }
                    })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white focus:outline-none focus:border-solar-500"
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-2 pt-3 border-t border-slate-800">
                <Button variant="secondary" size="sm" type="button" onClick={() => setShowFormModal(false)}>
                  Cancel
                </Button>
                <Button variant="primary" size="sm" type="submit">
                  {isEditing ? 'Save Changes' : 'Create Customer'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default CustomersView;
