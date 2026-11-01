import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, X, Users, QrCode, FileText, Wrench, ArrowRight } from 'lucide-react';
import api from '../../api/client';

export const GlobalSearchModal = ({ isOpen, onClose }) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        if (isOpen) onClose();
        else onClose(true);
      }
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  useEffect(() => {
    if (!query.trim() || query.length < 2) {
      setResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        // Query equipment, customers, and orders
        const [eqRes, custRes, orderRes] = await Promise.allSettled([
          api.get(`/equipment?search=${encodeURIComponent(query)}&limit=4`),
          api.get(`/customers?search=${encodeURIComponent(query)}&limit=4`),
          api.get(`/orders?search=${encodeURIComponent(query)}&limit=4`)
        ]);

        const combined = [];
        if (eqRes.status === 'fulfilled' && eqRes.value.success) {
          (eqRes.value.data || []).forEach(item => {
            combined.push({
              id: item._id,
              type: 'Equipment (Serial)',
              title: `${item.name} • ${item.serialNumber}`,
              subtitle: `Status: ${item.currentStatus} | Category: ${item.category}`,
              path: '/equipment-tracking',
              icon: QrCode
            });
          });
        }
        if (custRes.status === 'fulfilled' && custRes.value.success) {
          (custRes.value.data || []).forEach(cust => {
            combined.push({
              id: cust._id,
              type: 'Customer',
              title: cust.name,
              subtitle: `${cust.city || 'Site'} • ${cust.phone}`,
              path: '/customers',
              icon: Users
            });
          });
        }
        if (orderRes.status === 'fulfilled' && orderRes.value.success) {
          (orderRes.value.data || []).forEach(o => {
            combined.push({
              id: o._id,
              type: 'Order / Project',
              title: `Order #${o.orderNumber || o._id.substring(0, 8)}`,
              subtitle: `Total: ₹${o.totalAmount?.toLocaleString('en-IN')} | ${o.status}`,
              path: '/orders',
              icon: FileText
            });
          });
        }

        setResults(combined);
      } catch (err) {
        console.error('Search error:', err);
      } finally {
        setLoading(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [query]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4 bg-slate-900/50 dark:bg-midnight-950/80 backdrop-blur-md">
      <div className="w-full max-w-2xl rounded-2xl bg-white dark:bg-midnight-900 border border-slate-200 dark:border-slate-700/80 shadow-2xl overflow-hidden animate-scale-up">
        {/* Search Input Bar */}
        <div className="flex items-center px-4 py-3.5 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/90">
          <Search className="w-5 h-5 text-solar-500 dark:text-solar-400 mr-3" />
          <input
            type="text"
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search customers, equipment serials, orders, or tickets..."
            className="flex-1 bg-transparent text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none font-sans"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="p-1 rounded-md text-slate-400 hover:text-slate-700 dark:hover:text-white mr-2"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <kbd className="hidden sm:inline-block px-2 py-0.5 text-[10px] bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded border border-slate-300 dark:border-slate-700 font-mono">
            ESC to close
          </kbd>
        </div>

        {/* Results Container */}
        <div className="max-h-96 overflow-y-auto p-2 divide-y divide-slate-100 dark:divide-slate-800/40">
          {loading ? (
            <div className="p-6 text-center text-xs text-slate-500 dark:text-slate-400 flex items-center justify-center space-x-2">
              <div className="w-4 h-4 border-2 border-solar-500 border-t-transparent rounded-full animate-spin" />
              <span>Scanning databases...</span>
            </div>
          ) : results.length > 0 ? (
            results.map((item) => {
              const Icon = item.icon;
              return (
                <div
                  key={`${item.type}-${item.id}`}
                  onClick={() => {
                    navigate(item.path);
                    onClose();
                  }}
                  className="flex items-center justify-between p-3 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800/60 cursor-pointer transition group"
                >
                  <div className="flex items-center space-x-3">
                    <div className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-solar-500 dark:text-solar-400 group-hover:bg-solar-500 group-hover:text-midnight-950 transition">
                      <Icon className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="text-xs font-semibold text-slate-800 dark:text-white group-hover:text-solar-600 dark:group-hover:text-solar-400 transition">
                          {item.title}
                        </span>
                        <span className="text-[10px] px-1.5 py-0.2 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded font-mono border border-slate-200 dark:border-transparent">
                          {item.type}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">{item.subtitle}</p>
                    </div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-slate-400 dark:text-slate-600 group-hover:text-solar-500 dark:group-hover:text-solar-400 group-hover:translate-x-1 transition" />
                </div>
              );
            })
          ) : query.length >= 2 ? (
            <div className="p-6 text-center text-xs text-slate-500 dark:text-slate-400">
              No matching records found for "{query}"
            </div>
          ) : (
            <div className="p-6 text-center text-xs text-slate-500 dark:text-slate-400">
              Type at least 2 characters to search across customers, serials, and orders
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default GlobalSearchModal;
