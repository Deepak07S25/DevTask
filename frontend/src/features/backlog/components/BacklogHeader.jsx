import { Link } from 'react-router-dom';
import { ChevronLeft, LayoutDashboard, Plus, Flag } from 'lucide-react';
import { Button } from '../../../design-system/Button';

export const BacklogHeader = ({ project, id, sprints, backlogTasks, onCreateSprint, onAddTask }) => (
  <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6">
    {/* Left: Project identity */}
    <div>
      <Link
        to={`/project/${id}`}
        className="inline-flex items-center gap-1.5 text-xs font-medium mb-3 transition-colors"
        style={{ color: 'var(--text-muted)' }}
        onMouseEnter={e => e.currentTarget.style.color = 'var(--accent-text)'}
        onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'}
      >
        <ChevronLeft size={14} />
        <LayoutDashboard size={13} />
        Back to Board
      </Link>

      <div className="flex items-baseline gap-2.5">
        <h1 className="text-2xl font-bold tracking-tight" style={{ color: 'var(--text-primary)' }}>
          {project?.name || 'Project'}
        </h1>
        <span className="text-lg font-light" style={{ color: 'var(--text-muted)' }}>/</span>
        <span className="text-2xl font-bold" style={{ color: 'var(--text-secondary)' }}>Backlog</span>
      </div>

      {/* Stats strip */}
      <div className="flex items-center gap-4 mt-2">
        <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
          <span className="font-semibold" style={{ color: 'var(--text-secondary)' }}>{sprints.length}</span>
          {' '}sprint{sprints.length !== 1 ? 's' : ''}
        </span>
        <span className="w-px h-3" style={{ background: 'var(--border)' }} />
        <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
          <span className="font-semibold" style={{ color: 'var(--text-secondary)' }}>{backlogTasks}</span>
          {' '}unplanned task{backlogTasks !== 1 ? 's' : ''}
        </span>
        {sprints.some(s => s.status === 'ACTIVE') && (
          <>
            <span className="w-px h-3" style={{ background: 'var(--border)' }} />
            <span className="flex items-center gap-1.5 text-xs font-medium" style={{ color: 'var(--accent-text)' }}>
              <span className="w-1.5 h-1.5 rounded-full bg-blue-500 shadow-[0_0_6px_rgba(59,130,246,0.5)]" />
              Sprint active
            </span>
          </>
        )}
      </div>
    </div>

    {/* Right: Planning actions */}
    <div className="flex flex-wrap items-center gap-3">
      <Button variant="secondary" size="md" icon={<Flag size={14} />} onClick={onCreateSprint}>
        Create Sprint
      </Button>
      <Button variant="primary" size="md" icon={<Plus size={15} />} onClick={onAddTask}>
        Add Task
      </Button>
    </div>
  </div>
);

export default BacklogHeader;
