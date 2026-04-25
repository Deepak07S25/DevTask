import { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { CheckCircle2, ShieldAlert, Info, X } from 'lucide-react';
import { cn } from './utils';

const ToastContext = createContext(null);

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((message, type = 'info') => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, message, type }]);
    
    // Auto dismiss after 4 seconds
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  }, []);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const contextValue = {
    toast: (msg) => addToast(msg, 'info'),
    success: (msg) => addToast(msg, 'success'),
    error: (msg) => addToast(msg, 'error'),
  };

  return (
    <ToastContext.Provider value={contextValue}>
      {children}
      <div className="fixed bottom-6 right-6 z-[9999] flex flex-col gap-2.5 pointer-events-none items-end">
        {toasts.map((t) => (
          <ToastItem key={t.id} toast={t} onRemove={() => removeToast(t.id)} />
        ))}
      </div>
    </ToastContext.Provider>
  );
};

const ToastItem = ({ toast, onRemove }) => {
  const [mounted, setMounted] = useState(false);
  
  useEffect(() => {
    requestAnimationFrame(() => setMounted(true));
  }, []);

  const typeConfig = {
    success: { icon: <CheckCircle2 size={15} />, color: 'var(--success)', bg: 'var(--success-bg)', border: 'var(--success-border)' },
    error: { icon: <ShieldAlert size={15} />, color: 'var(--danger)', bg: 'var(--danger-bg)', border: 'var(--danger-border)' },
    info: { icon: <Info size={15} />, color: 'var(--text-primary)', bg: 'var(--surface-raised)', border: 'var(--border)' },
  };
  
  const config = typeConfig[toast.type] || typeConfig.info;

  return (
    <div
      className={cn(
        "pointer-events-auto flex items-start gap-3 px-4 py-3 min-w-[280px] max-w-[380px] rounded-[var(--radius-lg)] shadow-[var(--shadow-lg)] transition-all duration-300 ease-[var(--ease-out)]",
        mounted ? "opacity-100 translate-y-0 scale-100" : "opacity-0 translate-y-4 scale-95"
      )}
      style={{
        background: config.bg,
        border: `1px solid ${config.border}`,
      }}
    >
      <span className="shrink-0 mt-0.5" style={{ color: config.color }}>{config.icon}</span>
      <p className="text-sm font-medium leading-relaxed flex-1" style={{ color: 'var(--text-primary)' }}>
        {toast.message}
      </p>
      <button 
        onClick={onRemove}
        className="shrink-0 -mt-0.5 -mr-1 p-1 rounded-[var(--radius-sm)] transition-colors hover:bg-[var(--surface-subtle)] focus:outline-none"
        style={{ color: 'var(--text-muted)' }}
        aria-label="Dismiss"
      >
        <X size={14} />
      </button>
    </div>
  );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) throw new Error('useToast must be used within ToastProvider');
  return context;
};
