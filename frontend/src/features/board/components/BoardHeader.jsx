import { Link } from 'react-router-dom';
import { ChevronLeft, Plus, List, Users, ChevronDown, CheckCircle2, Settings } from 'lucide-react';
import { Button } from '../../../design-system/Button';
import { cn } from '../../../design-system/utils';
import { useState, useRef, useEffect } from 'react';

export const BoardHeader = ({ 
  project, 
  id, 
  sprints, 
  activeSprint, 
  onSprintSelect, 
  onOpenMembers, 
  onOpenCreateTask,
  onOpenSettings
}) => {
  const [isSprintDropOpen, setIsSprintDropOpen] = useState(false);
  const sprintMenuRef = useRef(null);

  useEffect(() => {
    if (!isSprintDropOpen) return;
    const handler = (e) => {
      if (sprintMenuRef.current && !sprintMenuRef.current.contains(e.target)) {
        setIsSprintDropOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [isSprintDropOpen]);

  return (
    <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-6">
      {/* Left: Project Context */}
      <div>
        <Link
          to="/dashboard"
          className="inline-flex items-center gap-1.5 text-xs font-medium text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors mb-3"
        >
          <ChevronLeft size={14} /> Back to Projects
        </Link>
        <h1 className="text-2xl font-bold tracking-tight text-[var(--text-primary)]">
          {project?.name || "Board"}
        </h1>
        {project?.description && (
          <p className="text-sm text-[var(--text-secondary)] mt-1.5 max-w-2xl line-clamp-2">
            {project.description}
          </p>
        )}
      </div>

      {/* Right: Actions */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Backlog Link */}
        <Link to={`/project/${id}/backlog`} style={{ textDecoration: 'none' }}>
          <Button variant="secondary" size="md" icon={<List size={15} />}>
            Backlog
          </Button>
        </Link>

        {/* Sprint Selector */}
        <div className="relative" ref={sprintMenuRef}>
          <Button
            variant="secondary"
            size="md"
            iconRight={<ChevronDown size={14} className={cn("transition-transform duration-[var(--ease-base)]", isSprintDropOpen && "rotate-180")} />}
            onClick={() => setIsSprintDropOpen(!isSprintDropOpen)}
          >
            {activeSprint ? activeSprint.name : "All Tasks"}
          </Button>
          
          {isSprintDropOpen && (
            <div className="absolute right-0 top-full mt-2 w-[220px] rounded-[var(--radius-md)] shadow-[var(--shadow-lg)] py-1 z-50 bg-[var(--surface-overlay)] border border-[var(--border-strong)]">
              <button
                onClick={() => { onSprintSelect(null); setIsSprintDropOpen(false); }}
                className={cn(
                  "w-full text-left px-4 py-2.5 text-sm transition-colors duration-[var(--ease-base)]",
                  !activeSprint ? "bg-[var(--accent-muted)] text-[var(--accent-text)] font-medium" : "text-[var(--text-secondary)] hover:bg-[var(--surface-subtle)] hover:text-[var(--text-primary)]"
                )}
              >
                All Tasks
              </button>
              {sprints.map((s) => (
                <button
                  key={s.id}
                  onClick={() => { onSprintSelect(s); setIsSprintDropOpen(false); }}
                  className={cn(
                    "w-full flex items-center justify-between px-4 py-2.5 text-sm transition-colors duration-[var(--ease-base)]",
                    activeSprint?.id === s.id ? "bg-[var(--accent-muted)] text-[var(--accent-text)] font-medium" : "text-[var(--text-secondary)] hover:bg-[var(--surface-subtle)] hover:text-[var(--text-primary)]"
                  )}
                >
                  <span className="truncate">{s.name}</span>
                  {s.status === "ACTIVE" && <span className="w-1.5 h-1.5 rounded-full bg-blue-500 shrink-0 shadow-[0_0_6px_rgba(59,130,246,0.5)]" title="Active Sprint" />}
                  {s.status === "COMPLETED" && <CheckCircle2 size={12} className="text-green-500 shrink-0" title="Completed Sprint" />}
                </button>
              ))}
              {sprints.length === 0 && (
                <span className="text-xs text-[var(--text-muted)] px-4 py-3 block text-center">No sprints yet</span>
              )}
            </div>
          )}
        </div>

        {/* Team Actions */}
        <Button
          variant="secondary"
          size="md"
          icon={<Users size={15} />}
          onClick={onOpenMembers}
        >
          Team
        </Button>

        {/* Settings Action */}
        <Button
          variant="secondary"
          size="md"
          icon={<Settings size={15} />}
          onClick={onOpenSettings}
        >
          Settings
        </Button>

        {/* Primary Action */}
        <Button
          variant="primary"
          size="md"
          icon={<Plus size={16} />}
          onClick={onOpenCreateTask}
        >
          Add Task
        </Button>
      </div>
    </div>
  );
};

export default BoardHeader;
