import { useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Folder, MoreHorizontal, Pencil, Trash2 } from 'lucide-react';

/* Deterministic accent color per project name */
const PROJ_COLORS = [
  '#3b82f6','#06b6d4','#10b981','#f59e0b','#8b5cf6','#ec4899','#6366f1','#14b8a6',
];
const projColor = (name) => PROJ_COLORS[(name?.charCodeAt(0) ?? 0) % PROJ_COLORS.length];

export const ProjectCard = ({ project, onEdit, onDelete, menuOpen, onMenuToggle }) => {
  const menuRef = useRef(null);
  const color = projColor(project.name);

  useEffect(() => {
    if (!menuOpen) return;
    const handler = (e) => { if (menuRef.current && !menuRef.current.contains(e.target)) onMenuToggle(null); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [menuOpen, onMenuToggle]);

  return (
    <div className="relative group">
      <Link
        to={`/project/${project.id}`}
        className="flex items-center gap-3.5 px-4 py-3.5 rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--surface-raised)] hover:bg-[var(--surface-overlay)] hover:border-[var(--border-strong)] transition-all duration-[var(--ease-base)] block"
        style={{ textDecoration: 'none' }}
      >
        {/* Color swatch */}
        <div
          className="w-8 h-8 rounded-[var(--radius-sm)] flex items-center justify-center shrink-0 text-white text-sm font-bold"
          style={{ background: `${color}22`, border: `1px solid ${color}40` }}
        >
          <span style={{ color }}>{project.name?.charAt(0).toUpperCase()}</span>
        </div>

        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-[var(--text-primary)] truncate group-hover:text-[var(--accent-text)] transition-colors">
            {project.name}
          </p>
          {project.description && (
            <p className="text-xs text-[var(--text-muted)] truncate mt-0.5">{project.description}</p>
          )}
        </div>
      </Link>

      {/* Overflow menu */}
      <div className="absolute right-3 top-1/2 -translate-y-1/2" ref={menuRef}>
        <button
          onClick={(e) => { e.preventDefault(); onMenuToggle(menuOpen ? null : project.id); }}
          className="w-7 h-7 flex items-center justify-center rounded-[var(--radius-sm)] text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-subtle)] transition-all duration-[var(--ease-base)] opacity-0 group-hover:opacity-100"
          aria-label="Project options"
        >
          <MoreHorizontal size={14} />
        </button>

        {menuOpen && (
          <div
            className="absolute right-0 top-8 w-36 rounded-[var(--radius-md)] shadow-[var(--shadow-md)] py-1 z-50"
            style={{ background: 'var(--surface-overlay)', border: '1px solid var(--border-strong)' }}
          >
            <button
              onClick={(e) => { e.preventDefault(); onEdit(project); onMenuToggle(null); }}
              className="w-full flex items-center gap-2.5 px-3.5 py-2 text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-subtle)] transition-colors"
            >
              <Pencil size={12} /> Edit
            </button>
            <button
              onClick={(e) => { e.preventDefault(); onDelete(project.id); }}
              className="w-full flex items-center gap-2.5 px-3.5 py-2 text-xs text-red-400 hover:text-red-300 hover:bg-[var(--danger-bg)] transition-colors"
            >
              <Trash2 size={12} /> Delete
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProjectCard;
