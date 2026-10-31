import React, { forwardRef } from 'react';
import { ChevronDown } from 'lucide-react';

export const Select = forwardRef(({
  label,
  error,
  helperText,
  options = [],
  className = '',
  id,
  children,
  ...props
}, ref) => {
  const selectId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

  return (
    <div className="w-full space-y-1.5">
      {label && (
        <label htmlFor={selectId} className="block text-xs font-semibold text-slate-300 tracking-wide">
          {label}
        </label>
      )}
      <div className="relative flex items-center">
        <select
          ref={ref}
          id={selectId}
          className={`w-full bg-slate-900/90 text-slate-100 rounded-xl border text-xs sm:text-sm pl-3.5 pr-10 py-2.5 transition-all duration-200 appearance-none focus:outline-none focus:ring-2 focus:ring-solar-500/20 cursor-pointer ${
            error
              ? 'border-rose-500 focus:border-rose-500 focus:ring-rose-500/20'
              : 'border-slate-700/80 hover:border-slate-600 focus:border-solar-500'
          } ${className}`}
          {...props}
        >
          {children || options.map((opt, i) => (
            <option key={i} value={opt.value} className="bg-slate-900 text-white">
              {opt.label}
            </option>
          ))}
        </select>
        <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3.5 pointer-events-none" />
      </div>
      {error ? (
        <p className="text-[11px] text-rose-400 font-medium">{error}</p>
      ) : helperText ? (
        <p className="text-[11px] text-slate-400">{helperText}</p>
      ) : null}
    </div>
  );
});

Select.displayName = 'Select';
export default Select;
