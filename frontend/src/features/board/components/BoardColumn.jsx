import { cn } from '../../../design-system/utils';
import { TaskCard } from './TaskCard';

export const BoardColumn = ({ column, tasks, draggedTaskId, onDragOver, onDrop, onDragStart, onTaskClick }) => {
  const columnTasks = tasks.filter((t) => t.status === column.key);
  
  return (
    <div
      className={cn(
        "flex flex-col min-w-[320px] w-full rounded-[var(--radius-xl)] bg-[var(--surface-base)] border border-[var(--border)]",
        "transition-colors duration-[var(--ease-base)]"
      )}
      onDragOver={onDragOver}
      onDrop={(e) => onDrop(e, column.key)}
    >
      {/* Column Header */}
      <div className="flex items-center gap-2.5 p-4 border-b border-[var(--border)] shrink-0">
        <span className={cn("w-2.5 h-2.5 rounded-full shadow-[inset_0_0_0_1px_rgba(0,0,0,0.1)]", column.color)} />
        <h3 className="text-sm font-semibold text-[var(--text-primary)]">
          {column.label}
        </h3>
        <span className="ml-auto flex items-center justify-center min-w-[20px] h-5 px-1.5 bg-[var(--surface-overlay)] text-[var(--text-muted)] rounded-full text-xs font-medium">
          {columnTasks.length}
        </span>
      </div>

      {/* Task List */}
      <div className="flex-1 p-3 overflow-y-auto space-y-3 min-h-[150px]">
        {columnTasks.length === 0 ? (
          <div className="flex items-center justify-center h-24 border-2 border-dashed border-[var(--border)] rounded-[var(--radius-lg)] opacity-50">
            <span className="text-xs font-medium text-[var(--text-muted)]">Drop tasks here</span>
          </div>
        ) : (
          columnTasks.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              isDragged={draggedTaskId === task.id}
              onDragStart={onDragStart}
              onClick={onTaskClick}
            />
          ))
        )}
      </div>
    </div>
  );
};

export default BoardColumn;
