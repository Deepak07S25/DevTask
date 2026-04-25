import { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { cn } from './utils';

const BASE = cn(
  'w-full text-sm bg-[var(--surface-overlay)] text-[var(--text-primary)]',
  'border border-[var(--border)] rounded-[var(--radius-md)]',
  'placeholder:text-[var(--text-muted)] outline-none',
  'transition-all duration-[var(--ease-base)]',
  'focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20',
  'disabled:opacity-50 disabled:cursor-not-allowed',
);

export const Input = ({ label, hint, error, leadingIcon, id, className, type, ...rest }) => {
  const [showPassword, setShowPassword] = useState(false);
  const isPassword = type === 'password';
  const resolvedType = isPassword ? (showPassword ? 'text' : 'password') : type;
  const fid = id || (label ? String(label).toLowerCase().replace(/\s+/g, '-') : undefined);

  return (
    <div className="w-full">
      {label && (
        <label htmlFor={fid} className="block text-xs font-medium text-[var(--text-secondary)] mb-1.5">
          {label}
        </label>
      )}
      <div className="relative group">
        {/* Leading icon */}
        {leadingIcon && (
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] group-focus-within:text-blue-400 transition-colors pointer-events-none flex">
            {leadingIcon}
          </span>
        )}

        <input
          id={fid}
          type={resolvedType}
          className={cn(
            BASE,
            error ? 'border-red-500/60 focus:border-red-500 focus:ring-red-500/20' : '',
            leadingIcon ? 'pl-9' : 'px-3.5',
            isPassword ? 'pr-10' : 'pr-3.5',
            'py-2.5',
            className,
          )}
          {...rest}
        />

        {/* Password toggle button */}
        {isPassword && (
          <button
            type="button"
            tabIndex={-1}
            onClick={() => setShowPassword(v => !v)}
            aria-label={showPassword ? 'Hide password' : 'Show password'}
            className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center justify-center text-[var(--text-muted)] hover:text-[var(--text-secondary)] transition-colors duration-[var(--ease-base)] focus:outline-none"
          >
            {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
          </button>
        )}
      </div>
      {(error || hint) && (
        <p className={cn('mt-1.5 text-xs', error ? 'text-red-400' : 'text-[var(--text-muted)]')}>
          {error || hint}
        </p>
      )}
    </div>
  );
};

export const Textarea = ({ label, hint, error, id, rows = 3, className, ...rest }) => {
  const fid = id || (label ? String(label).toLowerCase().replace(/\s+/g, '-') : undefined);
  return (
    <div className="w-full">
      {label && (
        <label htmlFor={fid} className="block text-xs font-medium text-[var(--text-secondary)] mb-1.5">
          {label}
        </label>
      )}
      <textarea
        id={fid}
        rows={rows}
        className={cn(
          BASE,
          'px-3.5 py-2.5 resize-none',
          error ? 'border-red-500/60 focus:border-red-500 focus:ring-red-500/20' : '',
          className,
        )}
        {...rest}
      />
      {(error || hint) && (
        <p className={cn('mt-1.5 text-xs', error ? 'text-red-400' : 'text-[var(--text-muted)]')}>
          {error || hint}
        </p>
      )}
    </div>
  );
};

export default Input;
