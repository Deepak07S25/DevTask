import { useEffect, useState, useCallback, useRef } from "react";
import { useParams, Link } from "react-router-dom";
import {
  ChevronLeft, Plus, Play, CheckCircle, Trash2,
  ChevronDown, ChevronRight, LayoutDashboard, Flag, Calendar, User,
  Layers, Bookmark, Bug, CheckSquare
} from "lucide-react";
import API from "../api/axios";
import { sprintApi } from "../api/sprintApi";
import DashboardLayout from "../layouts/DashboardLayout";
import CreateSprintModal from "../components/CreateSprintModal";
import CreateTaskModal from "../components/CreateTaskModal";
import TaskDetailModal from "../components/TaskDetailModal";
import FilterBar from "../components/FilterBar";

const PRIORITY_DOT = {
  HIGH: "bg-red-500",
  MEDIUM: "bg-amber-400",
  LOW: "bg-green-500",
};

const STATUS_BADGE = {
  TODO: "bg-zinc-700/60 text-zinc-400",
  IN_PROGRESS: "bg-sky-900/40 text-sky-400",
  DONE: "bg-green-900/40 text-green-400",
};

const SPRINT_STATUS_BADGE = {
  PLANNED: "bg-zinc-800 text-zinc-400 border border-zinc-700",
  ACTIVE: "bg-sky-900/40 text-sky-400 border border-sky-900/60",
  COMPLETED: "bg-green-900/30 text-green-400 border border-green-900/50",
};

const TYPE_ICONS = {
  EPIC: <Layers size={14} className="text-purple-400" title="Epic" />,
  STORY: <Bookmark size={14} className="text-emerald-400" title="Story" />,
  BUG: <Bug size={14} className="text-red-400" title="Bug" />,
  TASK: <CheckSquare size={14} className="text-sky-400" title="Task" />
};

const formatDate = (d) =>
  d ? new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "—";

