import { cn } from './utils';

export const EmptyState = ({ icon, title, body, action, className }) => (
  <div className={cn('flex flex-col items-center justify-center text-center py-14 px-6', className)}>
    {icon && <span className="text-[var(--text-muted)] mb-4 opacity-50">{icon}</span>}
    {title && <p className="text-sm font-semibold text-[var(--text-secondary)] mb-1">{title}</p>}
    {body  && <p className="text-xs text-[var(--text-muted)] max-w-[240px] leading-relaxed">{body}</p>}
    {action && <div className="mt-5">{action}</div>}
  </div>
);

export default EmptyState;
