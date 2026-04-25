import { Calendar, User, Layers, AlertCircle } from 'lucide-react';
import { Badge, StatusBadge } from '../../../design-system/Badge';
import { cn } from '../../../design-system/utils';

const SELECT = cn(
  'w-full text-sm bg-[var(--surface-overlay)] text-[var(--text-primary)] px-3 py-2',
  'border border-[var(--border)] rounded-[var(--radius-md)] outline-none appearance-none',
  'focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20',
  'transition-all duration-[var(--ease-base)] disabled:opacity-50'
);

const PRIORITY_VARIANT = { HIGH: 'danger', MEDIUM: 'warning', LOW: 'success' };
const COLORS = ['#3b82f6', '#8b5cf6', '#10b981', '#f43f5e', '#f59e0b'];

const MiniAvatar = ({ name }) => {
  const initials = name ? name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) : '?';
  return (
    <div className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold text-white shrink-0"
      style={{ background: COLORS[initials.charCodeAt(0) % COLORS.length] }}>
      {initials}
    </div>
  );
};

const MetaRow = ({ icon, label, children }) => (
  <div className="flex items-start gap-3 py-2.5" style={{ borderBottom: '1px solid var(--border)' }}>
    <div className="w-24 shrink-0 flex items-center gap-1.5 mt-0.5">
      <span style={{ color: 'var(--text-muted)' }}>{icon}</span>
      <span className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>{label}</span>
    </div>
    <div className="flex-1 text-sm" style={{ color: 'var(--text-secondary)' }}>{children}</div>
  </div>
);

/** VIEW MODE — displays metadata as scannable label-value pairs */
export const TaskMetaView = ({ task }) => {
  const isOverdue = task.dueDate && new Date(task.dueDate) < new Date() && task.status !== 'DONE';

  return (
    <div>
      <MetaRow icon={<AlertCircle size={13} />} label="Priority">
        <Badge variant={PRIORITY_VARIANT[task.priority] || 'default'}>{task.priority}</Badge>
      </MetaRow>
      <MetaRow icon={<AlertCircle size={13} />} label="Status">
        <StatusBadge status={task.status} />
      </MetaRow>
      <MetaRow icon={<User size={13} />} label="Assignee">
        {task.assignee ? (
          <div className="flex items-center gap-2">
            <MiniAvatar name={task.assignee.name} />
            <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{task.assignee.name}</span>
          </div>
        ) : (
          <span className="text-xs italic" style={{ color: 'var(--text-muted)' }}>Unassigned</span>
        )}
      </MetaRow>
      <MetaRow icon={<Calendar size={13} />} label="Due Date">
        {task.dueDate ? (
          <span className="text-sm font-medium" style={{ color: isOverdue ? 'var(--danger)' : 'var(--text-primary)' }}>
            {new Date(task.dueDate).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
            {isOverdue && <span className="ml-2 text-[10px] px-1.5 py-0.5 rounded-[var(--radius-xs)]" style={{ background: 'var(--danger-bg)', color: 'var(--danger)' }}>Overdue</span>}
          </span>
        ) : (
          <span className="text-xs italic" style={{ color: 'var(--text-muted)' }}>No due date</span>
        )}
      </MetaRow>
      {task.epic && (
        <MetaRow icon={<Layers size={13} />} label="Epic">
          <span className="text-[11px] font-semibold px-2 py-0.5 rounded-[var(--radius-xs)]"
            style={{ background: 'rgba(139,92,246,0.1)', color: '#a78bfa', border: '1px solid rgba(139,92,246,0.2)' }}>
            {task.epic.title}
          </span>
        </MetaRow>
      )}
    </div>
  );
};

/** EDIT MODE — select fields for all mutable metadata */
export const TaskMetaEdit = ({ formData, onChange, members, epics }) => (
  <div className="space-y-3">
    {/* Type */}
    <div>
      <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>Type</label>
      <div className="relative">
        <select className={SELECT} value={formData.type}
          onChange={e => { onChange('type', e.target.value); if (e.target.value === 'EPIC') onChange('epicId', ''); }}>
          <option value="TASK">Task</option>
          <option value="STORY">Story</option>
          <option value="BUG">Bug</option>
          <option value="EPIC">Epic</option>
        </select>
        <span className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-[10px]" style={{ color: 'var(--text-muted)' }}>▼</span>
      </div>
    </div>

    {/* Status */}
    <div>
      <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>Status</label>
      <div className="relative">
        <select className={SELECT} value={formData.status} onChange={e => onChange('status', e.target.value)}>
          <option value="TODO">To Do</option>
          <option value="IN_PROGRESS">In Progress</option>
          <option value="DONE">Done</option>
        </select>
        <span className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-[10px]" style={{ color: 'var(--text-muted)' }}>▼</span>
      </div>
    </div>

    {/* Priority */}
    <div>
      <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>Priority</label>
      <div className="relative">
        <select className={SELECT} value={formData.priority} onChange={e => onChange('priority', e.target.value)}>
          <option value="LOW">Low</option>
          <option value="MEDIUM">Medium</option>
          <option value="HIGH">High</option>
        </select>
        <span className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-[10px]" style={{ color: 'var(--text-muted)' }}>▼</span>
      </div>
    </div>

    {/* Assignee */}
    <div>
      <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>Assignee</label>
      <div className="relative">
        <select className={SELECT} value={formData.assigneeId} onChange={e => onChange('assigneeId', e.target.value)}>
          <option value="">— Unassigned —</option>
          {members.map(m => <option key={m.user.id} value={m.user.id}>{m.user.name}</option>)}
        </select>
        <span className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-[10px]" style={{ color: 'var(--text-muted)' }}>▼</span>
      </div>
    </div>

    {/* Due Date */}
    <div>
      <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>Due Date</label>
      <input type="date" className={SELECT}
        value={formData.dueDate} onChange={e => onChange('dueDate', e.target.value)} />
    </div>

    {/* Epic Link */}
    {formData.type !== 'EPIC' && epics.length > 0 && (
      <div>
        <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>Epic Link</label>
        <div className="relative">
          <select className={SELECT} value={formData.epicId} onChange={e => onChange('epicId', e.target.value)}>
            <option value="">— None —</option>
            {epics.map(e => <option key={e.id} value={e.id}>{e.title}</option>)}
          </select>
          <span className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-[10px]" style={{ color: 'var(--text-muted)' }}>▼</span>
        </div>
      </div>
    )}
  </div>
);

export default TaskMetaView;
