import { cn } from './utils';

const STYLES = {
  default: 'bg-[var(--surface-subtle)] text-[var(--text-secondary)] border-[var(--border)]',
  accent:  'bg-[var(--accent-muted)] text-[var(--accent-text)] border-blue-500/20',
  success: 'bg-[var(--success-bg)] text-[var(--success)] border-[var(--success-border)]',
  warning: 'bg-[var(--warning-bg)] text-[var(--warning)] border-[var(--warning-border)]',
  danger:  'bg-[var(--danger-bg)] text-[var(--danger)] border-[var(--danger-border)]',
  info:    'bg-[var(--info-bg)] text-[var(--info)] border-[var(--info-border)]',
};
const DOT = {
  default:'bg-[var(--text-muted)]', accent:'bg-blue-400',
  success:'bg-green-400', warning:'bg-amber-400', danger:'bg-red-400', info:'bg-cyan-400',
};

export const Badge = ({ variant = 'default', dot, children, className, ...rest }) => (
  <span
    className={cn(
      'inline-flex items-center gap-1 text-[11px] font-semibold uppercase tracking-wide px-2 py-0.5 rounded-[var(--radius-xs)] border',
      STYLES[variant], className,
    )}
    {...rest}
  >
    {dot && <span className={cn('w-1.5 h-1.5 rounded-full shrink-0', DOT[variant])} />}
    {children}
  </span>
);

const STATUS_MAP = {
  TODO:        { v: 'default', l: 'To Do' },
  IN_PROGRESS: { v: 'accent',  l: 'In Progress' },
  IN_REVIEW:   { v: 'info',    l: 'In Review' },
  DONE:        { v: 'success', l: 'Done' },
};

export const StatusBadge = ({ status, ...rest }) => {
  const { v, l } = STATUS_MAP[status] ?? { v: 'default', l: status };
  return <Badge variant={v} dot {...rest}>{l}</Badge>;
};

export default Badge;
