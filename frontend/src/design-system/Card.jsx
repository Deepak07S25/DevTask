import { cn } from './utils';

const PADDING = { none: '', sm: 'p-4', md: 'p-5', lg: 'p-6' };

// eslint-disable-next-line no-unused-vars
export const Card = ({ padding = 'md', hoverable, as: El = 'div', children, className, ...rest }) => (
  <El
    className={cn(
      'bg-[var(--surface-raised)] border border-[var(--border)] rounded-[var(--radius-lg)]',
      hoverable && 'transition-all duration-[var(--ease-base)] hover:border-blue-500/30 hover:bg-[var(--surface-overlay)] cursor-pointer',
      PADDING[padding], className,
    )}
    {...rest}
  >
    {children}
  </El>
);

export const CardHeader = ({ title, subtitle, action, className }) => (
  <div className={cn('flex items-center justify-between mb-4', className)}>
    <div>
      <h3 className="text-sm font-semibold text-[var(--text-primary)]">{title}</h3>
      {subtitle && <p className="text-xs text-[var(--text-muted)] mt-0.5">{subtitle}</p>}
    </div>
    {action && <div className="shrink-0">{action}</div>}
  </div>
);

export default Card;
