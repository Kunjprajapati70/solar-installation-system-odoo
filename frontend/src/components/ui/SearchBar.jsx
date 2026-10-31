import React from 'react';
import { Search, X } from 'lucide-react';

export const SearchBar = ({
  value,
  onChange,
  onClear,
  placeholder = 'Search by name, serial number, project...',
  className = ''
}) => {
  return (
    <div className={`relative flex-1 min-w-[200px] ${className}`}>
      <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full bg-slate-900/80 border border-slate-700/80 rounded-xl pl-10 pr-9 py-2 text-xs sm:text-sm text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-solar-500 focus:ring-1 focus:ring-solar-500/50 transition shadow-inner"
      />
      {value && (
        <button
          onClick={onClear || (() => onChange(''))}
          className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5 rounded-full text-slate-400 hover:text-white transition"
          aria-label="Clear search"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      )}
    </div>
  );
};

export default SearchBar;
