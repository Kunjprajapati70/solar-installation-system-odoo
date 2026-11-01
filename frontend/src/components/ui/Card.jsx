import React from 'react';

export const Card = ({
  children,
  className = '',
  hoverable = false,
  glass = true,
  onClick,
  ...props
}) => {
  return (
    <div
      onClick={onClick}
      className={`rounded-2xl border transition-all duration-200 ${
        glass
          ? 'glass-card border-slate-800/80 shadow-xl'
          : 'bg-midnight-900 border-slate-800'
      } ${
        hoverable ? 'glass-card-hover cursor-pointer' : ''
      } ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};

export const CardHeader = ({
  title,
  subtitle,
  badge,
  action,
  className = '',
  children
}) => {
  return (
    <div className={`p-4 sm:p-5 border-b border-slate-800/80 flex items-center justify-between gap-3 ${className}`}>
      {children ? children : (
        <>
          <div className="space-y-0.5">
            <div className="flex items-center space-x-2">
              <h3 className="font-bold text-sm sm:text-base text-white tracking-tight">{title}</h3>
              {badge && badge}
            </div>
            {subtitle && <p className="text-xs text-slate-400">{subtitle}</p>}
          </div>
          {action && <div className="shrink-0">{action}</div>}
        </>
      )}
    </div>
  );
};

export const CardBody = ({ children, className = '' }) => {
  return <div className={`p-4 sm:p-5 ${className}`}>{children}</div>;
};

export const CardFooter = ({ children, className = '' }) => {
  return (
    <div className={`p-4 sm:p-5 border-t border-slate-800/80 bg-slate-900/30 rounded-b-2xl flex items-center justify-between gap-3 ${className}`}>
      {children}
    </div>
  );
};

export default Card;
