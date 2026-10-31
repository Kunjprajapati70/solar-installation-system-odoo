import React from 'react';
import { PackageOpen } from 'lucide-react';
import Button from './Button';

export const EmptyState = ({
  icon: Icon = PackageOpen,
  title = 'No items found',
  description = 'There are no records matching your search or filters at the moment.',
  actionLabel,
  onAction,
  iconColor = 'text-solar-400',
  className = ''
}) => {
  return (
    <div className={`p-8 sm:p-12 text-center rounded-2xl glass-card border border-slate-800 flex flex-col items-center justify-center space-y-4 ${className}`}>
      <div className={`w-14 h-14 rounded-2xl bg-slate-800/80 border border-slate-700/80 flex items-center justify-center shadow-lg ${iconColor}`}>
        <Icon className="w-7 h-7" />
      </div>
      <div className="max-w-md space-y-1">
        <h3 className="text-base font-bold text-white tracking-tight">{title}</h3>
        <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">{description}</p>
      </div>
      {actionLabel && onAction && (
        <Button variant="primary" onClick={onAction} className="mt-2 text-xs">
          {actionLabel}
        </Button>
      )}
    </div>
  );
};

export default EmptyState;
