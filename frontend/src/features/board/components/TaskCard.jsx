import { Calendar, CheckSquare, Layers, Bookmark, Bug, AlertCircle } from 'lucide-react';
import { Badge } from '../../../design-system/Badge';
import { cn } from '../../../design-system/utils';

const PRIORITY_STYLES = {
  HIGH: 'danger',
  MEDIUM: 'warning',
  LOW: 'success',
};

const TYPE_ICONS = {
  EPIC: <Layers size={14} className="text-purple-400" title="Epic" />,
  STORY: <Bookmark size={14} className="text-emerald-400" title="Story" />,
  BUG: <Bug size={14} className="text-red-400" title="Bug" />,
  TASK: <CheckSquare size={14} className="text-sky-400" title="Task" />,
};

const formatDueDate = (dateStr) => {
  if (!dateStr) return null;
  const date = new Date(dateStr);
  const isOverdue = date < new Date();
  const label = date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  return { label, isOverdue };
};

export const TaskCard = ({ task, isDragged, onDragStart, onClick }) => {
  const due = formatDueDate(task.dueDate);

  return (
    <div
      draggable
      onDragStart={(e) => onDragStart(e, task.id)}
      onClick={() => onClick(task)}
      className={cn(
        "bg-[var(--surface-raised)] p-3.5 rounded-[var(--radius-lg)] border border-[var(--border)]",
        "hover:border-blue-500/40 hover:bg-[var(--surface-overlay)] cursor-pointer group transition-all duration-[var(--ease-base)]",
        isDragged ? "opacity-50 scale-[0.98] border-dashed border-blue-500/50" : "shadow-[var(--shadow-sm)]"
      )}
    >
      {/* Top: Issue Type & Priority */}
      <div className="flex items-center justify-between mb-2">
        <Badge variant={PRIORITY_STYLES[task.priority] || 'default'}>
          {task.priority}
        </Badge>
        <span className="opacity-80 group-hover:opacity-100 transition-opacity">
          {TYPE_ICONS[task.type || 'TASK']}
        </span>
      </div>

      {/* Title */}
      <h4 className="font-semibold text-[var(--text-primary)] text-sm leading-snug mb-1.5 group-hover:text-[var(--accent-text)] transition-colors">
        {task.title}
      </h4>

      {/* Epic Link */}
      {task.epic && (
        <div className="mb-2.5">
          <span className="inline-block text-[10px] font-semibold tracking-wide px-2 py-0.5 rounded-[var(--radius-sm)] bg-purple-500/10 text-purple-400 border border-purple-500/20 truncate max-w-full">
            {task.epic.title}
          </span>
        </div>
      )}

      {/* Description Preview */}
      {task.description && (
        <p className="text-xs text-[var(--text-muted)] line-clamp-2 mb-3 leading-relaxed">
          {task.description
            .replace(/#{1,6}\s*/g, '')
            .replace(/\*\*(.+?)\*\*/g, '$1')
            .replace(/\*(.+?)\*/g, '$1')
            .replace(/`{1,3}[^`]*`{1,3}/g, '')
            .replace(/^[-*+]\s+/gm, '')
            .replace(/!?\[.*?\]\(.*?\)/g, '')
            .replace(/\n+/g, ' ')
            .trim()}
        </p>
      )}

      {/* Footer: Due Date & Assignee */}
      {(due || task.assignee) && (
        <div className="flex items-center gap-2 mt-auto pt-2">
          {due && (
            <div className={cn("flex items-center gap-1 text-xs font-medium", due.isOverdue ? "text-red-400" : "text-[var(--text-muted)]")}>
              {due.isOverdue ? <AlertCircle size={12} /> : <Calendar size={12} />}
              <span>{due.label}</span>
            </div>
          )}
          {task.assignee && (
            <span className="ml-auto text-[10px] font-medium text-[var(--text-secondary)] bg-[var(--surface-subtle)] px-2 py-0.5 rounded-[var(--radius-sm)] truncate max-w-[100px]">
              {task.assignee.name}
            </span>
          )}
        </div>
      )}
    </div>
  );
};

export default TaskCard;
