import React, { useState } from 'react';
import { Filter, X, ChevronDown, RotateCcw } from 'lucide-react';
import Button from './Button';

export const FilterPanel = ({
  filters = [],
  activeFilters = {},
  onChange,
  onReset,
  className = ''
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const activeCount = Object.values(activeFilters).filter(Boolean).length;

  return (
    <div className={`relative ${className}`}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center space-x-2 px-3 py-2 rounded-xl border text-xs font-medium transition ${
          activeCount > 0
            ? 'bg-solar-500/10 border-solar-500/40 text-solar-400'
            : 'bg-slate-900/80 border-slate-700/80 text-slate-300 hover:border-slate-600'
        }`}
      >
        <Filter className="w-3.5 h-3.5" />
        <span>Filters</span>
        {activeCount > 0 && (
          <span className="w-4 h-4 rounded-full bg-solar-500 text-midnight-950 font-bold text-[10px] flex items-center justify-center">
            {activeCount}
          </span>
        )}
        <ChevronDown className={`w-3 h-3 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-72 sm:w-80 rounded-2xl glass-card border border-slate-700 shadow-2xl p-4 z-40 space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
            <span className="text-xs font-bold text-white uppercase tracking-wider">Refine Results</span>
            {activeCount > 0 && (
              <button
                onClick={onReset}
                className="flex items-center space-x-1 text-[11px] text-solar-400 hover:text-solar-300 transition"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Reset All</span>
              </button>
            )}
          </div>

          <div className="space-y-3">
            {filters.map((f) => (
              <div key={f.key} className="space-y-1.5">
                <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide">
                  {f.label}
                </label>
                <select
                  value={activeFilters[f.key] || ''}
                  onChange={(e) => onChange(f.key, e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-solar-500"
                >
                  <option value="">All {f.label}</option>
                  {f.options.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
            ))}
          </div>

          <div className="pt-2 flex justify-end">
            <Button variant="secondary" size="sm" onClick={() => setIsOpen(false)}>
              Apply Filters
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default FilterPanel;
