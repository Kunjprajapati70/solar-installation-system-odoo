import React, { useState, useEffect } from 'react';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import {
  Boxes,
  AlertTriangle,
  Plus,
  RefreshCw,
  Search,
  CheckCircle2,
  Package,
  Layers,
  ArrowUpRight,
  X,
  Edit,
  Filter,
  DollarSign,
  ShieldCheck,
  Building,
  Activity
} from 'lucide-react';
import Button from '../components/ui/Button';
import Pagination from '../components/ui/Pagination';

const InventoryView = () => {
  const { user } = useAuth();
  const { showToast } = useToast();

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modals
  const [selectedItem, setSelectedItem] = useState(null);
  const [showRestockModal, setShowRestockModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Forms
  const [restockQty, setRestockQty] = useState(20);
  const [editForm, setEditForm] = useState({
    equipmentName: '',
    category: 'panel',
    brand: '',
    model: '',
    description: '',
    purchasePrice: 0,
    sellingPrice: 0,
    availableQuantity: 0,
    minimumStock: 5,
    warrantyDurationMonths: 24,
    supplier: '',
    isActive: true
  });

  // Filters & Pagination
  const [filterCategory, setFilterCategory] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [lowStockOnly, setLowStockOnly] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(12);
  const [paginationInfo, setPaginationInfo] = useState({ total: 0, pages: 1 });

  const fetchInventory = async () => {
    try {
      setLoading(true);
      const params = {
        page: currentPage,
        limit: pageSize
      };
      if (filterCategory) params.category = filterCategory;
      if (searchQuery) params.search = searchQuery;
      if (lowStockOnly) params.lowStock = 'true';

      const res = await api.get('/inventory', { params });
      if (res.success) {
        setItems(res.data);
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
      showToast(err.message || 'Fetch inventory error', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInventory();
  }, [currentPage, pageSize, filterCategory, searchQuery, lowStockOnly]);

  const handleRestock = async (e) => {
    e.preventDefault();
    if (!selectedItem) return;
    try {
      const res = await api.post(`/inventory/${selectedItem._id}/restock`, {
        quantity: Number(restockQty)
      });
      if (res.success) {
        showToast(res.message || 'Inventory replenished successfully', 'success');
        setShowRestockModal(false);
        fetchInventory();
      }
    } catch (err) {
      showToast(`Restock failed: ${err.message}`, 'error');
    }
  };

  const openEditModal = (item) => {
    setSelectedItem(item);
    setEditForm({
      equipmentName: item.equipmentName || '',
      category: item.category || 'panel',
      brand: item.brand || '',
      model: item.model || '',
      description: item.description || '',
      purchasePrice: item.purchasePrice || 0,
      sellingPrice: item.sellingPrice || 0,
      availableQuantity: item.availableQuantity || 0,
      minimumStock: item.minimumStock || 5,
      warrantyDurationMonths: item.warrantyDurationMonths || 24,
      supplier: item.supplier || '',
      isActive: item.isActive !== undefined ? item.isActive : true
    });
    setShowEditModal(true);
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    if (!selectedItem) return;
    try {
      const res = await api.put(`/inventory/${selectedItem._id}`, editForm);
      if (res.success) {
        showToast('Inventory SKU updated successfully!', 'success');
        setShowEditModal(false);
        fetchInventory();
      }
    } catch (err) {
      showToast(`Update error: ${err.message}`, 'error');
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      const res = await api.post('/inventory', editForm);
      if (res.success) {
        showToast('New SKU added to catalog!', 'success');
        setShowCreateModal(false);
        fetchInventory();
      }
    } catch (err) {
      showToast(`Create error: ${err.message}`, 'error');
    }
  };

  const categoryBadges = {
    panel: 'bg-solar-500/10 text-solar-400 border-solar-500/30',
    inverter: 'bg-sky-500/10 text-sky-400 border-sky-500/30',
    battery: 'bg-purple-500/10 text-purple-400 border-purple-500/30',
    structure: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
    cables: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/30',
    accessories: 'bg-slate-500/10 text-slate-400 border-slate-500/30'
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="p-5 rounded-2xl glass-card border border-solar-500/20 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-solar-400 text-xs font-semibold uppercase tracking-wider mb-1">
            <Boxes className="w-3.5 h-3.5" />
            <span>Warehouse Inventory & Reorder Management</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
            Inventory <span className="gradient-solar-text">& Stock Control</span>
          </h1>
          <p className="text-slate-400 text-xs sm:text-sm mt-0.5">
            Real-time tracking of PV modules, smart inverters, lithium batteries, and HDG structures.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setLowStockOnly(!lowStockOnly)}
            className={`px-3 py-2 rounded-xl text-xs font-semibold border transition ${
              lowStockOnly
                ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5 inline mr-1 text-amber-400" />
            <span>{lowStockOnly ? 'Showing Low Stock Only' : 'Filter Low Stock'}</span>
          </button>

          {user?.role === 'admin' && (
            <Button
              variant="primary"
              size="md"
              leftIcon={<Plus className="w-4 h-4" />}
              onClick={() => {
                setEditForm({
                  equipmentName: '',
                  category: 'panel',
                  brand: '',
                  model: '',
                  description: '',
                  purchasePrice: 0,
                  sellingPrice: 0,
                  availableQuantity: 50,
                  minimumStock: 10,
                  warrantyDurationMonths: 24,
                  supplier: '',
                  isActive: true
                });
                setShowCreateModal(true);
              }}
            >
              Add New SKU
            </Button>
          )}
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="p-4 rounded-xl glass-card flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 text-xs">
        <div className="flex-1 relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
          <input
            type="text"
            placeholder="Search by SKU name, brand, or model..."
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
            value={filterCategory}
            onChange={(e) => {
              setFilterCategory(e.target.value);
              setCurrentPage(1);
            }}
            className="px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white font-medium focus:outline-none focus:border-solar-500"
          >
            <option value="">All Categories</option>
            <option value="panel">Solar Panels</option>
            <option value="inverter">Inverters</option>
            <option value="battery">Battery Storage</option>
            <option value="structure">Mounting Structure</option>
            <option value="cables">DC/AC Cables</option>
            <option value="accessories">Switchgear & Protection</option>
          </select>
        </div>
      </div>

      {/* Inventory Items Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {items.length === 0 ? (
          <div className="col-span-full py-16 text-center text-slate-500 glass-card rounded-2xl">
            <Boxes className="w-12 h-12 mx-auto mb-2 text-slate-600" />
            <p>No inventory items match your current filter.</p>
          </div>
        ) : (
          items.map((item) => {
            const isLowStock = item.availableQuantity <= item.minimumStock;
            return (
              <div
                key={item._id}
                className={`p-4 rounded-2xl glass-card border flex flex-col justify-between transition ${
                  isLowStock ? 'border-rose-500/40 bg-rose-500/5' : 'border-slate-800'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase border ${categoryBadges[item.category] || 'bg-slate-800 text-slate-400'}`}>
                      {item.category}
                    </span>
                    <span className="font-mono text-[10px] text-slate-500">
                      {item.isActive ? (
                        <span className="text-emerald-400 flex items-center space-x-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                          <span>Active</span>
                        </span>
                      ) : (
                        <span className="text-slate-500">Archived</span>
                      )}
                    </span>
                  </div>

                  <h3 className="font-bold text-white text-sm line-clamp-2 mb-1">{item.equipmentName}</h3>
                  <p className="text-xs text-slate-400">{item.brand} • {item.model}</p>

                  {/* Stock Level Meters */}
                  <div className="mt-4 p-3 rounded-xl bg-slate-900 border border-slate-800 space-y-1.5 font-mono text-xs">
                    <div className="flex justify-between items-center">
                      <span className="text-slate-400">Available Stock:</span>
                      <span className={`font-bold ${isLowStock ? 'text-rose-400' : 'text-emerald-400'}`}>
                        {item.availableQuantity} units
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-[11px] text-slate-500">
                      <span>Safety Reorder Level:</span>
                      <span>{item.minimumStock} units</span>
                    </div>
                    <div className="flex justify-between items-center text-[11px] text-slate-500">
                      <span>Warranty Duration:</span>
                      <span>{item.warrantyDurationMonths} Months</span>
                    </div>
                  </div>

                  {isLowStock && (
                    <div className="mt-2 flex items-center space-x-1.5 text-[10px] text-rose-400 font-bold uppercase tracking-wider">
                      <AlertTriangle className="w-3.5 h-3.5" />
                      <span>Low Stock Alert - Restock Advised</span>
                    </div>
                  )}
                </div>

                <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-slate-500 block">Unit Selling:</span>
                    <span className="font-mono font-bold text-white text-xs">₹{item.sellingPrice?.toLocaleString('en-IN')}</span>
                  </div>

                  <div className="flex items-center space-x-1.5">
                    {/* Requirement 13: Edit SKU Button */}
                    {user?.role === 'admin' && (
                      <button
                        onClick={() => openEditModal(item)}
                        className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white font-medium text-xs rounded-lg border border-slate-700"
                        title="Edit SKU details and pricing"
                      >
                        Edit
                      </button>
                    )}

                    {/* Restock Button */}
                    {(user?.role === 'admin' || user?.role === 'inventory_manager') && (
                      <button
                        onClick={() => {
                          setSelectedItem(item);
                          setShowRestockModal(true);
                        }}
                        className="px-2.5 py-1 bg-solar-500 hover:bg-solar-400 text-midnight-950 font-bold text-xs rounded-lg shadow-sm"
                      >
                        Restock
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Server-side Pagination */}
      <div className="glass-card rounded-2xl overflow-hidden border border-slate-800">
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
          pageSizeOptions={[12, 24, 48, 96]}
        />
      </div>

      {/* Restock Modal */}
      {showRestockModal && selectedItem && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="glass-card w-full max-w-sm rounded-2xl border border-slate-700 p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <h3 className="text-base font-bold text-white flex items-center space-x-2">
                <RefreshCw className="w-4 h-4 text-solar-400" />
                <span>Restock Inventory</span>
              </h3>
              <button onClick={() => setShowRestockModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-300">
              Receiving new procurement batch for <strong className="text-white">{selectedItem.equipmentName}</strong>.
            </p>

            <form onSubmit={handleRestock} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-400 mb-1">Quantity Received (Units)</label>
                <input
                  type="number"
                  min="1"
                  value={restockQty}
                  onChange={(e) => setRestockQty(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white font-mono font-bold"
                  required
                />
              </div>

              <div className="flex justify-end space-x-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowRestockModal(false)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 rounded-lg hover:bg-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-solar-500 hover:bg-solar-400 text-midnight-950 font-bold rounded-lg"
                >
                  Confirm Restock
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Requirement 13: Full Edit Inventory SKU Modal */}
      {(showEditModal || showCreateModal) && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="glass-card w-full max-w-xl rounded-2xl border border-slate-700 p-6 space-y-4 my-8">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <h3 className="text-base font-bold text-white flex items-center space-x-2">
                <Edit className="w-5 h-5 text-solar-400" />
                <span>{showEditModal ? `Edit SKU: ${selectedItem?.equipmentName}` : 'Add New Inventory SKU'}</span>
              </h3>
              <button
                onClick={() => {
                  setShowEditModal(false);
                  setShowCreateModal(false);
                }}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={showEditModal ? handleUpdate : handleCreate} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-300 mb-1 font-semibold">Equipment Name</label>
                <input
                  type="text"
                  value={editForm.equipmentName}
                  onChange={(e) => setEditForm({ ...editForm, equipmentName: e.target.value })}
                  placeholder="e.g. Waaree 540W Monocrystalline PERC Solar Module"
                  className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white font-medium"
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1">Category</label>
                  <select
                    value={editForm.category}
                    onChange={(e) => setEditForm({ ...editForm, category: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white"
                  >
                    <option value="panel">Solar Panels</option>
                    <option value="inverter">Solar Inverter</option>
                    <option value="battery">Battery Storage</option>
                    <option value="structure">Mounting Structure</option>
                    <option value="cables">DC/AC Cables</option>
                    <option value="accessories">Switchgear</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-400 mb-1">Brand</label>
                  <input
                    type="text"
                    value={editForm.brand}
                    onChange={(e) => setEditForm({ ...editForm, brand: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white"
                    required
                  />
                </div>

                <div>
                  <label className="block text-slate-400 mb-1">Model #</label>
                  <input
                    type="text"
                    value={editForm.model}
                    onChange={(e) => setEditForm({ ...editForm, model: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white font-mono"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1">Purchase Price (₹)</label>
                  <input
                    type="number"
                    min="0"
                    value={editForm.purchasePrice}
                    onChange={(e) => setEditForm({ ...editForm, purchasePrice: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white font-mono"
                    required
                  />
                </div>

                <div>
                  <label className="block text-slate-400 mb-1">Selling Price (₹)</label>
                  <input
                    type="number"
                    min="0"
                    value={editForm.sellingPrice}
                    onChange={(e) => setEditForm({ ...editForm, sellingPrice: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white font-mono"
                    required
                  />
                </div>

                <div>
                  <label className="block text-slate-400 mb-1">Available Stock (Units)</label>
                  <input
                    type="number"
                    min="0"
                    value={editForm.availableQuantity}
                    onChange={(e) => setEditForm({ ...editForm, availableQuantity: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white font-mono font-bold"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1">Reorder Safety Level</label>
                  <input
                    type="number"
                    min="0"
                    value={editForm.minimumStock}
                    onChange={(e) => setEditForm({ ...editForm, minimumStock: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white font-mono"
                    required
                  />
                </div>

                <div>
                  <label className="block text-slate-400 mb-1">Warranty Duration (Months)</label>
                  <input
                    type="number"
                    min="0"
                    value={editForm.warrantyDurationMonths}
                    onChange={(e) => setEditForm({ ...editForm, warrantyDurationMonths: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white font-mono"
                    required
                  />
                </div>

                <div>
                  <label className="block text-slate-400 mb-1">Supplier / OEM</label>
                  <input
                    type="text"
                    value={editForm.supplier}
                    onChange={(e) => setEditForm({ ...editForm, supplier: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Description & Specifications</label>
                <textarea
                  rows="2"
                  value={editForm.description}
                  onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white"
                />
              </div>

              <div className="flex items-center space-x-2 pt-1">
                <input
                  type="checkbox"
                  id="isActiveCheck"
                  checked={editForm.isActive}
                  onChange={(e) => setEditForm({ ...editForm, isActive: e.target.checked })}
                  className="w-4 h-4 rounded text-solar-500 bg-slate-900 border-slate-700"
                />
                <label htmlFor="isActiveCheck" className="text-slate-300 font-medium">
                  Active SKU in Catalog (Available for allocation to project orders)
                </label>
              </div>

              <div className="flex justify-end space-x-2 pt-2 border-t border-slate-800">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setShowEditModal(false);
                    setShowCreateModal(false);
                  }}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                >
                  {showEditModal ? 'Save SKU Changes' : 'Create Inventory SKU'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default InventoryView;
