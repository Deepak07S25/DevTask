import { useEffect, useState, useCallback, useRef } from "react";
import { useParams, Link } from "react-router-dom";
import API from "../api/axios";
import { sprintApi } from "../api/sprintApi";
import DashboardLayout from "../layouts/DashboardLayout";
import CreateTaskModal from "../components/CreateTaskModal";
import TaskDetailModal from "../components/TaskDetailModal";
import MembersModal from "../components/MembersModal";
import FilterBar from "../components/FilterBar";
import { BoardHeader } from "../features/board/components/BoardHeader";
import { BoardColumn } from "../features/board/components/BoardColumn";
import { Skeleton } from "../design-system/Skeleton";
import { useToast } from "../design-system/Toast";
import BoardSettingsPanel from "../components/BoardSettingsPanel";
import { AIHealthWidget } from "../features/board/components/AIHealthWidget";
import ProjectIntelligencePanel from "../features/board/components/ProjectIntelligencePanel";

const Board = () => {
  const { id } = useParams();
  const [project, setProject] = useState(null);
  const [columns, setColumns] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [sprints, setSprints] = useState([]);
  const [members, setMembers] = useState([]);
  const [activeSprint, setActiveSprint] = useState(null);
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);
  const [isMembersModalOpen, setIsMembersModalOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isIntelligenceOpen, setIsIntelligenceOpen] = useState(false);
  const [aiContext, setAiContext] = useState({ type: 'project' });
  const [draggedTaskId, setDraggedTaskId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({ search: "", assigneeId: "", priority: "", type: "" });
  const { error: toastError } = useToast();
  const debounceRef = useRef(null);

  // Fetch sprints + members once
  useEffect(() => {
    sprintApi.getSprints(id).then((data) => {
      setSprints(data);
      const active = data.find((s) => s.status === "ACTIVE");
      if (active) setActiveSprint(active);
    }).catch(() => {});
    API.get(`/projects/${id}/members`).then((res) => setMembers(res.data)).catch(() => {});
  }, [id]);

  // Fetch tasks whenever activeSprint or filters change (with debounce on search)
  const fetchTasks = useCallback(async (sprint, activeFilters) => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({ projectId: id });
      if (sprint) params.set("sprintId", sprint.id);
      if (activeFilters.search) params.set("search", activeFilters.search);
      if (activeFilters.assigneeId) params.set("assigneeId", activeFilters.assigneeId);
      if (activeFilters.priority) params.set("priority", activeFilters.priority);
      if (activeFilters.type) params.set("type", activeFilters.type);
      const [projRes, taskRes, colRes] = await Promise.all([
        API.get(`/projects/${id}`),
        API.get(`/tasks?${params.toString()}`),
        API.get(`/projects/${id}/columns`)
      ]);
      setProject(projRes.data);
      setTasks(taskRes.data);
      // Map backend custom columns to Board column format
      setColumns(colRes.data.map(c => ({
        id: c.id,
        key: c.name,
        label: c.name,
        color: c.color,
        raw: c
      })));
    } catch {
      setError("Failed to load board. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      fetchTasks(activeSprint, filters);
    }, filters.search ? 350 : 0);
    return () => clearTimeout(debounceRef.current);
  }, [activeSprint, filters, fetchTasks]);

  const handleFilterChange = (key, value) => setFilters((prev) => ({ ...prev, [key]: value }));
  const handleClearFilters = () => setFilters({ search: "", assigneeId: "", priority: "", type: "" });

  const handleTaskCreated = (newTask) => setTasks((prev) => [newTask, ...prev]);
  const handleTaskUpdated = (updatedTask) => {
    setTasks((prev) => prev.map((t) => (t.id === updatedTask.id ? updatedTask : t)));
    setSelectedTask(updatedTask);
  };
  const handleTaskDeleted = (taskId) => setTasks((prev) => prev.filter((t) => t.id !== taskId));

  // Drag & Drop
  const handleDragStart = (e, taskId) => {
    setDraggedTaskId(taskId);
    e.dataTransfer.effectAllowed = "move";
  };
  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };
  const handleDrop = async (e, newStatus) => {
    e.preventDefault();
    if (!draggedTaskId) return;
    const taskToMove = tasks.find((t) => t.id === draggedTaskId);
    if (!taskToMove || taskToMove.status === newStatus) {
      setDraggedTaskId(null);
      return;
    }
    setTasks((prev) => prev.map((t) => (t.id === draggedTaskId ? { ...t, status: newStatus } : t)));
    setDraggedTaskId(null);
    try {
      await API.patch(`/tasks/${draggedTaskId}`, { status: newStatus });
    } catch {
      setTasks((prev) => prev.map((t) => t.id === draggedTaskId ? { ...t, status: taskToMove.status } : t));
      toastError("Failed to update task status");
    }
  };

  // Loading/Error States
  if (loading && !project) {
    return (
      <DashboardLayout>
        <div className="mb-6 space-y-2">
          <Skeleton width="300px" height="32px" rounded="md" />
          <Skeleton width="150px" height="20px" rounded="md" />
        </div>
        <div className="flex gap-4 h-[calc(100vh-200px)]">
          {[1, 2, 3].map(i => <Skeleton key={i} className="flex-1 min-w-[300px]" rounded="xl" />)}
        </div>
      </DashboardLayout>
    );
  }

  if (error && !project) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center h-64 gap-4">
          <p className="text-red-400 font-medium">{error}</p>
          <Link to="/dashboard" className="text-blue-400 hover:underline text-sm">
            ← Back to Dashboard
          </Link>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="flex flex-col h-full">
        {/* Header (Project Title & Actions) */}
        <BoardHeader
          project={project}
          id={id}
          sprints={sprints}
          activeSprint={activeSprint}
          onSprintSelect={setActiveSprint}
          onOpenMembers={() => setIsMembersModalOpen(true)}
          onOpenCreateTask={() => setIsTaskModalOpen(true)}
          onOpenSettings={() => setIsSettingsOpen(true)}
          onOpenIntelligence={() => {
            setAiContext({ type: 'project' });
            setIsIntelligenceOpen(true);
          }}
        />

        {/* Filter Bar */}
        <FilterBar
          filters={filters}
          onFilterChange={handleFilterChange}
          onClear={handleClearFilters}
          members={members}
        />

        {/* Context Hints */}
        {sprints.length > 0 && !activeSprint && (
          <div className="mb-4 bg-amber-500/10 border border-amber-500/20 text-amber-500 text-sm px-4 py-2.5 rounded-[var(--radius-lg)] flex items-center gap-2">
            <span>💡</span>
            <span>Showing all tasks. Go to <Link to={`/project/${id}/backlog`} className="underline hover:text-amber-400 font-medium">Backlog</Link> to start a sprint and focus the board.</span>
          </div>
        )}
        {activeSprint && activeSprint.status !== "ACTIVE" && (
          <div className="mb-4 bg-[var(--surface-overlay)] border border-[var(--border)] text-[var(--text-secondary)] text-sm px-4 py-2.5 rounded-[var(--radius-lg)]">
            📌 Viewing <strong className="text-[var(--text-primary)]">{activeSprint.name}</strong> — status: <strong>{activeSprint.status}</strong>
          </div>
        )}

        {/* AI Health Widget */}
        <div className="mb-5">
          <AIHealthWidget projectId={id} />
        </div>

        {/* Kanban Columns */}
        <div className="flex gap-5 pb-4 overflow-x-auto items-start h-[calc(100vh-280px)]">
          {columns.map((column) => (
            <BoardColumn
              key={column.key}
              column={column}
              tasks={tasks}
              draggedTaskId={draggedTaskId}
              onDragOver={handleDragOver}
              onDrop={handleDrop}
              onDragStart={handleDragStart}
              onTaskClick={setSelectedTask}
            />
          ))}
        </div>
      </div>

      {/* Modals */}
      <CreateTaskModal
        isOpen={isTaskModalOpen}
        onClose={() => setIsTaskModalOpen(false)}
        projectId={id}
        sprintId={activeSprint?.id}
        onTaskCreated={handleTaskCreated}
      />

      {selectedTask && (
        <TaskDetailModal
          task={selectedTask}
          isOpen={!!selectedTask}
          onClose={() => setSelectedTask(null)}
          onTaskUpdated={handleTaskUpdated}
          onTaskDeleted={handleTaskDeleted}
          projectId={id}
          onAskAi={(task, initialQuery) => {
            setAiContext({ type: 'task', task, initialQuery });
            setIsIntelligenceOpen(true);
          }}
        />
      )}

      <MembersModal
        isOpen={isMembersModalOpen}
        onClose={() => setIsMembersModalOpen(false)}
        projectId={id}
      />

      {isSettingsOpen && (
        <BoardSettingsPanel
          projectId={id}
          columns={columns.map(c => ({ id: c.id, name: c.key, color: c.color }))}
          onColumnsChanged={(newCols) => {
             // Map back to our Board format
             setColumns(newCols.map(c => ({
               id: c.id,
               key: c.name,
               label: c.name,
               color: c.color,
               raw: c
             })));
             fetchTasks(activeSprint, filters); // Refresh tasks to apply new statuses
          }}
          onClose={() => setIsSettingsOpen(false)}
        />
      )}

      {/* Project Intelligence Panel — projectId from useParams, never hardcoded */}
      <ProjectIntelligencePanel
        isOpen={isIntelligenceOpen}
        onClose={() => setIsIntelligenceOpen(false)}
        projectId={id}
        projectName={project?.name}
        context={aiContext}
        onSwitchContext={setAiContext}
        tasks={tasks}
        onTaskClick={setSelectedTask}
        isTaskModalOpen={!!selectedTask}
      />
    </DashboardLayout>
  );
};

export default Board;