const TaskRow = ({ task, onSelect, onAddToSprint, sprints, onRemoveFromSprint }) => {
  const [menuOpen, setMenuOpen] = useState(false);
  return (
    <div
      className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-zinc-800/60 group cursor-pointer transition"
      onClick={() => onSelect(task)}
    >
      <span className={`w-2 h-2 rounded-full flex-shrink-0 ${PRIORITY_DOT[task.priority]}`} />
      <div className="flex-shrink-0">{TYPE_ICONS[task.type || 'TASK']}</div>
      <div className="flex-1 min-w-0 flex items-center gap-2">
        <span className="text-sm text-white font-medium truncate group-hover:text-sky-400 transition">{task.title}</span>
        {task.epic && (
          <span className="text-[10px] bg-purple-900/40 text-purple-300 border border-purple-800/50 px-2 py-0.5 rounded-full font-medium flex-shrink-0 max-w-[120px] truncate hidden sm:block">
            {task.epic.title}
          </span>
        )}
      </div>
      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${STATUS_BADGE[task.status]}`}>{task.status.replace("_", " ")}</span>
      {task.assignee && (
        <span className="text-xs text-zinc-500 flex items-center gap-1"><User size={11} />{task.assignee.name}</span>
      )}
      {task.dueDate && (
        <span className="text-xs text-zinc-600 flex items-center gap-1"><Calendar size={11} />{formatDate(task.dueDate)}</span>
      )}

      {/* Move-to-sprint button */}
      <div className="relative" onClick={(e) => e.stopPropagation()}>
        {task.sprintId ? (
          <button
            onClick={() => onRemoveFromSprint(task)}
            className="opacity-0 group-hover:opacity-100 text-xs text-zinc-500 hover:text-red-400 px-2 py-1 rounded-lg hover:bg-zinc-800 transition"
          >
            → Backlog
          </button>
        ) : (
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="opacity-0 group-hover:opacity-100 text-xs text-sky-400 hover:text-sky-300 px-2 py-1 rounded-lg hover:bg-zinc-800 transition whitespace-nowrap"
          >
            + Sprint
          </button>
        )}
        {menuOpen && (
          <div className="absolute right-0 top-full mt-1 bg-zinc-900 border border-zinc-700 rounded-xl shadow-xl z-10 min-w-[160px] py-1">
            {sprints.filter(s => s.status !== "COMPLETED").map(s => (
              <button
                key={s.id}
                onClick={() => { onAddToSprint(task, s); setMenuOpen(false); }}
                className="w-full text-left text-sm px-4 py-2 hover:bg-zinc-800 text-zinc-200 hover:text-white transition"
              >
                {s.name}
              </button>
            ))}
            {sprints.filter(s => s.status !== "COMPLETED").length === 0 && (
              <span className="text-xs text-zinc-500 px-4 py-2 block">No active sprints</span>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

const SprintSection = ({
  sprint, allSprints, onUpdateStatus, onDelete, onTaskSelect, onAddToSprint, onRemoveFromSprint, onTaskCreated, onTaskUpdated, onTaskDeleted, projectId
}) => {
  const [collapsed, setCollapsed] = useState(sprint.status === "COMPLETED");
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  const statusActions = {
    PLANNED: { label: "Start Sprint", icon: <Play size={14} />, next: "ACTIVE", cls: "text-sky-400 hover:text-sky-300 hover:bg-sky-900/20" },
    ACTIVE: { label: "Complete Sprint", icon: <CheckCircle size={14} />, next: "COMPLETED", cls: "text-green-400 hover:text-green-300 hover:bg-green-900/20" },
    COMPLETED: null,
  };
  const action = statusActions[sprint.status];

  return (
    <div className="bg-zinc-900/40 border border-zinc-800 rounded-2xl">
      {/* Sprint Header */}
      <div className="flex items-center gap-3 px-5 py-4">
        <button onClick={() => setCollapsed(!collapsed)} className="text-zinc-500 hover:text-white transition">
          {collapsed ? <ChevronRight size={16} /> : <ChevronDown size={16} />}
        </button>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h3 className="font-bold text-white">{sprint.name}</h3>
            <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${SPRINT_STATUS_BADGE[sprint.status]}`}>
              {sprint.status}
            </span>
            <span className="text-xs text-zinc-500">{sprint.tasks.length} tasks</span>
          </div>
          {sprint.goal && <p className="text-xs text-zinc-500 mt-0.5">{sprint.goal}</p>}
          {(sprint.startDate || sprint.endDate) && (
            <p className="text-xs text-zinc-600 mt-0.5">
              {formatDate(sprint.startDate)} → {formatDate(sprint.endDate)}
            </p>
          )}
        </div>

        <div className="flex items-center gap-2">
          {action && (
            <button
              onClick={() => onUpdateStatus(sprint.id, action.next)}
              className={`flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg transition ${action.cls}`}
            >
              {action.icon}{action.label}
            </button>
          )}
          <button
            onClick={() => setIsCreateOpen(true)}
            className="text-xs text-zinc-500 hover:text-white px-2 py-1.5 rounded-lg hover:bg-zinc-800 transition flex items-center gap-1"
          >
            <Plus size={13} /> Task
          </button>
          {confirmDelete ? (
            <div className="flex items-center gap-1">
              <button onClick={() => onDelete(sprint.id)} className="text-xs text-red-400 hover:text-red-300 px-2 py-1 rounded bg-red-900/20">Confirm</button>
              <button onClick={() => setConfirmDelete(false)} className="text-xs text-zinc-500 hover:text-white px-2 py-1 rounded hover:bg-zinc-800">Cancel</button>
            </div>
          ) : (
            <button onClick={() => setConfirmDelete(true)} className="text-zinc-600 hover:text-red-400 p-1.5 rounded-lg hover:bg-zinc-800 transition">
              <Trash2 size={14} />
            </button>
          )}
        </div>
      </div>

      {/* Tasks */}
      {!collapsed && (
        <div className="border-t border-zinc-800 px-2 py-2">
          {sprint.tasks.length === 0 ? (
            <p className="text-center text-zinc-700 text-sm py-5">No tasks in this sprint yet</p>
          ) : (
            sprint.tasks.map(task => (
              <TaskRow
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

// ─── Main Page ───────────────────────────────────────────────────────────────
const Backlog = () => {
  const { id } = useParams();
  const [project, setProject] = useState(null);
  const [sprints, setSprints] = useState([]);
  const [backlogTasks, setBacklogTasks] = useState([]);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isSprintModalOpen, setIsSprintModalOpen] = useState(false);
  const [isCreateTaskOpen, setIsCreateTaskOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);
  const [filters, setFilters] = useState({ search: "", assigneeId: "", priority: "", type: "" });
  const debounceRef = useRef(null);

  const fetchData = useCallback(async (activeFilters) => {
    setLoading(true);
    setError(null);
    try {
      const backlogParams = new URLSearchParams({ projectId: id, sprintId: "backlog" });
      if (activeFilters?.search) backlogParams.set("search", activeFilters.search);
      if (activeFilters?.assigneeId) backlogParams.set("assigneeId", activeFilters.assigneeId);
      if (activeFilters?.priority) backlogParams.set("priority", activeFilters.priority);
      if (activeFilters?.type) backlogParams.set("type", activeFilters.type);

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
    debounceRef.current = setTimeout(() => {
      fetchData(filters);
    }, filters.search ? 350 : 0);
    return () => clearTimeout(debounceRef.current);
  }, [filters, fetchData]);

  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const handleClearFilters = () => {
    setFilters({ search: "", assigneeId: "", priority: "", type: "" });
  };

  const handleSprintCreated = (sprint) => {
    setSprints(prev => [...prev, { ...sprint, tasks: [] }]);
  };

  const handleUpdateSprintStatus = async (sprintId, status) => {
    try {
      const updated = await sprintApi.updateSprint(sprintId, { status });
      setSprints(prev => prev.map(s => s.id === sprintId ? { ...s, ...updated } : s));
    } catch { alert("Failed to update sprint."); }
  };

  const handleDeleteSprint = async (sprintId) => {
    try {
      await sprintApi.deleteSprint(sprintId);
      const deletedSprint = sprints.find(s => s.id === sprintId);
      // Return its tasks to backlog
      if (deletedSprint) {
        setBacklogTasks(prev => [...deletedSprint.tasks.map(t => ({ ...t, sprintId: null })), ...prev]);
      }
      setSprints(prev => prev.filter(s => s.id !== sprintId));
    } catch { alert("Failed to delete sprint."); }
  };

  const handleAddToSprint = async (task, sprint) => {
    try {
      await sprintApi.addTaskToSprint(sprint.id, task.id);
      setBacklogTasks(prev => prev.filter(t => t.id !== task.id));
      setSprints(prev => prev.map(s =>
        s.id === sprint.id ? { ...s, tasks: [{ ...task, sprintId: sprint.id }, ...s.tasks] } : s
      ));
    } catch { alert("Failed to add task to sprint."); }
  };

  const handleRemoveFromSprint = async (task) => {
    try {
      const currentSprint = sprints.find(s => s.id === task.sprintId);
      await sprintApi.removeTaskFromSprint(currentSprint?.id, task.id);
      setSprints(prev => prev.map(s =>
        s.id === task.sprintId ? { ...s, tasks: s.tasks.filter(t => t.id !== task.id) } : s
      ));
      setBacklogTasks(prev => [{ ...task, sprintId: null }, ...prev]);
    } catch { alert("Failed to move task to backlog."); }
  };

  const handleTaskCreated = (newTask) => {
    if (newTask.sprintId) {
      setSprints(prev => prev.map(s =>
        s.id === newTask.sprintId ? { ...s, tasks: [newTask, ...s.tasks] } : s
      ));
    } else {
      setBacklogTasks(prev => [newTask, ...prev]);
    }
  };

  const handleTaskUpdated = (updated) => {
    setSelectedTask(updated);
    setSprints(prev => prev.map(s => ({
      ...s, tasks: s.tasks.map(t => t.id === updated.id ? updated : t)
    })));
    setBacklogTasks(prev => prev.map(t => t.id === updated.id ? updated : t));
  };

  const handleTaskDeleted = (taskId) => {
    setSelectedTask(null);
    setSprints(prev => prev.map(s => ({ ...s, tasks: s.tasks.filter(t => t.id !== taskId) })));
    setBacklogTasks(prev => prev.filter(t => t.id !== taskId));
  };

  if (loading) return (
    <DashboardLayout>
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-sky-500 border-t-transparent rounded-full animate-spin" />
      </div>
    </DashboardLayout>
  );

  if (error) return (
    <DashboardLayout>
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <p className="text-red-400">{error}</p>
        <Link to="/dashboard" className="text-sky-400 hover:underline text-sm">← Dashboard</Link>
      </div>
    </DashboardLayout>
  );

  return (
    <DashboardLayout>
      {/* Header */}
      <div className="flex justify-between items-end mb-8">
        <div>
          <Link to={`/project/${id}`} className="flex items-center text-zinc-500 hover:text-sky-500 mb-4 transition">
            <ChevronLeft size={20} />
            <LayoutDashboard size={15} className="mr-1" /> Back to Board
          </Link>
          <h1 className="text-4xl font-black text-white">{project?.name} <span className="text-zinc-500">/ Backlog</span></h1>
          <p className="text-zinc-500 mt-1 text-sm">{sprints.length} sprint{sprints.length !== 1 ? "s" : ""} · {backlogTasks.length} backlog item{backlogTasks.length !== 1 ? "s" : ""}</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => setIsSprintModalOpen(true)}
            className="border border-zinc-700 hover:border-zinc-500 text-zinc-300 hover:text-white px-4 py-2 rounded-lg font-medium flex items-center gap-2 transition"
          >
            <Flag size={16} /> Create Sprint
          </button>
          <button
            onClick={() => setIsCreateTaskOpen(true)}
            className="bg-sky-600 hover:bg-sky-500 text-white px-6 py-2 rounded-lg font-bold flex items-center gap-2 transition shadow-lg shadow-sky-900/20"
          >
            <Plus size={20} /> Add Task
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <FilterBar
        filters={filters}
        onFilterChange={handleFilterChange}
        onClear={handleClearFilters}
        members={members}
      />

      <div className="space-y-4">
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
            onTaskUpdated={handleTaskUpdated}
            onTaskDeleted={handleTaskDeleted}
          />
        ))}

        {/* Backlog Section */}
        <div className="bg-zinc-900/40 border border-zinc-800 rounded-2xl">
          <div className="flex items-center gap-3 px-5 py-4 border-b border-zinc-800">
            <h3 className="font-bold text-zinc-300 flex-1">Backlog</h3>
            <span className="text-xs text-zinc-500">{backlogTasks.length} tasks</span>
          </div>
          <div className="px-2 py-2">
            {backlogTasks.length === 0 ? (
              <p className="text-center text-zinc-700 text-sm py-8">
                🎉 Backlog is empty — all tasks are in sprints
              </p>
            ) : (
              backlogTasks.map(task => (
                <TaskRow
                  key={task.id}
                  task={task}
                  onSelect={setSelectedTask}
                  onAddToSprint={handleAddToSprint}
                  onRemoveFromSprint={handleRemoveFromSprint}
                  sprints={sprints}
                />
              ))
            )}
          </div>
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
