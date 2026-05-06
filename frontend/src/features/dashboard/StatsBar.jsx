/* StatsBar — 4 at-a-glance attention metrics */

const isToday = (d) => {
  if (!d) return false;
  const n = new Date(), t = new Date(d);
  return t.getFullYear() === n.getFullYear() && t.getMonth() === n.getMonth() && t.getDate() === n.getDate();
};
const isOverdue = (d, s) => d && s !== 'DONE' && new Date(d) < new Date();

const Stat = ({ value, label, accent, warn }) => (
  <div
    className="flex flex-col gap-0.5 px-4 py-3 rounded-[var(--radius-md)] border"
    style={{
      background: warn && value > 0 ? 'var(--danger-bg)' : accent ? 'var(--accent-muted)' : 'var(--surface-raised)',
      borderColor: warn && value > 0 ? 'var(--danger-border)' : accent ? 'rgba(59,130,246,0.2)' : 'var(--border)',
    }}
  >
    <span
      className="text-2xl font-black tabular-nums"
      style={{ color: warn && value > 0 ? 'var(--danger)' : accent ? 'var(--accent-text)' : 'var(--text-primary)' }}
    >
      {value}
    </span>
    <span className="text-xs text-[var(--text-muted)]">{label}</span>
  </div>
);

export const StatsBar = ({ tasks = [], projectCount = 0 }) => {
  const inProgress = tasks.filter(t => t.status === 'IN_PROGRESS').length;
  const dueToday   = tasks.filter(t => t.status !== 'DONE' && isToday(t.dueDate)).length;
  const overdue    = tasks.filter(t => isOverdue(t.dueDate, t.status)).length;

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
      <Stat value={inProgress}   label="In Progress" accent />
      <Stat value={dueToday}     label="Due Today" />
      <Stat value={overdue}      label="Overdue" warn />
      <Stat value={projectCount} label="Projects" />
    </div>
  );
};

export default StatsBar;
