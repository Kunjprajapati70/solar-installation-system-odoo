import React, { useState, useEffect, useRef } from 'react';
import { Search, ChevronDown, Check, QrCode, AlertCircle, Edit3 } from 'lucide-react';
import api from '../../api/client';

export const EquipmentSerialSelect = ({
  value = '',
  onChange,
  operation = 'service', // 'dispatch' | 'installation' | 'service' | 'warranty' | 'all'
  category,
  customerId,
  orderId,
  label = 'Select Equipment Serial Number',
  required = false,
  placeholder = 'Search by serial number, brand, or model...'
}) => {
  const [options, setOptions] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [manualMode, setManualMode] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const fetchOptions = async () => {
      try {
        setLoading(true);
        const res = await api.get('/equipment/dropdown', {
          params: {
            search,
            operation,
            category,
            customerId,
            orderId,
            limit: 30
          }
        });
        setOptions(res.data || res || []);
      } catch (err) {
        console.error('Failed to load equipment serial options:', err);
      } finally {
        setLoading(false);
      }
    };

    const timer = setTimeout(fetchOptions, 250);
    return () => clearTimeout(timer);
  }, [search, operation, category, customerId, orderId]);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const selectedItem = options.find((opt) => opt.value === value);

  const getStatusBadge = (status) => {
    switch (status) {
      case 'in_stock':
        return <span className="px-1.5 py-0.5 rounded text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">In Stock</span>;
      case 'installed':
        return <span className="px-1.5 py-0.5 rounded text-[10px] bg-sky-500/20 text-sky-300 border border-sky-500/30">Installed</span>;
      case 'dispatched':
        return <span className="px-1.5 py-0.5 rounded text-[10px] bg-amber-500/20 text-amber-300 border border-amber-500/30">Dispatched</span>;
      case 'under_service':
        return <span className="px-1.5 py-0.5 rounded text-[10px] bg-rose-500/20 text-rose-300 border border-rose-500/30">Under Service</span>;
      default:
        return <span className="px-1.5 py-0.5 rounded text-[10px] bg-slate-800 text-slate-400">{status}</span>;
    }
  };

  return (
    <div className="space-y-1 relative" ref={dropdownRef}>
      <div className="flex justify-between items-center">
        <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
          {label} {required && <span className="text-rose-500">*</span>}
        </label>
        <button
          type="button"
          onClick={() => setManualMode(!manualMode)}
          className="text-[11px] text-solar-500 hover:text-solar-400 flex items-center space-x-1"
        >
          <Edit3 className="w-3 h-3" />
          <span>{manualMode ? 'Switch to Searchable Dropdown' : 'Enter Serial Manually'}</span>
        </button>
      </div>

      {manualMode ? (
        /* Manual Fallback Input */
        <div className="relative">
          <input
            type="text"
            value={value}
            onChange={(e) => onChange(e.target.value.toUpperCase().trim())}
            placeholder="e.g. SP-PAN-540W-001"
            className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white font-mono text-xs focus:border-solar-400 focus:outline-none uppercase"
            required={required}
          />
        </div>
      ) : (
        /* Searchable Select Dropdown */
        <div className="relative">
          <button
            type="button"
            onClick={() => setIsOpen(!isOpen)}
            className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-left flex items-center justify-between text-xs focus:outline-none focus:border-solar-400 shadow-sm"
          >
            <div className="flex items-center space-x-2 truncate">
              <QrCode className="w-4 h-4 text-solar-500 shrink-0" />
              {value ? (
                <span className="font-mono font-bold text-slate-900 dark:text-white">
                  {value} {selectedItem && <span className="font-normal text-slate-500 ml-1.5">({selectedItem.brand} {selectedItem.model})</span>}
                </span>
              ) : (
                <span className="text-slate-400">{placeholder}</span>
              )}
            </div>
            <ChevronDown className="w-4 h-4 text-slate-400 shrink-0 ml-2" />
          </button>

          {isOpen && (
            <div className="absolute left-0 right-0 top-full mt-1.5 z-50 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl shadow-2xl overflow-hidden">
              {/* Search Bar */}
              <div className="p-2 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/70 flex items-center space-x-2">
                <Search className="w-4 h-4 text-slate-400 shrink-0 ml-1" />
                <input
                  type="text"
                  autoFocus
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Type to filter serials..."
                  className="w-full bg-transparent border-none text-xs text-slate-900 dark:text-white focus:outline-none placeholder-slate-400"
                />
              </div>

              {/* Options List */}
              <div className="max-h-60 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/60">
                {loading && (
                  <div className="p-3 text-center text-xs text-slate-400">Loading equipment inventory...</div>
                )}
                {!loading && options.length === 0 && (
                  <div className="p-4 text-center text-xs text-slate-400 space-y-1">
                    <AlertCircle className="w-5 h-5 mx-auto text-slate-500" />
                    <p>No matching equipment found for this operation.</p>
                    <button
                      type="button"
                      onClick={() => setManualMode(true)}
                      className="text-solar-400 hover:underline text-[11px]"
                    >
                      Enter serial manually
                    </button>
                  </div>
                )}
                {options.map((item) => {
                  const isSelected = item.value === value;
                  return (
                    <button
                      type="button"
                      key={item.value}
                      onClick={() => {
                        onChange(item.value, item);
                        setIsOpen(false);
                      }}
                      className={`w-full p-2.5 text-left flex items-start justify-between transition-colors hover:bg-solar-500/10 ${
                        isSelected ? 'bg-solar-500/15 text-solar-400' : 'text-slate-800 dark:text-slate-200'
                      }`}
                    >
                      <div className="space-y-0.5">
                        <div className="flex items-center space-x-2">
                          <span className="font-mono font-bold text-xs text-slate-900 dark:text-white">{item.serialNumber}</span>
                          {getStatusBadge(item.status)}
                        </div>
                        <p className="text-[11px] text-slate-500">
                          {item.brand} {item.model} • <span className="capitalize">{item.category}</span>
                        </p>
                        {item.customerName && (
                          <p className="text-[10px] text-slate-400">Installed At: {item.customerName}</p>
                        )}
                        {item.orderNumber && (
                          <p className="text-[10px] text-slate-400">Linked Order: #{item.orderNumber}</p>
                        )}
                      </div>
                      {isSelected && <Check className="w-4 h-4 text-solar-500 shrink-0 mt-0.5" />}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default EquipmentSerialSelect;

