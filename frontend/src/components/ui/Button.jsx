import React, { useState } from 'react';
import { Loader2 } from 'lucide-react';

export const Button = ({
  children,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  loading = false,
  disabled = false,
  leftIcon,
  rightIcon,
  className = '',
  type = 'button',
  onClick,
  confirmMessage,
  fullWidth = false,
  title,
  ...props
}) => {
  const [internalLoading, setInternalLoading] = useState(false);

  const baseStyles = 'inline-flex items-center justify-center font-semibold rounded-xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-900 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer select-none active:scale-[0.98] shrink-0';

  const variants = {
    primary: 'bg-gradient-to-r from-solar-600 via-solar-500 to-amber-400 hover:from-solar-500 hover:to-amber-300 text-slate-950 shadow-glow-solar focus:ring-solar-400 font-bold border border-solar-400/30',
    secondary: 'bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700/80 focus:ring-slate-400 shadow-sm',
    outline: 'bg-transparent border border-solar-500/60 text-solar-600 dark:text-solar-400 hover:bg-solar-500/10 hover:border-solar-400 focus:ring-solar-400 font-semibold',
    danger: 'bg-gradient-to-r from-rose-600 to-rose-500 hover:from-rose-500 hover:to-rose-400 text-white shadow-sm focus:ring-rose-400 font-bold border border-rose-500/30',
    success: 'bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white shadow-sm focus:ring-emerald-400 font-bold border border-emerald-500/30',
    'icon-only': 'bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 focus:ring-slate-400 p-0',
    loading: 'bg-slate-200 dark:bg-slate-800 text-slate-500 cursor-wait border border-slate-300 dark:border-slate-700',
    ghost: 'bg-transparent hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white focus:ring-slate-400'
  };

  const sizes = {
    sm: variant === 'icon-only' ? 'w-8 h-8 text-xs' : 'text-xs px-3 py-1.5 h-8 gap-1.5',
    md: variant === 'icon-only' ? 'w-10 h-10 text-sm' : 'text-xs sm:text-sm px-4 py-2 h-10 gap-2',
    lg: variant === 'icon-only' ? 'w-12 h-12 text-base' : 'text-sm sm:text-base px-5 py-2.5 h-12 gap-2.5'
  };

  const handleClick = async (e) => {
    if (disabled || isLoading || loading || internalLoading) return;

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

  const isBusy = isLoading || loading || internalLoading || variant === 'loading';

  return (
    <button
      type={type}
      disabled={disabled || isBusy}
      onClick={handleClick}
      title={title}
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
      {children && <span className="whitespace-nowrap">{children}</span>}
      {!isBusy && rightIcon && <span className="shrink-0 flex items-center">{rightIcon}</span>}
    </button>
  );
};

export default Button;
