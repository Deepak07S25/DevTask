import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Layers, Bookmark, Bug, CheckSquare, Calendar, AlertCircle, CheckCheck } from 'lucide-react';
import API from '../api/axios';
import { StatusBadge } from '../design-system/Badge';
import { Skeleton } from '../design-system/Skeleton';
import { EmptyState } from '../design-system/EmptyState';

const TYPE_ICON = {
  EPIC:  <Layers    size={12} style={{ color: 'var(--info)' }}    className="shrink-0" />,
  STORY: <Bookmark  size={12} style={{ color: 'var(--success)' }} className="shrink-0" />,
  BUG:   <Bug       size={12} style={{ color: 'var(--danger)' }}  className="shrink-0" />,
  TASK:  <CheckSquare size={12} style={{ color: 'var(--accent-text)' }} className="shrink-0" />,
};

const PRIORITY_DOT = { HIGH: 'var(--danger)', MEDIUM: 'var(--warning)', LOW: 'var(--success)' };

const isOverdue = (d, s) => d && s !== 'DONE' && new Date(d) < new Date();
const fmtDate = d => new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

const TaskRow = ({ task, faded }) => {
  const overdue = isOverdue(task.dueDate, task.status);
  return (
    <Link
      to={`/project/${task.project.id}`}
      className="flex items-center gap-3 px-4 py-3 group transition-colors duration-[var(--ease-base)]"
      style={{ textDecoration: 'none' }}
      onMouseEnter={e => e.currentTarget.style.background = 'var(--surface-overlay)'}
      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
    >
      {/* Priority dot */}
      <span
        className="w-1.5 h-1.5 rounded-full shrink-0"
        style={{ background: PRIORITY_DOT[task.priority] ?? 'var(--text-muted)', opacity: faded ? 0.4 : 1 }}
      />

      {/* Type icon */}
      <span style={{ opacity: faded ? 0.4 : 1 }}>{TYPE_ICON[task.type] ?? TYPE_ICON.TASK}</span>

      {/* Title + project */}
      <div className="flex-1 min-w-0" style={{ opacity: faded ? 0.5 : 1 }}>
        <p className={`text-sm truncate transition-colors ${faded ? 'line-through text-[var(--text-muted)]' : 'text-[var(--text-primary)] group-hover:text-[var(--accent-text)]'}`}>
          {task.title}
        </p>
        <p className="text-[11px] text-[var(--text-muted)] truncate mt-0.5">{task.project.name}</p>
      </div>

      {/* Status */}
      <StatusBadge status={task.status} />

      {/* Due date */}
      {task.dueDate && (
        <span
          className="flex items-center gap-1 text-[11px] shrink-0"
          style={{ color: overdue ? 'var(--danger)' : 'var(--text-muted)' }}
        >
          {overdue ? <AlertCircle size={10} /> : <Calendar size={10} />}
          {fmtDate(task.dueDate)}
        </span>
      )}
    </Link>
  );
};

const MyTasksWidget = () => {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    API.get('/tasks/my-tasks')
      .then(r => setTasks(r.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const active = tasks.filter(t => t.status !== 'DONE');
  const done   = tasks.filter(t => t.status === 'DONE');

  return (
    <div className="rounded-[var(--radius-lg)] overflow-hidden" style={{ background: 'var(--surface-raised)', border: '1px solid var(--border)' }}>
      {/* Header */}
      <div
        className="flex items-center justify-between px-4 py-3.5"
        style={{ borderBottom: '1px solid var(--border)' }}
      >
        <div className="flex items-center gap-2">
          <h2 className="text-sm font-semibold text-[var(--text-primary)]">My Issues</h2>
          {!loading && active.length > 0 && (
            <span className="text-[11px] px-1.5 py-0.5 rounded-[var(--radius-xs)] font-medium"
              style={{ background: 'var(--accent-muted)', color: 'var(--accent-text)' }}>
              {active.length} active
            </span>
          )}
        </div>
      </div>

      {/* Body */}
      {loading ? (
        <div className="p-4 space-y-3">
          {[1,2,3].map(i => <Skeleton key={i} height="2.5rem" />)}
        </div>
      ) : tasks.length === 0 ? (
        <EmptyState
          icon={<CheckCheck size={24} />}
          title="You're all caught up"
          body="No tasks assigned to you yet. Ask your team lead or check project boards."
        />
      ) : (
        <div className="divide-y" style={{ '--tw-divide-opacity': 1, borderColor: 'var(--border)' }}>
          <div>
            {active.map(t => <TaskRow key={t.id} task={t} />)}
          </div>
          {done.length > 0 && (
            <div>
              <p className="px-4 pt-3 pb-1.5 text-[10px] font-semibold uppercase tracking-widest text-[var(--text-muted)]">
                Completed ({done.length})
              </p>
              {done.slice(0, 3).map(t => <TaskRow key={t.id} task={t} faded />)}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default MyTasksWidget;
