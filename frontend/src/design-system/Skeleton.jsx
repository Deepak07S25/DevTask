import { cn } from './utils';

const R = { sm: 'var(--radius-sm)', md: 'var(--radius-md)', lg: 'var(--radius-lg)', full: 'var(--radius-full)' };

export const Skeleton = ({ width = '100%', height = '1rem', rounded = 'md', className, style }) => (
  <div
    aria-hidden
    className={cn('dt-skeleton', className)}
    style={{ width, height, borderRadius: R[rounded] ?? R.md, ...style }}
  />
);

export const SkeletonText = ({ lines = 3, className }) => (
  <div className={cn('space-y-2', className)}>
    {Array.from({ length: lines }).map((_, i) => (
      <Skeleton key={i} width={i === lines - 1 && lines > 1 ? '60%' : '100%'} height="0.8rem" />
    ))}
  </div>
);

export default Skeleton;
