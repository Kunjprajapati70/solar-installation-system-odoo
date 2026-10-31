import React, { useState } from 'react';
import { Loader2 } from 'lucide-react';

export const Button = ({
  children,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  disabled = false,
  leftIcon,
  rightIcon,
  className = '',
  type = 'button',
  onClick,
  confirmMessage,
  fullWidth = false,
  ...props
}) => {
  const [internalLoading, setInternalLoading] = useState(false);

  const baseStyles = 'inline-flex items-center justify-center font-semibold rounded-xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-midnight-950 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer select-none active:scale-[0.98]';

  const variants = {
    primary: 'bg-gradient-to-r from-solar-600 via-solar-500 to-amber-400 hover:from-solar-500 hover:to-amber-300 text-midnight-950 shadow-glow-solar focus:ring-solar-400 font-bold',
    electric: 'bg-gradient-to-r from-emerald-600 via-emerald-500 to-teal-400 hover:from-emerald-500 hover:to-teal-300 text-midnight-950 shadow-glow-electric focus:ring-emerald-400 font-bold',
    secondary: 'bg-slate-800/80 hover:bg-slate-700 text-slate-200 border border-slate-700/80 hover:border-slate-600 focus:ring-slate-500',
    outline: 'bg-transparent border border-solar-500/50 text-solar-400 hover:bg-solar-500/10 hover:border-solar-400 focus:ring-solar-400 font-medium',
    ghost: 'bg-transparent hover:bg-slate-800/80 text-slate-400 hover:text-white focus:ring-slate-500',
    danger: 'bg-gradient-to-r from-rose-600 to-rose-500 hover:from-rose-500 hover:to-rose-400 text-white shadow-sm focus:ring-rose-400 font-bold',
    dark: 'bg-midnight-900 hover:bg-midnight-850 text-white border border-slate-800 focus:ring-slate-600'
  };

  const sizes = {
    sm: 'text-xs px-2.5 py-1.5 h-8 gap-1.5',
    md: 'text-xs sm:text-sm px-4 py-2 h-9 sm:h-10 gap-2',
    lg: 'text-sm sm:text-base px-5 py-2.5 h-11 sm:h-12 gap-2.5'
  };

  const handleClick = async (e) => {
    if (disabled || isLoading || internalLoading) return;

    if (confirmMessage) {
      const ok = window.confirm(confirmMessage);
      if (!ok) return;
    }

    if (onClick) {
      try {
        const result = onClick(e);
        if (result && typeof result.then === 'function') {
          setInternalLoading(true);
          await result;
        }
      } finally {
        setInternalLoading(false);
      }
    }
  };

  const isBusy = isLoading || internalLoading;

  return (
    <button
      type={type}
      disabled={disabled || isBusy}
      onClick={handleClick}
      className={`
        ${baseStyles}
        ${variants[variant] || variants.primary}
        ${sizes[size] || sizes.md}
        ${fullWidth ? 'w-full' : ''}
        ${className}
      `}
      {...props}
    >
      {isBusy ? (
        <Loader2 className="w-4 h-4 animate-spin shrink-0 text-current" />
      ) : (
        leftIcon && <span className="shrink-0 flex items-center">{leftIcon}</span>
      )}
      <span className="truncate">{children}</span>
      {!isBusy && rightIcon && <span className="shrink-0 flex items-center">{rightIcon}</span>}
    </button>
  );
};

export default Button;
