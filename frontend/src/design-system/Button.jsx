import { Loader2 } from 'lucide-react';
import { cn } from './utils';

const VARIANTS = {
  primary:   'bg-blue-600 hover:bg-blue-500 text-white border border-blue-500/40 shadow-sm hover:shadow-[0_0_16px_rgba(59,130,246,0.25)] active:bg-blue-700',
  secondary: 'bg-[var(--surface-overlay)] hover:bg-[var(--surface-subtle)] text-[var(--text-primary)] border border-[var(--border)] active:opacity-80',
  outline:   'bg-transparent hover:bg-[var(--surface-overlay)] text-[var(--text-primary)] border border-[var(--border)] hover:border-[var(--border-strong)]',
  ghost:     'bg-transparent hover:bg-[var(--surface-overlay)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] border border-transparent',
  danger:    'bg-transparent hover:bg-[var(--danger-bg)] text-red-400 hover:text-red-300 border border-transparent hover:border-[var(--danger-border)]',
};

const SIZES = {
  sm: 'h-7  px-3   text-xs  gap-1.5 rounded-[var(--radius-sm)]',
  md: 'h-8  px-4   text-sm  gap-2   rounded-[var(--radius-md)]',
  lg: 'h-10 px-5   text-sm  gap-2   rounded-[var(--radius-md)]',
};

export const Button = ({ variant = 'primary', size = 'md', loading, icon, iconRight, children, className, disabled, ...rest }) => (
  <button
    disabled={disabled || loading}
    className={cn(
      'inline-flex items-center justify-center font-semibold whitespace-nowrap select-none',
      'transition-all duration-[var(--ease-base)]',
      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--surface-base)]',
      'disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none',
      VARIANTS[variant], SIZES[size], className,
    )}
    {...rest}
  >
    {loading ? <Loader2 size={13} className="animate-spin" /> : icon ? <span className="shrink-0 flex">{icon}</span> : null}
    {children}
    {!loading && iconRight ? <span className="shrink-0 flex">{iconRight}</span> : null}
  </button>
);

export default Button;
