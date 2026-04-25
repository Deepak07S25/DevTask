import { createContext, useContext, useState, useCallback } from 'react';
import { Modal } from './Modal';
import { Button } from './Button';
import { AlertTriangle } from 'lucide-react';

const ConfirmContext = createContext(null);

export const ConfirmProvider = ({ children }) => {
  const [confirmState, setConfirmState] = useState({
    isOpen: false,
    title: '',
    message: '',
    confirmText: 'Confirm',
    cancelText: 'Cancel',
    danger: false,
    onConfirm: null,
    onCancel: null,
  });

  const confirm = useCallback((options) => {
    return new Promise((resolve) => {
      setConfirmState({
        isOpen: true,
        title: options.title || 'Confirm Action',
        message: options.message || 'Are you sure you want to proceed?',
        confirmText: options.confirmText || 'Confirm',
        cancelText: options.cancelText || 'Cancel',
        danger: options.danger || false,
        onConfirm: () => {
          setConfirmState((prev) => ({ ...prev, isOpen: false }));
          resolve(true);
        },
        onCancel: () => {
          setConfirmState((prev) => ({ ...prev, isOpen: false }));
          resolve(false);
        },
      });
    });
  }, []);

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}
      <Modal 
        isOpen={confirmState.isOpen} 
        onClose={confirmState.onCancel}
        title={confirmState.title}
        maxWidth="max-w-md"
      >
        <div className="py-2">
          <div className="flex items-start gap-3 mb-6">
            {confirmState.danger && (
              <div className="shrink-0 p-2 bg-[var(--danger-bg)] rounded-full text-[var(--danger)]">
                <AlertTriangle size={20} />
              </div>
            )}
            <p className="text-sm text-[var(--text-secondary)] leading-relaxed mt-0.5">
              {confirmState.message}
            </p>
          </div>
          <div className="flex justify-end gap-3">
            <Button variant="ghost" onClick={confirmState.onCancel}>
              {confirmState.cancelText}
            </Button>
            <Button 
              variant={confirmState.danger ? "danger" : "primary"} 
              onClick={confirmState.onConfirm}
              autoFocus
            >
              {confirmState.confirmText}
            </Button>
          </div>
        </div>
      </Modal>
    </ConfirmContext.Provider>
  );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useConfirm = () => {
  const context = useContext(ConfirmContext);
  if (!context) throw new Error('useConfirm must be used within ConfirmProvider');
  return context;
};
