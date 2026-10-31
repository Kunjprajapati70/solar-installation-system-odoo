import React from 'react';

export const Badge = ({
  children,
  variant = 'default',
  size = 'md',
  dot = false,
  className = '',
  ...props
}) => {
  const variants = {
    default: 'bg-slate-800 text-slate-300 border-slate-700',
    solar: 'bg-solar-500/10 text-solar-400 border-solar-500/30',
    electric: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30 font-semibold',
    emerald: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30 font-semibold',
    sky: 'bg-sky-500/10 text-sky-400 border-sky-500/30',
    amber: 'bg-amber-500/10 text-amber-400 border-amber-500/30 font-semibold',
    rose: 'bg-rose-500/10 text-rose-400 border-rose-500/30 font-semibold',
    purple: 'bg-purple-500/10 text-purple-400 border-purple-500/30',
    outline: 'bg-transparent text-slate-300 border-slate-700'
  };

  const dotColors = {
    default: 'bg-slate-400',
    solar: 'bg-solar-400',
    electric: 'bg-emerald-400',
    emerald: 'bg-emerald-400',
    sky: 'bg-sky-400',
    amber: 'bg-amber-400',
    rose: 'bg-rose-400',
    purple: 'bg-purple-400',
    outline: 'bg-slate-400'
  };

  const sizes = {
    sm: 'text-[10px] px-2 py-0.5 gap-1',
    md: 'text-xs px-2.5 py-1 gap-1.5',
    lg: 'text-xs sm:text-sm px-3 py-1.5 gap-2'
  };

  return (
    <span
      className={`inline-flex items-center rounded-full border uppercase tracking-wider font-medium font-sans ${variants[variant] || variants.default} ${sizes[size] || sizes.md} ${className}`}
      {...props}
    >
      {dot && (
        <span className={`w-1.5 h-1.5 rounded-full ${dotColors[variant] || 'bg-current'} animate-pulse shrink-0`} />
      )}
      <span>{children}</span>
    </span>
  );
};

export default Badge;
