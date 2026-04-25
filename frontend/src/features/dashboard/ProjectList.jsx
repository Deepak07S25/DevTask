import { Plus, Folder } from 'lucide-react';
import { Button } from '../../design-system';
import { EmptyState } from '../../design-system';
import { ProjectCard } from './ProjectCard';

export const ProjectList = ({ projects, onNewProject, onEdit, onDelete, menuOpenId, onMenuToggle }) => (
  <div>
    {/* Section header */}
    <div className="flex items-center justify-between mb-3">
      <div className="flex items-center gap-2">
        <h2 className="text-sm font-semibold text-[var(--text-primary)]">Projects</h2>
        {projects.length > 0 && (
          <span className="text-xs px-1.5 py-0.5 rounded-[var(--radius-xs)] bg-[var(--surface-subtle)] text-[var(--text-muted)] font-medium">
            {projects.length}
          </span>
        )}
      </div>
      <Button variant="ghost" size="sm" icon={<Plus size={13} />} onClick={onNewProject}>
        Add
      </Button>
    </div>

    {/* List */}
    {projects.length === 0 ? (
      <div className="rounded-[var(--radius-lg)] border border-dashed border-[var(--border)]" style={{ background: 'var(--surface-raised)' }}>
        <EmptyState
          icon={<Folder size={26} />}
          title="No projects yet"
          body="Create your first project to start organizing work."
          action={
            <Button variant="primary" size="sm" icon={<Plus size={13} />} onClick={onNewProject}>
              New Project
            </Button>
          }
        />
      </div>
    ) : (
      <div className="space-y-2">
        {projects.map(project => (
          <ProjectCard
            key={project.id}
            project={project}
            onEdit={onEdit}
            onDelete={onDelete}
            menuOpen={menuOpenId === project.id}
            onMenuToggle={onMenuToggle}
          />
        ))}
      </div>
    )}
  </div>
);

export default ProjectList;
