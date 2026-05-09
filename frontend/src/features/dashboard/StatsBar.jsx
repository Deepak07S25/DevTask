/* StatsBar — 4 at-a-glance attention metrics */

const isToday = (d) => {
  if (!d) return false;
  const n = new Date(), t = new Date(d);
  return t.getFullYear() === n.getFullYear() && t.getMonth() === n.getMonth() && t.getDate() === n.getDate();
};

// Matches any "done-like" status: Done, DONE, Released, Deployed, Closed, etc.
const isDone = (status) => {
  if (!status) return false;
  const s = status.toLowerCase();
  return s === 'done' || s === 'released' || s === 'deployed' || s === 'closed' || s === 'complete' || s === 'completed';
};

// Matches any "in progress-like" status: In Progress, IN_PROGRESS, Doing, In Review, etc.
const isInProgress = (status) => {
  if (!status) return false;
  const s = status.toLowerCase();
  return s.includes('progress') || s === 'doing' || s === 'in_progress' || s === 'in review' || s === 'testing' || s === 'qa' || s === 'staging';
};

const isOverdue = (dueDate, status) =>
  dueDate && !isDone(status) && new Date(dueDate) < new Date();

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
  const inProgress = tasks.filter(t => isInProgress(t.status)).length;
  const dueToday   = tasks.filter(t => !isDone(t.status) && isToday(t.dueDate)).length;
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
