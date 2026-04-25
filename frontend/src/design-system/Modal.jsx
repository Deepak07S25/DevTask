import { X } from 'lucide-react';

/**
 * Modal — reusable shell
 * Props: isOpen, onClose, title, children, maxWidth ('sm'|'md'|'lg')
 */
const MAX = { sm: 'max-w-sm', md: 'max-w-md', lg: 'max-w-lg' };

export const Modal = ({ isOpen, onClose, title, children, maxWidth = 'md' }) => {
  if (!isOpen) return null;
  return (
    <div className="dt-backdrop" onClick={onClose}>
      <div
        className={`w-full ${MAX[maxWidth]} rounded-[var(--radius-xl)] overflow-hidden shadow-[var(--shadow-lg)]`}
        style={{ background: 'var(--surface-raised)', border: '1px solid var(--border)' }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4" style={{ borderBottom: '1px solid var(--border)' }}>
          <h2 className="text-sm font-semibold text-[var(--text-primary)]">{title}</h2>
          <button
            onClick={onClose}
            aria-label="Close"
            className="w-7 h-7 flex items-center justify-center rounded-[var(--radius-sm)] text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-overlay)] transition-all duration-[var(--ease-base)]"
          >
            <X size={16} />
          </button>
        </div>
        {/* Body */}
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
};

export default Modal;
