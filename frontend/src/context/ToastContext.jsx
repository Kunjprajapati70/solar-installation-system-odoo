import React, { createContext, useContext, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, AlertTriangle, AlertCircle, Info, X } from 'lucide-react';

const ToastContext = createContext(null);

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((message, type = 'info', duration = 4000) => {
    const id = Date.now() + Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, message, type }]);

    if (duration > 0) {
      setTimeout(() => {
        removeToast(id);
      }, duration);
    }
    return id;
  }, []);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback((message, type = 'info', duration = 4000) => {
    return addToast(message, type, duration);
  }, [addToast]);

  const toast = {
    success: (msg, duration) => addToast(msg, 'success', duration),
    error: (msg, duration) => addToast(msg, 'error', duration),
    warning: (msg, duration) => addToast(msg, 'warning', duration),
    info: (msg, duration) => addToast(msg, 'info', duration),
    dismiss: removeToast,
    showToast
  };

  // Gracefully intercept window.alert so all page feedback renders as animated toasts
  React.useEffect(() => {
    window.toast = toast;
    const originalAlert = window.alert;
    window.alert = (msg) => {
      if (!msg) return;
      const str = String(msg);
      const lower = str.toLowerCase();
      if (lower.includes('fail') || lower.includes('error') || lower.includes('invalid') || lower.includes('rejected')) {
        toast.error(str);
      } else if (
        lower.includes('success') ||
        lower.includes('saved') ||
        lower.includes('completed') ||
        lower.includes('started') ||
        lower.includes('unlocked') ||
        lower.includes('created') ||
        lower.includes('approved') ||
        lower.includes('converted') ||
        lower.includes('recorded')
      ) {
        toast.success(str);
      } else if (lower.includes('warn') || lower.includes('caution') || lower.includes('missing')) {
        toast.warning(str);
      } else {
        toast.info(str);
      }
    };
    return () => {
      window.alert = originalAlert;
    };
  }, [addToast]);

  const getToastStyle = (type) => {
    switch (type) {
      case 'success':
        return {
          icon: CheckCircle2,
          border: 'border-emerald-500/40',
          bg: 'bg-emerald-950/90 text-emerald-200',
          iconColor: 'text-emerald-400'
        };
      case 'error':
        return {
          icon: AlertCircle,
          border: 'border-rose-500/40',
          bg: 'bg-rose-950/90 text-rose-200',
          iconColor: 'text-rose-400'
        };
      case 'warning':
        return {
          icon: AlertTriangle,
          border: 'border-amber-500/40',
          bg: 'bg-amber-950/90 text-amber-200',
          iconColor: 'text-amber-400'
        };
      default:
        return {
          icon: Info,
          border: 'border-sky-500/40',
          bg: 'bg-midnight-900/95 text-sky-200',
          iconColor: 'text-sky-400'
        };
    }
  };

  return (
    <ToastContext.Provider value={{ ...toast, showToast }}>
      {children}
      {/* Toast Notification Container */}
      <div className="fixed bottom-5 right-5 z-50 flex flex-col space-y-2 pointer-events-none max-w-sm w-full">
        <AnimatePresence>
          {toasts.map((t) => {
            const { icon: Icon, border, bg, iconColor } = getToastStyle(t.type);
            return (
              <motion.div
                key={t.id}
                initial={{ opacity: 0, y: 20, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
                className={`pointer-events-auto flex items-center justify-between p-3.5 rounded-xl border ${border} ${bg} backdrop-blur-md shadow-2xl`}
              >
                <div className="flex items-center space-x-3">
                  <Icon className={`w-5 h-5 flex-shrink-0 ${iconColor}`} />
                  <p className="text-xs font-medium leading-relaxed">{t.message}</p>
                </div>
                <button
                  onClick={() => removeToast(t.id)}
                  className="ml-3 p-1 rounded-md text-slate-400 hover:text-white transition"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};
