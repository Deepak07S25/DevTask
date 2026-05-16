import { useState, useRef, useEffect } from 'react';
import { Layers, Bookmark, Bug, CheckSquare, User, Calendar, ArrowRight, CornerDownLeft } from 'lucide-react';
import { StatusBadge } from '../../../design-system/Badge';
import { RiskBadge } from '../../../design-system/RiskBadge';

const PRIORITY_DOT = { HIGH: '#ef4444', MEDIUM: '#f59e0b', LOW: '#22c55e' };

const TYPE_ICONS = {
  EPIC:  <Layers size={13} style={{ color: '#a78bfa' }} />,
  STORY: <Bookmark size={13} style={{ color: '#34d399' }} />,
  BUG:   <Bug size={13} style={{ color: '#f87171' }} />,
  TASK:  <CheckSquare size={13} style={{ color: '#38bdf8' }} />,
};

const formatDate = (d) =>
  d ? new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : null;

const SprintStatusDot = ({ status }) => {
  const colors = { ACTIVE: '#3b82f6', PLANNED: '#6b7280', COMPLETED: '#22c55e' };
  return <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: colors[status] || '#6b7280' }} />;
};

export const BacklogTaskRow = ({ task, onSelect, onAddToSprint, onRemoveFromSprint, sprints }) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);
  const isOverdue = task.dueDate && new Date(task.dueDate) < new Date() && task.status !== 'DONE';
  const plannableSprints = (sprints || []).filter(s => s.status !== 'COMPLETED');

  useEffect(() => {
    if (!menuOpen) return;
    const close = (e) => { if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false); };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, [menuOpen]);

  return (
    <div
      className="flex items-center gap-3 px-4 py-2.5 rounded-[var(--radius-md)] group cursor-pointer transition-colors duration-150 hover:bg-[var(--surface-subtle)]"
      onClick={() => onSelect(task)}
    >
      {/* Priority dot */}
      <span
        className="w-2 h-2 rounded-full shrink-0 mt-px"
        style={{ background: PRIORITY_DOT[task.priority] || '#6b7280' }}
        title={task.priority}
      />

      {/* Issue type icon */}
      <span className="shrink-0 flex">{TYPE_ICONS[task.type || 'TASK']}</span>

      {/* Title + Epic */}
      <div className="flex-1 min-w-0 flex items-center gap-2">
        <span
          className="text-sm font-medium truncate transition-colors group-hover:text-[var(--accent-text)]"
          style={{ color: 'var(--text-primary)' }}
        >
          {task.title}
        </span>
        {task.epic && (
          <span
            className="text-[10px] font-semibold px-1.5 py-0.5 rounded-[var(--radius-xs)] shrink-0 hidden sm:block truncate max-w-[110px]"
            style={{ background: 'rgba(139,92,246,0.12)', color: '#a78bfa', border: '1px solid rgba(139,92,246,0.2)' }}
          >
            {task.epic.title}
          </span>
        )}
        {task.riskLevel && task.riskLevel !== 'NONE' && (
          <RiskBadge level={task.riskLevel} showLabel={false} className="shrink-0" />
        )}
      </div>

      {/* Status */}
      <div className="shrink-0"><StatusBadge status={task.status} /></div>

      {/* Assignee */}
      {task.assignee && (
        <span className="text-[11px] hidden md:flex items-center gap-1 shrink-0" style={{ color: 'var(--text-muted)' }}>
          <User size={11} />
          <span className="max-w-[72px] truncate">{task.assignee.name}</span>
        </span>
      )}

      {/* Due date */}
      {task.dueDate && (
        <span
          className="text-[11px] hidden lg:flex items-center gap-1 shrink-0"
          style={{ color: isOverdue ? 'var(--danger)' : 'var(--text-muted)' }}
        >
          <Calendar size={11} />
          {formatDate(task.dueDate)}
        </span>
      )}

      {/* Move affordance */}
      <div
        className="relative shrink-0 w-[70px] flex justify-end"
        ref={menuRef}
        onClick={e => e.stopPropagation()}
      >
        {task.sprintId ? (
          <button
            onClick={() => onRemoveFromSprint(task)}
            className="opacity-0 group-hover:opacity-100 flex items-center gap-1 text-[11px] font-medium px-2 py-1 rounded-[var(--radius-sm)] transition-all duration-150 border"
            style={{ color: 'var(--text-muted)', borderColor: 'var(--border)' }}
            onMouseEnter={e => { e.currentTarget.style.color = 'var(--danger)'; e.currentTarget.style.borderColor = 'var(--danger-border)'; e.currentTarget.style.background = 'var(--danger-bg)'; }}
            onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-muted)'; e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.background = 'transparent'; }}
            title="Move to Backlog"
          >
            <CornerDownLeft size={11} /> Backlog
          </button>
        ) : (
          <>
            <button
              onClick={() => setMenuOpen(v => !v)}
              className="opacity-0 group-hover:opacity-100 flex items-center gap-1 text-[11px] font-medium px-2 py-1 rounded-[var(--radius-sm)] transition-all duration-150 border"
              style={{ color: 'var(--accent-text)', borderColor: 'rgba(59,130,246,0.3)', background: 'rgba(59,130,246,0.08)' }}
              title="Add to Sprint"
            >
              <ArrowRight size={11} /> Sprint
            </button>
            {menuOpen && (
              <div
                className="absolute right-0 top-full mt-1 rounded-[var(--radius-md)] shadow-[var(--shadow-md)] z-20 min-w-[168px] py-1 overflow-hidden"
                style={{ background: 'var(--surface-overlay)', border: '1px solid var(--border-strong)' }}
              >
                {plannableSprints.length === 0 ? (
                  <span className="block px-4 py-3 text-xs text-center" style={{ color: 'var(--text-muted)' }}>
                    No active sprints
                  </span>
                ) : (
                  plannableSprints.map(s => (
                    <button
                      key={s.id}
                      onClick={() => { onAddToSprint(task, s); setMenuOpen(false); }}
                      className="w-full text-left text-xs px-4 py-2.5 flex items-center justify-between gap-3 transition-colors duration-100"
                      style={{ color: 'var(--text-secondary)' }}
                      onMouseEnter={e => { e.currentTarget.style.background = 'var(--surface-subtle)'; e.currentTarget.style.color = 'var(--text-primary)'; }}
                      onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text-secondary)'; }}
                    >
                      <span className="font-medium truncate">{s.name}</span>
                      <SprintStatusDot status={s.status} />
                    </button>
                  ))
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default BacklogTaskRow;
