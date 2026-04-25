import { useEffect, useState, useCallback, useRef } from "react";
import { useParams, Link } from "react-router-dom";
import { InboxIcon } from "lucide-react";
import API from "../api/axios";
import { sprintApi } from "../api/sprintApi";
import DashboardLayout from "../layouts/DashboardLayout";
import CreateSprintModal from "../components/CreateSprintModal";
import CreateTaskModal from "../components/CreateTaskModal";
import TaskDetailModal from "../components/TaskDetailModal";
import FilterBar from "../components/FilterBar";
import { Skeleton } from "../design-system/Skeleton";
import { useToast } from "../design-system/Toast";
import { BacklogHeader } from "../features/backlog/components/BacklogHeader";
import { SprintSection } from "../features/backlog/components/SprintSection";
import { BacklogTaskRow } from "../features/backlog/components/BacklogTaskRow";

// ─── Main Page ────────────────────────────────────────────────────────────────
const Backlog = () => {
  const { id } = useParams();
  const [project,      setProject]      = useState(null);
  const [sprints,      setSprints]      = useState([]);
  const [backlogTasks, setBacklogTasks] = useState([]);
  const [members,      setMembers]      = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [error,        setError]        = useState(null);
  const [isSprintModalOpen,  setIsSprintModalOpen]  = useState(false);
  const [isCreateTaskOpen,   setIsCreateTaskOpen]   = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);
  const [filters,      setFilters]      = useState({ search: "", assigneeId: "", priority: "", type: "" });
  const debounceRef = useRef(null);
  const { success, error: toastError } = useToast();

  // ── Data Fetching ──────────────────────────────────────────────────────────
  const fetchData = useCallback(async (activeFilters) => {
    setLoading(true);
    setError(null);
    try {
      const backlogParams = new URLSearchParams({ projectId: id, sprintId: "backlog" });
      if (activeFilters?.search)     backlogParams.set("search",     activeFilters.search);
      if (activeFilters?.assigneeId) backlogParams.set("assigneeId", activeFilters.assigneeId);
      if (activeFilters?.priority)   backlogParams.set("priority",   activeFilters.priority);
      if (activeFilters?.type)       backlogParams.set("type",       activeFilters.type);

      const [projRes, sprintsData, backlogData, membersData] = await Promise.all([
        API.get(`/projects/${id}`),
        sprintApi.getSprints(id),
        API.get(`/tasks?${backlogParams.toString()}`),
        API.get(`/projects/${id}/members`),
      ]);
      setProject(projRes.data);
      setSprints(sprintsData);
      setBacklogTasks(backlogData.data);
      setMembers(membersData.data);
    } catch {
      setError("Failed to load backlog.");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => fetchData(filters), filters.search ? 350 : 0);
    return () => clearTimeout(debounceRef.current);
  }, [filters, fetchData]);

  // ── Filter handlers ────────────────────────────────────────────────────────
  const handleFilterChange = (key, value) => setFilters(p => ({ ...p, [key]: value }));
  const handleClearFilters = () => setFilters({ search: "", assigneeId: "", priority: "", type: "" });

  // ── Sprint handlers (preserved behavior) ──────────────────────────────────
  const handleSprintCreated = (sprint) =>
    setSprints(p => [...p, { ...sprint, tasks: [] }]);

  const handleUpdateSprintStatus = async (sprintId, status) => {
    try {
      const updated = await sprintApi.updateSprint(sprintId, { status });
      setSprints(p => p.map(s => s.id === sprintId ? { ...s, ...updated } : s));
      success(`Sprint marked as ${status.toLowerCase()}`);
    } catch { toastError("Failed to update sprint."); }
  };

  const handleDeleteSprint = async (sprintId) => {
    try {
      await sprintApi.deleteSprint(sprintId);
      const deleted = sprints.find(s => s.id === sprintId);
      if (deleted) setBacklogTasks(p => [...deleted.tasks.map(t => ({ ...t, sprintId: null })), ...p]);
      setSprints(p => p.filter(s => s.id !== sprintId));
      success("Sprint deleted");
    } catch { toastError("Failed to delete sprint."); }
  };

  const handleAddToSprint = async (task, sprint) => {
    try {
      await sprintApi.addTaskToSprint(sprint.id, task.id);
      setBacklogTasks(p => p.filter(t => t.id !== task.id));
      setSprints(p => p.map(s => s.id === sprint.id ? { ...s, tasks: [{ ...task, sprintId: sprint.id }, ...s.tasks] } : s));
      success("Task added to sprint");
    } catch { toastError("Failed to add task to sprint."); }
  };

  const handleRemoveFromSprint = async (task) => {
    try {
      const sprint = sprints.find(s => s.id === task.sprintId);
      await sprintApi.removeTaskFromSprint(sprint?.id, task.id);
      setSprints(p => p.map(s => s.id === task.sprintId ? { ...s, tasks: s.tasks.filter(t => t.id !== task.id) } : s));
      setBacklogTasks(p => [{ ...task, sprintId: null }, ...p]);
      success("Task moved to backlog");
    } catch { toastError("Failed to move task to backlog."); }
  };

  // ── Task handlers ──────────────────────────────────────────────────────────
  const handleTaskCreated = (newTask) => {
    if (newTask.sprintId) {
      setSprints(p => p.map(s => s.id === newTask.sprintId ? { ...s, tasks: [newTask, ...s.tasks] } : s));
    } else {
      setBacklogTasks(p => [newTask, ...p]);
    }
  };

  const handleTaskUpdated = (updated) => {
    setSelectedTask(updated);
    setSprints(p => p.map(s => ({ ...s, tasks: s.tasks.map(t => t.id === updated.id ? updated : t) })));
    setBacklogTasks(p => p.map(t => t.id === updated.id ? updated : t));
  };

  const handleTaskDeleted = (taskId) => {
    setSelectedTask(null);
    setSprints(p => p.map(s => ({ ...s, tasks: s.tasks.filter(t => t.id !== taskId) })));
    setBacklogTasks(p => p.filter(t => t.id !== taskId));
  };

  // ── Loading / Error states ─────────────────────────────────────────────────
  if (loading && !project) {
    return (
      <DashboardLayout>
        <div className="mb-6 space-y-2">
          <Skeleton width="280px" height="32px" rounded="md" />
          <Skeleton width="160px" height="18px" rounded="md" />
        </div>
        <div className="space-y-4">
          {[1, 2].map(i => <Skeleton key={i} height="80px" rounded="xl" />)}
        </div>
      </DashboardLayout>
    );
  }

  if (error) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center h-64 gap-4">
          <p className="text-sm font-medium" style={{ color: 'var(--danger)' }}>{error}</p>
          <Link to="/dashboard" className="text-sm transition-colors" style={{ color: 'var(--accent-text)' }}>
            ← Back to Dashboard
          </Link>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      {/* Page Header */}
      <BacklogHeader
        project={project}
        id={id}
        sprints={sprints}
        backlogTasks={backlogTasks.length}
        onCreateSprint={() => setIsSprintModalOpen(true)}
        onAddTask={() => setIsCreateTaskOpen(true)}
      />

      {/* Filter Bar */}
      <FilterBar
        filters={filters}
        onFilterChange={handleFilterChange}
        onClear={handleClearFilters}
        members={members}
      />

      {/* Content */}
      <div className="space-y-4">
        {/* ── Sprint Sections heading ── */}
        {sprints.length > 0 && (
          <div className="flex items-center gap-3 px-1 pt-1">
            <p className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
              Sprints
            </p>
            <div className="flex-1 h-px" style={{ background: 'var(--border)' }} />
          </div>
        )}

        {/* Sprint Sections */}
        {sprints.map(sprint => (
          <SprintSection
            key={sprint.id}
            sprint={sprint}
            allSprints={sprints}
            projectId={id}
            onUpdateStatus={handleUpdateSprintStatus}
            onDelete={handleDeleteSprint}
            onTaskSelect={setSelectedTask}
            onAddToSprint={handleAddToSprint}
            onRemoveFromSprint={handleRemoveFromSprint}
            onTaskCreated={handleTaskCreated}
          />
        ))}

        {/* ── Backlog Section heading ── */}
        <div className="flex items-center gap-3 px-1 pt-2">
          <p className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
            Backlog
          </p>
          <div className="flex-1 h-px" style={{ background: 'var(--border)' }} />
          <span className="text-[11px] font-medium" style={{ color: 'var(--text-muted)' }}>
            {backlogTasks.length} unplanned
          </span>
        </div>

        {/* Backlog Task List */}
        <div
          className="rounded-[var(--radius-xl)] overflow-hidden"
          style={{ border: '1px solid var(--border)', background: 'var(--surface-base)' }}
        >
          {backlogTasks.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <InboxIcon size={24} className="mb-2 opacity-30" style={{ color: 'var(--text-muted)' }} />
              <p className="text-sm font-medium" style={{ color: 'var(--text-muted)' }}>Backlog is empty</p>
              <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
                All tasks are in sprints, or no tasks exist yet.
              </p>
            </div>
          ) : (
            <div className="px-2 py-2">
              {backlogTasks.map(task => (
                <BacklogTaskRow
                  key={task.id}
                  task={task}
                  onSelect={setSelectedTask}
                  onAddToSprint={handleAddToSprint}
                  onRemoveFromSprint={handleRemoveFromSprint}
                  sprints={sprints}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      <CreateSprintModal
        isOpen={isSprintModalOpen}
        onClose={() => setIsSprintModalOpen(false)}
        projectId={id}
        onSprintCreated={handleSprintCreated}
      />
      <CreateTaskModal
        isOpen={isCreateTaskOpen}
        onClose={() => setIsCreateTaskOpen(false)}
        projectId={id}
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
        />
      )}
    </DashboardLayout>
  );
};

export default Backlog;
