import React, { useState, useEffect, useRef } from 'react';
import api from '../api/client';
import {
  QrCode,
  Search,
  Plus,
  Camera,
  History,
  CheckCircle2,
  AlertCircle,
  Truck,
  Wrench,
  Package,
  Layers,
  ArrowRight,
  ExternalLink,
  Printer,
  X
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import Pagination from '../components/ui/Pagination';

const SmartEquipmentView = () => {
  const [equipmentList, setEquipmentList] = useState([]);
  const [inventoryList, setInventoryList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState(null);
  const [filterCategory, setFilterCategory] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Modals
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [showScannerModal, setShowScannerModal] = useState(false);
  const [showBadgeModal, setShowBadgeModal] = useState(false);
  const [scannerResult, setScannerResult] = useState('');

  // Generate form state
  const [generateForm, setGenerateForm] = useState({
    category: 'panel',
    quantity: 1,
    brand: 'SunPower High-Yield Series',
    model: 'SP-PERC-540W',
    specifications: { wattage: 540, warrantyYears: 25 }
  });

  const fetchEquipment = async () => {
    try {
      setLoading(true);
      const params = {};
      if (filterCategory) params.category = filterCategory;
      if (filterStatus) params.status = filterStatus;
      if (searchQuery) params.search = searchQuery;

      const [eqRes, invRes] = await Promise.all([
        api.get('/equipment', { params }),
        api.get('/inventory')
      ]);

      if (eqRes.success) setEquipmentList(eqRes.data);
      if (invRes.success) setInventoryList(invRes.data);
    } catch (err) {
      console.error('Fetch equipment error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEquipment();
  }, [filterCategory, filterStatus]);

  // Handle Search Submission (manual serial search fallback)
  const handleSearch = (e) => {
    e.preventDefault();
    fetchEquipment();
  };

  // Direct Lookup by Serial Number
  const handleLookupSerial = async (serial) => {
    try {
      const res = await api.get(`/equipment/lookup/${serial}`);
      if (res.success) {
        setSelectedItem(res.data.equipment);
        setShowScannerModal(false);
      }
    } catch (err) {
      alert(`Lookup failed: ${err.message}`);
    }
  };

  // Initialize camera scanner when modal opens
  useEffect(() => {
    let scanner = null;
    if (showScannerModal) {
      scanner = new Html5QrcodeScanner(
        'reader',
        { fps: 10, qrbox: { width: 250, height: 250 } },
        /* verbose= */ false
      );

      scanner.render(
        (decodedText) => {
          setScannerResult(decodedText);
          try {
            // Attempt to parse JSON payload or plain serial
            const parsed = JSON.parse(decodedText);
            if (parsed.serialNumber) {
              handleLookupSerial(parsed.serialNumber);
            } else {
              handleLookupSerial(decodedText);
            }
          } catch (e) {
            handleLookupSerial(decodedText);
          }
          scanner.clear();
        },
        (error) => {
          // scanning frame errors can be ignored
        }
      );
    }

    return () => {
      if (scanner) {
        scanner.clear().catch(error => console.error('Failed to clear scanner', error));
      }
    };
  }, [showScannerModal]);

  const handleGenerate = async (e) => {
    e.preventDefault();
    try {
      const res = await api.post('/equipment/generate', generateForm);
      if (res.success) {
        setShowGenerateModal(false);
        fetchEquipment();
        alert(`Successfully serialized & generated QR codes for ${res.data.length} equipment units.`);
      }
    } catch (err) {
      alert(`Generation failed: ${err.message}`);
    }
  };

  const statusBadges = {
    in_stock: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
    reserved: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
    dispatched: 'bg-sky-500/10 text-sky-400 border-sky-500/30',
    installed: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/30',
    under_service: 'bg-rose-500/10 text-rose-400 border-rose-500/30'
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-5 rounded-2xl glass-card border border-solar-500/20">
        <div>
          <div className="flex items-center space-x-2 text-solar-400 text-xs font-semibold uppercase tracking-wider mb-1">
            <QrCode className="w-3.5 h-3.5" />
            <span>Feature 1 • Asset Lifecycle & Serial Engine</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
            Smart Equipment <span className="gradient-solar-text">& QR Tracking</span>
          </h1>
          <p className="text-slate-400 text-xs sm:text-sm mt-0.5">
            Individual serialization, camera QR code scanning, manual search fallback, and complete audit trail.
          </p>
        </div>

        <div className="flex items-center space-x-2.5">
          <button
            onClick={() => setShowScannerModal(true)}
            className="flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition shadow-sm"
          >
            <Camera className="w-4 h-4 text-solar-400" />
            <span>Scan Camera QR</span>
          </button>

          <button
            onClick={() => setShowGenerateModal(true)}
            className="flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-solar-600 to-solar-500 hover:from-solar-500 hover:to-solar-400 text-midnight-950 text-xs font-bold shadow-glow-solar transition"
          >
            <Plus className="w-4 h-4" />
            <span>Generate Serials</span>
          </button>
        </div>
      </div>

      {/* Filter and Fallback Search Bar */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 p-4 rounded-xl glass-card">
        <form onSubmit={handleSearch} className="flex-1 flex items-center relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 pointer-events-none" />
          <input
            type="text"
            placeholder="Manual Serial Search (e.g. SP-PNL-2026-00001) or Model..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-24 py-2 rounded-lg bg-slate-900 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-solar-500 transition"
          />
          <button
            type="submit"
            className="absolute right-1.5 px-3 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] font-semibold rounded-md transition"
          >
            Lookup
          </button>
        </form>

        <div className="flex items-center space-x-2">
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-xs text-slate-300 focus:outline-none focus:border-solar-500"
          >
            <option value="">All Categories</option>
            <option value="panel">Solar Panels</option>
            <option value="inverter">Inverters</option>
            <option value="battery">Battery Packs</option>
            <option value="structure">Mounting Structures</option>
          </select>

          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-xs text-slate-300 focus:outline-none focus:border-solar-500"
          >
            <option value="">All Statuses</option>
            <option value="in_stock">In Stock</option>
            <option value="reserved">Reserved</option>
            <option value="dispatched">Dispatched</option>
            <option value="installed">Installed</option>
            <option value="under_service">Under Service</option>
          </select>
        </div>
      </div>

      {/* Main Content Layout: Equipment Table & Movement Drawer */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Equipment Table (Left 2 Columns) */}
        <div className="lg:col-span-2 rounded-2xl glass-card overflow-hidden border border-slate-800">
          <div className="p-4 border-b border-slate-800 flex items-center justify-between">
            <h2 className="text-sm font-bold text-white flex items-center space-x-2">
              <Layers className="w-4 h-4 text-solar-400" />
              <span>Serialized Asset Inventory ({equipmentList.length})</span>
            </h2>
            <span className="text-[11px] text-slate-400">Click row to view complete movement history</span>
          </div>

          <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-900/90 text-slate-400 uppercase tracking-wider text-[10px] sticky top-0 z-10 border-b border-slate-800">
                <tr>
                  <th className="py-2.5 px-3">Serial & QR</th>
                  <th className="py-2.5 px-3">Category</th>
                  <th className="py-2.5 px-3">Model Specs</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3">Linked Customer / Order</th>
                  <th className="py-2.5 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-sans">
                {equipmentList.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="py-8 text-center text-slate-500">
                      No serialized equipment matching filter criteria.
                    </td>
                  </tr>
                ) : (
                  equipmentList.slice((currentPage - 1) * pageSize, currentPage * pageSize).map((item) => {
                    const isSelected = selectedItem?._id === item._id;
                    return (
                      <tr
                        key={item._id}
                        onClick={() => setSelectedItem(item)}
                        className={`cursor-pointer transition ${
                          isSelected ? 'bg-solar-500/10' : 'hover:bg-slate-800/40'
                        }`}
                      >
                        <td className="py-2.5 px-3">
                          <div className="flex items-center space-x-2">
                            <div className="p-1 rounded bg-white shrink-0">
                              <QRCodeSVG value={item.qrCodeData || item.serialNumber} size={28} />
                            </div>
                            <span className="font-mono font-bold text-slate-200">{item.serialNumber}</span>
                          </div>
                        </td>
                        <td className="py-2.5 px-3 capitalize text-slate-300 font-medium">
                          {item.category}
                        </td>
                        <td className="py-2.5 px-3">
                          <p className="font-semibold text-slate-200 truncate max-w-[140px]">{item.model}</p>
                          <p className="text-[10px] text-slate-400 truncate">{item.brand}</p>
                        </td>
                        <td className="py-2.5 px-3">
                          <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold border uppercase tracking-wider ${statusBadges[item.status] || 'bg-slate-800 text-slate-300'}`}>
                            {item.status.replace('_', ' ')}
                          </span>
                        </td>
                        <td className="py-2.5 px-3">
                          {item.installedAtCustomer ? (
                            <p className="font-medium text-slate-300 truncate max-w-[120px]">{item.installedAtCustomer.name}</p>
                          ) : item.allocatedToOrder ? (
                            <p className="font-mono text-solar-400">{item.allocatedToOrder.orderNumber}</p>
                          ) : (
                            <span className="text-[10px] text-slate-500 italic">Central Stock</span>
                          )}
                        </td>
                        <td className="py-2.5 px-3 text-right">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedItem(item);
                              setShowBadgeModal(true);
                            }}
                            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-solar-400 hover:text-solar-300 transition"
                            title="Print QR Badge"
                          >
                            <Printer className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {equipmentList.length > pageSize && (
            <div className="p-3 border-t border-slate-800">
              <Pagination
                currentPage={currentPage}
                totalPages={Math.ceil(equipmentList.length / pageSize) || 1}
                onPageChange={(p) => setCurrentPage(p)}
                totalItems={equipmentList.length}
                pageSize={pageSize}
                onPageSizeChange={(newSize) => {
                  setPageSize(newSize);
                  setCurrentPage(1);
                }}
              />
            </div>
          )}
        </div>

        {/* Movement History & Details (Right Column) */}
        <div className="rounded-2xl glass-card p-5 border border-slate-800">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
            <h3 className="text-sm font-bold text-white flex items-center space-x-2">
              <History className="w-4 h-4 text-emerald-400" />
              <span>Asset History & Audit Trail</span>
            </h3>
            {selectedItem && (
              <span className="text-xs font-mono text-solar-400 font-bold">{selectedItem.serialNumber}</span>
            )}
          </div>

          {!selectedItem ? (
            <div className="text-center py-12 text-slate-500 text-xs">
              <Package className="w-10 h-10 mx-auto text-slate-600 mb-2" />
              <p>Select any serialized asset from the table to inspect its physical movement audit trail.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Asset Snapshot Card */}
              <div className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-white uppercase">{selectedItem.brand}</span>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border uppercase ${statusBadges[selectedItem.status]}`}>
                    {selectedItem.status.replace('_', ' ')}
                  </span>
                </div>
                <p className="text-xs text-slate-300">{selectedItem.model}</p>
                <div className="text-[11px] text-slate-400 grid grid-cols-2 gap-1 pt-1 border-t border-slate-800 font-mono">
                  <span>Wattage: {selectedItem.specifications?.wattage ? `${selectedItem.specifications.wattage}W` : 'N/A'}</span>
                  <span>Warranty: {selectedItem.specifications?.warrantyYears || 5} Years</span>
                </div>
              </div>

              {/* Movement History Timeline */}
              <div>
                <p className="text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                  Chain of Custody Timeline
                </p>
                <div className="relative pl-6 space-y-4 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-800">
                  {(selectedItem.movementHistory || []).map((step, idx) => (
                    <div key={idx} className="relative text-xs">
                      <div className="absolute -left-6 top-1 w-3 h-3 rounded-full bg-solar-500 border-2 border-midnight-950" />
                      <div className="p-2.5 rounded-lg bg-slate-900/60 border border-slate-800/80">
                        <div className="flex items-center justify-between text-[11px] text-slate-400 mb-1">
                          <span className="font-semibold text-slate-200">{step.action.replace(/_/g, ' ')}</span>
                          <span className="text-[10px] font-mono">
                            {new Date(step.timestamp).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}
                          </span>
                        </div>
                        <p className="text-slate-300 text-[11px]">{step.notes || 'Status updated in system.'}</p>
                        {step.performedByName && (
                          <span className="text-[10px] text-slate-500 mt-1 block">
                            Logged by: {step.performedByName}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* MODAL 1: Generate Serials Modal */}
      {showGenerateModal && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="glass-card w-full max-w-md rounded-2xl border border-slate-700 p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white flex items-center space-x-2">
                <QrCode className="w-5 h-5 text-solar-400" />
                <span>Generate Equipment Serials & QR</span>
              </h3>
              <button onClick={() => setShowGenerateModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleGenerate} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-400 mb-1">Equipment Category</label>
                <select
                  value={generateForm.category}
                  onChange={(e) => setGenerateForm({ ...generateForm, category: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white"
                >
                  <option value="panel">Solar Panels (Mono PERC)</option>
                  <option value="inverter">Solar Inverters</option>
                  <option value="battery">Solar Batteries (LiFePO4)</option>
                  <option value="structure">Mounting Structure</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Quantity to Generate & Serialize</label>
                <input
                  type="number"
                  min="1"
                  max="100"
                  value={generateForm.quantity}
                  onChange={(e) => setGenerateForm({ ...generateForm, quantity: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Brand Name</label>
                <input
                  type="text"
                  value={generateForm.brand}
                  onChange={(e) => setGenerateForm({ ...generateForm, brand: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Model Name</label>
                <input
                  type="text"
                  value={generateForm.model}
                  onChange={(e) => setGenerateForm({ ...generateForm, model: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white"
                />
              </div>

              <div className="pt-2 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setShowGenerateModal(false)}
                  className="px-4 py-2 rounded-lg bg-slate-800 text-slate-300 font-medium hover:bg-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-solar-500 hover:bg-solar-400 text-midnight-950 font-bold"
                >
                  Generate & Add to Stock
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: Camera QR Scanner Modal */}
      {showScannerModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 z-50">
          <div className="glass-card w-full max-w-lg rounded-2xl border border-slate-700 p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white flex items-center space-x-2">
                <Camera className="w-5 h-5 text-solar-400" />
                <span>Live Camera QR Equipment Scanner</span>
              </h3>
              <button onClick={() => setShowScannerModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-400">
              Align camera with the solar panel, inverter, or battery QR label badge. Manual serial search is always supported below.
            </p>

            {/* Video Viewport Container */}
            <div className="overflow-hidden rounded-xl bg-black border border-slate-700 min-h-[280px]">
              <div id="reader" className="w-full"></div>
            </div>

            {/* Fallback Manual Input */}
            <div className="pt-2 border-t border-slate-800">
              <p className="text-[11px] text-slate-400 mb-1">Fallback: Type serial manually if camera unavailable</p>
              <div className="flex items-center space-x-2">
                <input
                  type="text"
                  placeholder="e.g. SP-PNL-2026-00001"
                  value={scannerResult}
                  onChange={(e) => setScannerResult(e.target.value)}
                  className="flex-1 px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-xs text-white"
                />
                <button
                  onClick={() => handleLookupSerial(scannerResult)}
                  className="px-4 py-2 bg-solar-500 hover:bg-solar-400 text-midnight-950 text-xs font-bold rounded-lg"
                >
                  Lookup
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: Printable QR Badge Preview */}
      {showBadgeModal && selectedItem && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white text-slate-900 w-full max-w-sm rounded-2xl p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-200 pb-2">
              <span className="font-bold text-sm tracking-tight">SunPower Solutions Asset Tag</span>
              <button onClick={() => setShowBadgeModal(false)} className="text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex flex-col items-center justify-center space-y-3 py-2 text-center">
              <div className="p-3 bg-white border-2 border-slate-900 rounded-xl shadow-md">
                <QRCodeSVG value={selectedItem.qrCodeData || selectedItem.serialNumber} size={160} />
              </div>
              <div>
                <p className="font-mono font-extrabold text-base text-slate-900">{selectedItem.serialNumber}</p>
                <p className="text-xs text-slate-600 font-semibold">{selectedItem.brand} - {selectedItem.model}</p>
                <p className="text-[11px] text-slate-500 uppercase tracking-wider">{selectedItem.category} • Tier-1 Quality</p>
              </div>
            </div>

            <div className="flex justify-between space-x-2 pt-2 border-t border-slate-200">
              <button
                onClick={() => setShowBadgeModal(false)}
                className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-lg"
              >
                Close
              </button>
              <button
                onClick={() => window.print()}
                className="w-full py-2 bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs rounded-lg flex items-center justify-center space-x-1"
              >
                <Printer className="w-4 h-4" />
                <span>Print Tag</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SmartEquipmentView;
