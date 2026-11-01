import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import Button from './Button';

export const ErrorState = ({
  title = 'Failed to load data',
  message = 'An unexpected network error occurred while communicating with the solar telemetry server.',
  onRetry,
  className = ''
}) => {
  return (
    <div className={`p-8 text-center rounded-2xl glass-card border border-rose-500/30 bg-rose-950/10 flex flex-col items-center justify-center space-y-4 ${className}`}>
      <div className="w-12 h-12 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-400 flex items-center justify-center">
        <AlertTriangle className="w-6 h-6" />
      </div>
      <div className="max-w-md space-y-1">
        <h3 className="text-base font-bold text-white">{title}</h3>
        <p className="text-xs text-rose-300/80 leading-relaxed font-mono">{message}</p>
      </div>
      {onRetry && (
        <Button variant="secondary" onClick={onRetry} className="text-xs flex items-center space-x-2">
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Retry Connection</span>
        </Button>
      )}
    </div>
  );
};

export default ErrorState;
