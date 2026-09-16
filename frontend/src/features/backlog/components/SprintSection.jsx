import { useState } from 'react';
import { ChevronDown, ChevronRight, Play, CheckCircle, Trash2, Plus, Calendar, Sparkles } from 'lucide-react';
import { Button } from '../../../design-system/Button';
import { IconButton } from '../../../design-system/IconButton';
import { BacklogTaskRow } from './BacklogTaskRow';
import CreateTaskModal from '../../../components/CreateTaskModal';

const SPRINT_STATUS = {
  PLANNED:   { label: 'Planned',   bg: 'var(--surface-subtle)', text: 'var(--text-muted)', dot: '#6b7280' },
  ACTIVE:    { label: 'Active',    bg: 'rgba(59,130,246,0.1)',  text: '#3b82f6',           dot: '#3b82f6' },
  COMPLETED: { label: 'Completed', bg: 'rgba(34,197,94,0.08)', text: '#22c55e',            dot: '#22c55e' },
};

const formatDate = (d) =>
  d ? new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : null;

export const SprintSection = ({
  sprint, allSprints, projectId,
  onUpdateStatus, onDelete,
  onTaskSelect, onAddToSprint, onRemoveFromSprint,
  onTaskCreated, onReviewSprint,
}) => {
  const [collapsed, setCollapsed]       = useState(sprint.status === 'COMPLETED');
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  const meta = SPRINT_STATUS[sprint.status] || SPRINT_STATUS.PLANNED;
  const isActive    = sprint.status === 'ACTIVE';
  const isCompleted = sprint.status === 'COMPLETED';

  return (
    <div
      className="rounded-[var(--radius-xl)] overflow-hidden transition-all duration-150"
      style={{
        border: `1px solid ${isActive ? 'rgba(59,130,246,0.25)' : 'var(--border)'}`,
        background: isCompleted ? 'var(--surface-base)' : 'var(--surface-raised)',
        opacity: isCompleted ? 0.8 : 1,
      }}
    >
      {/* Sprint Header */}
      <div
        className="flex items-center gap-3 px-4 py-3"
        style={{
          borderBottom: collapsed ? 'none' : '1px solid var(--border)',
          background: isActive ? 'rgba(59,130,246,0.04)' : 'transparent',
        }}
      >
        {/* Collapse toggle */}
        <button
          onClick={() => setCollapsed(v => !v)}
          className="shrink-0 transition-colors duration-150"
          style={{ color: 'var(--text-muted)' }}
        >
          {collapsed ? <ChevronRight size={15} /> : <ChevronDown size={15} />}
        </button>

        {/* Sprint identity */}
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Status pill */}
            <span
              className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-[var(--radius-xs)]"
              style={{ background: meta.bg, color: meta.text }}
            >
              <span className="w-1.5 h-1.5 rounded-full" style={{ background: meta.dot }} />
              {meta.label}
            </span>

            <h3 className="text-sm font-semibold truncate" style={{ color: 'var(--text-primary)' }}>
              {sprint.name}
            </h3>

            {/* Task count */}
            <span
              className="text-xs px-1.5 py-0.5 rounded-[var(--radius-xs)] font-medium"
              style={{ background: 'var(--surface-overlay)', color: 'var(--text-muted)' }}
            >
              {sprint.tasks.length} task{sprint.tasks.length !== 1 ? 's' : ''}
            </span>
          </div>

          {/* Goal + Dates */}
          {(sprint.goal || sprint.startDate || sprint.endDate) && (
            <div className="flex flex-wrap items-center gap-3 mt-1">
              {sprint.goal && (
                <p className="text-xs truncate max-w-xs" style={{ color: 'var(--text-muted)' }}>
                  {sprint.goal}
                </p>
              )}
              {(sprint.startDate || sprint.endDate) && (
                <span className="flex items-center gap-1 text-[11px]" style={{ color: 'var(--text-muted)' }}>
                  <Calendar size={11} />
                  {formatDate(sprint.startDate)} → {formatDate(sprint.endDate)}
                </span>
              )}
            </div>
          )}
        </div>

        {/* Sprint actions */}
        <div className="flex items-center gap-2 shrink-0">
          {onReviewSprint && (
            <Button
              variant="ghost"
              size="sm"
              className="text-[var(--ai-accent,#8b5cf6)] hover:bg-[var(--ai-accent-muted,rgba(139,92,246,0.1))] px-2"
              icon={<Sparkles size={12} style={{ color: 'var(--ai-accent-text, #a78bfa)' }} />}
              onClick={() => onReviewSprint(sprint)}
              title="Review sprint feasibility & risks"
            >
              Review
            </Button>
          )}

          {/* Add task */}
          <Button
            variant="ghost"
            size="sm"
            icon={<Plus size={13} />}
            onClick={() => setIsCreateOpen(true)}
          >
            Task
          </Button>

          {/* Start / Complete */}
          {sprint.status === 'PLANNED' && (
            <Button
              variant="secondary"
              size="sm"
              icon={<Play size={12} />}
              onClick={() => onUpdateStatus(sprint.id, 'ACTIVE')}
              style={{ color: 'var(--accent-text)', borderColor: 'rgba(59,130,246,0.3)' }}
            >
              Start
            </Button>
          )}
          {sprint.status === 'ACTIVE' && (
            <Button
              variant="secondary"
              size="sm"
              icon={<CheckCircle size={12} />}
              onClick={() => onUpdateStatus(sprint.id, 'COMPLETED')}
              style={{ color: '#22c55e', borderColor: 'rgba(34,197,94,0.3)' }}
            >
              Complete
            </Button>
          )}

          {/* Delete */}
          {confirmDelete ? (
            <div className="flex items-center gap-1.5">
              <Button variant="danger" size="sm" onClick={() => onDelete(sprint.id)}>Delete</Button>
              <Button variant="ghost" size="sm" onClick={() => setConfirmDelete(false)}>Cancel</Button>
            </div>
          ) : (
            <IconButton
              icon={<Trash2 size={13} />}
              variant="ghost"
              size="sm"
              onClick={() => setConfirmDelete(true)}
              label="Delete sprint"
              style={{ color: 'var(--text-muted)' }}
            />
          )}
        </div>
      </div>

      {/* Task List */}
      {!collapsed && (
        <div className="px-2 py-2">
          {sprint.tasks.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                No tasks in this sprint yet.
              </p>
              <button
                onClick={() => setIsCreateOpen(true)}
                className="mt-2 text-xs font-medium transition-colors"
                style={{ color: 'var(--accent-text)' }}
              >
                + Add a task
              </button>
            </div>
          ) : (
            sprint.tasks.map(task => (
              <BacklogTaskRow
                key={task.id}
                task={task}
                onSelect={onTaskSelect}
                onAddToSprint={onAddToSprint}
                onRemoveFromSprint={onRemoveFromSprint}
                sprints={allSprints}
              />
            ))
          )}
        </div>
      )}

      <CreateTaskModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        projectId={projectId}
        sprintId={sprint.id}
        onTaskCreated={onTaskCreated}
      />
    </div>
  );
};

export default SprintSection;
