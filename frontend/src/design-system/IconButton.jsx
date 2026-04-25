import { cn } from './utils';

const VARIANTS = {
  ghost:  'bg-transparent text-[var(--text-muted)] hover:bg-[var(--surface-overlay)] hover:text-[var(--text-primary)]',
  subtle: 'bg-[var(--surface-overlay)] text-[var(--text-secondary)] hover:bg-[var(--surface-subtle)] hover:text-[var(--text-primary)] border border-[var(--border)]',
};
const SIZES = {
  sm: 'w-7 h-7 rounded-[var(--radius-sm)]',
  md: 'w-8 h-8 rounded-[var(--radius-md)]',
};

export const IconButton = ({ icon, variant = 'ghost', size = 'md', label, className, ...rest }) => (
  <button
    aria-label={label}
    title={label}
    className={cn(
      'inline-flex items-center justify-center shrink-0 transition-all duration-[var(--ease-base)]',
      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-1 focus-visible:ring-offset-[var(--surface-base)]',
      'disabled:opacity-50 disabled:cursor-not-allowed',
      VARIANTS[variant], SIZES[size], className,
    )}
    {...rest}
  >
    {icon}
  </button>
);

export default IconButton;
