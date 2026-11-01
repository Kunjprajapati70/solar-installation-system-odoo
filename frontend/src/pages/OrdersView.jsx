import React, { useState, useEffect } from 'react';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';
import {
  ShoppingBag,
  Truck,
  CheckCircle2,
  Clock,
  ShieldCheck,
  AlertTriangle,
  Boxes,
  QrCode,
  ArrowRight,
  Eye,
  X,
  Search,
  Filter
} from 'lucide-react';
import confetti from 'canvas-confetti';
import Pagination from '../components/ui/Pagination';
import Button from '../components/ui/Button';

const OrdersView = () => {
  const { user } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Modals
  const [showStockModal, setShowStockModal] = useState(false);
  const [stockReport, setStockReport] = useState(null);
  const [showDispatchModal, setShowDispatchModal] = useState(false);
  const [dispatchSerials, setDispatchSerials] = useState('');
  const [availableEquipment, setAvailableEquipment] = useState([]);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const res = await api.get('/orders');
      if (res.success) {
        setOrders(res.data);
      }
    } catch (err) {
      console.error('Fetch orders error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  // Rule 8: Stock Check Before Dispatch
  const handleStockCheck = async (orderId) => {
    try {
      const res = await api.post(`/orders/${orderId}/stock-check`);
      if (res.success) {
        setStockReport(res);
        setShowStockModal(true);
        fetchOrders();
      }
    } catch (err) {
      alert(`Stock check failed: ${err.message}`);
    }
  };

  // Open Dispatch Modal (Fetch available in-stock equipment)
  const openDispatch = async (order) => {
    setSelectedOrder(order);
    try {
      const res = await api.get('/equipment', { params: { status: 'in_stock' } });
      if (res.success) {
        setAvailableEquipment(res.data);
        // Pre-select matching serials
        const panelSerials = res.data.filter(e => e.category === 'panel').slice(0, 2).map(e => e.serialNumber);
        const invSerials = res.data.filter(e => e.category === 'inverter').slice(0, 1).map(e => e.serialNumber);
        setDispatchSerials([...panelSerials, ...invSerials].join(', '));
        setShowDispatchModal(true);
      }
    } catch (err) {
      alert(err.message);
    }
  };

  // Rule 3: Dispatch with Serial Numbers
  const handleDispatch = async (e) => {
    e.preventDefault();
    if (!selectedOrder) return;
    const serialList = dispatchSerials.split(',').map(s => s.trim()).filter(Boolean);
    if (serialList.length === 0) {
      alert('Please enter at least one unique equipment serial number');
      return;
    }

    try {
      const res = await api.post(`/orders/${selectedOrder._id}/dispatch`, {
        serialNumbers: serialList
      });
      if (res.success) {
        alert(res.message);
        setShowDispatchModal(false);
        fetchOrders();
      }
    } catch (err) {
      alert(`Dispatch failed: ${err.message}`);
    }
  };

  // Rule 5: Confirm Delivery & Auto-Activate Warranty
  const handleConfirmDelivery = async (orderId) => {
    const confirmDelivery = window.confirm('Confirm site delivery & rooftop commissioning? This will officially start the equipment warranty clock!');
    if (!confirmDelivery) return;

    try {
      const res = await api.post(`/orders/${orderId}/confirm-delivery`, {
        notes: 'Handover inspection passed. Customer acceptance signed.'
      });
      if (res.success) {
        confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
        alert(res.message);
        fetchOrders();
      }
    } catch (err) {
      alert(`Delivery confirmation failed: ${err.message}`);
    }
  };

  const statusBadges = {
    confirmed: 'bg-sky-500/10 text-sky-400 border-sky-500/30',
    stock_checked: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/30',
    allocated: 'bg-purple-500/10 text-purple-400 border-purple-500/30',
    dispatched: 'bg-amber-500/10 text-amber-400 border-amber-500/30 font-bold',
    in_installation: 'bg-solar-500/10 text-solar-400 border-solar-500/30',
    installed: 'bg-teal-500/10 text-teal-400 border-teal-500/30',
    delivery_confirmed: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30 font-bold',
    completed: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
  };

  const filteredOrders = orders.filter((o) => {
    const matchesSearch =
      !search ||
      (o.orderNumber && o.orderNumber.toLowerCase().includes(search.toLowerCase())) ||
      (o.customer?.name && o.customer.name.toLowerCase().includes(search.toLowerCase())) ||
      (o.systemType && o.systemType.toLowerCase().includes(search.toLowerCase()));
    const matchesStatus = statusFilter === 'all' || o.orderStatus === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const totalPages = Math.ceil(filteredOrders.length / pageSize) || 1;
  const paginatedOrders = filteredOrders.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="p-5 rounded-2xl glass-card border border-solar-500/20 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-solar-400 text-xs font-semibold uppercase tracking-wider mb-1">
            <ShoppingBag className="w-3.5 h-3.5" />
            <span>Order Management • Rules 3, 5 & 8 Enforced</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
            Order Fulfillment <span className="gradient-solar-text">& Delivery Lifecycle</span>
          </h1>
          <p className="text-slate-400 text-xs sm:text-sm mt-0.5">
            Rule 8: Stock check before dispatch • Rule 3: Record serial numbers • Rule 5: Warranty starts on delivery.
          </p>
        </div>

        <div className="flex items-center space-x-2 text-xs">
          <span className="px-3 py-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 font-bold">
            {orders.filter(o => o.orderStatus === 'delivery_confirmed').length} Delivered & Under Warranty
          </span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-3.5 rounded-2xl glass-card border border-slate-800">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            placeholder="Search by order #, customer name, system type..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-900 border border-slate-700/80 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-solar-500"
          />
        </div>

        <div className="flex items-center space-x-2 w-full sm:w-auto">
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="bg-slate-900 border border-slate-700/80 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-solar-500"
          >
            <option value="all">All Order Statuses</option>
            <option value="confirmed">Confirmed</option>
            <option value="stock_checked">Stock Checked</option>
            <option value="allocated">Allocated</option>
            <option value="dispatched">Dispatched</option>
            <option value="in_installation">In Installation</option>
            <option value="installed">Installed</option>
            <option value="delivery_confirmed">Delivery Confirmed (Warranty Active)</option>
            <option value="completed">Completed</option>
          </select>
        </div>
      </div>

      {/* Orders Directory Table */}
      <div className="rounded-2xl glass-card overflow-hidden border border-slate-800">
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <h2 className="text-sm font-bold text-white flex items-center space-x-2">
            <ShoppingBag className="w-4 h-4 text-solar-400" />
            <span>Project Orders ({filteredOrders.length})</span>
          </h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-900 text-slate-400 uppercase text-[10px] border-b border-slate-800">
              <tr>
                <th className="py-2.5 px-3">Order #</th>
                <th className="py-2.5 px-3">Customer</th>
                <th className="py-2.5 px-3">System Specs</th>
                <th className="py-2.5 px-3">Order Total</th>
                <th className="py-2.5 px-3">Balance Due</th>
                <th className="py-2.5 px-3">Status</th>
                <th className="py-2.5 px-3">Warranty Clock</th>
                <th className="py-2.5 px-3 text-right">Lifecycle Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-sans">
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-400">Loading order records...</td>
                </tr>
              ) : paginatedOrders.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-500">No project orders found matching criteria.</td>
                </tr>
              ) : (
                paginatedOrders.map((order) => {
                  const isDelivered = order.orderStatus === 'delivery_confirmed';
                  return (
                    <tr key={order._id} className="hover:bg-slate-800/30 transition">
                      <td className="py-2.5 px-3 font-mono font-bold text-solar-400">{order.orderNumber}</td>
                      <td className="py-2.5 px-3 font-semibold text-slate-200">{order.customer?.name}</td>
                      <td className="py-2.5 px-3 text-slate-300 capitalize">
                        {order.systemCapacityKw} kW {order.systemType?.replace('_', ' ')}
                      </td>
                      <td className="py-2.5 px-3 font-mono font-bold text-white">
                        ₹{order.totalAmount?.toLocaleString('en-IN')}
                      </td>
                      <td className="py-2.5 px-3 font-mono text-amber-400 font-semibold">
                        ₹{order.balanceAmount?.toLocaleString('en-IN')}
                      </td>
                      <td className="py-2.5 px-3">
                        <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold uppercase border ${statusBadges[order.orderStatus] || 'bg-slate-800 text-slate-300'}`}>
                          {order.orderStatus?.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="py-2.5 px-3">
                        {isDelivered ? (
                          <span className="text-emerald-400 text-[11px] font-bold flex items-center">
                            <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> Active
                          </span>
                        ) : (
                          <span className="text-slate-500 text-[10px] italic">
                            Awaiting Delivery
                          </span>
                        )}
                      </td>
                      <td className="py-2.5 px-3 text-right space-x-1.5">
                        {/* Step 1: Stock Check (Rule 8) */}
                        {order.orderStatus === 'confirmed' && (
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => handleStockCheck(order._id)}
                            title="Rule 8: Verify stock levels prior to dispatch"
                          >
                            Check Stock
                          </Button>
                        )}

                        {/* Step 2: Record Serials & Dispatch (Rule 3) */}
                        {(order.orderStatus === 'confirmed' || order.orderStatus === 'stock_checked') && (
                          <Button
                            variant="primary"
                            size="sm"
                            onClick={() => openDispatch(order)}
                            title="Rule 3: Record serialized equipment numbers for dispatch"
                          >
                            Dispatch & Serials
                          </Button>
                        )}

                        {/* Step 3: Confirm Delivery & Activate Warranty (Rule 5) */}
                        {!isDelivered && (order.orderStatus === 'installed' || order.orderStatus === 'dispatched') && (
                          <Button
                            variant="success"
                            size="sm"
                            onClick={() => handleConfirmDelivery(order._id)}
                            title="Rule 5: Confirm Delivery to officially start equipment warranties"
                          >
                            Confirm Delivery
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

        {totalPages > 1 && (
          <div className="p-3 border-t border-slate-800">
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={(page) => setCurrentPage(page)}
              totalItems={filteredOrders.length}
              pageSize={pageSize}
              onPageSizeChange={(newSize) => {
                setPageSize(newSize);
                setCurrentPage(1);
              }}
            />
          </div>
        )}
      </div>

      {/* Stock Check Modal (Rule 8) */}
      {showStockModal && stockReport && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="glass-card w-full max-w-lg rounded-2xl border border-slate-700 p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <h3 className="text-base font-bold text-white flex items-center space-x-2">
                <Boxes className="w-5 h-5 text-indigo-400" />
                <span>Rule 8: Inventory Stock Verification Report</span>
              </h3>
              <button onClick={() => setShowStockModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className={`p-3 rounded-xl border text-xs font-semibold ${
              stockReport.allInStock
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
            }`}>
              {stockReport.message}
            </div>

            <div className="space-y-1.5 max-h-56 overflow-y-auto">
              {stockReport.stockReport?.map((item, idx) => (
                <div key={idx} className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-between text-xs">
                  <div>
                    <p className="font-semibold text-slate-200">{item.itemName}</p>
                    <span className="text-[10px] text-slate-400 uppercase">{item.category}</span>
                  </div>
                  <div className="text-right font-mono text-[11px]">
                    <span className="text-slate-400">Required: {item.requiredQty}</span>
                    <span className={`ml-3 font-bold ${item.status === 'sufficient' ? 'text-emerald-400' : 'text-rose-400'}`}>
                      Available: {item.availableQty}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex justify-end pt-2 border-t border-slate-800">
              <button
                onClick={() => setShowStockModal(false)}
                className="px-4 py-2 bg-slate-800 text-slate-200 font-bold text-xs rounded-lg"
              >
                Close Report
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Dispatch & Serial Number Recording Modal (Rule 3) */}
      {showDispatchModal && selectedOrder && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="glass-card w-full max-w-lg rounded-2xl border border-slate-700 p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <h3 className="text-base font-bold text-white flex items-center space-x-2">
                <Truck className="w-5 h-5 text-amber-400" />
                <span>Rule 3: Dispatch & Equipment Serial Registration</span>
              </h3>
              <button onClick={() => setShowDispatchModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-400">
              Dispatching order <strong className="text-white">{selectedOrder.orderNumber}</strong> to customer{' '}
              <strong className="text-white">{selectedOrder.customer?.name}</strong>. Enter or verify the unique serial numbers for panels, inverter, and battery below:
            </p>

            <form onSubmit={handleDispatch} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-400 mb-1">Serial Numbers (Comma-separated)</label>
                <textarea
                  rows="3"
                  value={dispatchSerials}
                  onChange={(e) => setDispatchSerials(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white font-mono uppercase"
                  placeholder="e.g. SP-PNL-2026-00001, SP-INV-2026-00001"
                  required
                />
              </div>

              {/* In-Stock Suggestion Chips */}
              <div>
                <span className="text-[10px] text-slate-500 uppercase block mb-1">Available In-Stock Serials (Click to Add):</span>
                <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto">
                  {availableEquipment.slice(0, 10).map((eq) => (
                    <button
                      type="button"
                      key={eq._id}
                      onClick={() => {
                        if (!dispatchSerials.includes(eq.serialNumber)) {
                          setDispatchSerials(prev => prev ? `${prev}, ${eq.serialNumber}` : eq.serialNumber);
                        }
                      }}
                      className="px-2 py-0.5 rounded bg-slate-900 border border-slate-700 text-solar-400 text-[10px] font-mono hover:bg-slate-800"
                    >
                      + {eq.serialNumber}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex justify-end space-x-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowDispatchModal(false)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 rounded-lg hover:bg-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-midnight-950 font-bold rounded-lg shadow-glow-solar"
                >
                  Confirm Dispatch & Record Serials
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrdersView;
