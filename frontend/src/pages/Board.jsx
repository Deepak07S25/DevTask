import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { ChevronLeft, Plus, Calendar, Users } from "lucide-react";
import API from "../api/axios";
import DashboardLayout from "../layouts/DashboardLayout";
import CreateTaskModal from "../components/CreateTaskModal";
import TaskDetailModal from "../components/TaskDetailModal";
import MembersModal from "../components/MembersModal";

const PRIORITY_STYLES = {
  HIGH: "bg-red-900/40 text-red-400 border border-red-900/60",
  MEDIUM: "bg-amber-900/40 text-amber-400 border border-amber-900/60",
  LOW: "bg-green-900/40 text-green-400 border border-green-900/60",
};

const columns = [
  { key: "TODO", label: "To Do", color: "bg-zinc-500" },
  { key: "IN_PROGRESS", label: "In Progress", color: "bg-sky-500" },
  { key: "DONE", label: "Done", color: "bg-green-500" },
];

const Board = () => {
  const { id } = useParams();
  const [project, setProject] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);
  const [isMembersModalOpen, setIsMembersModalOpen] = useState(false);
  const [draggedTaskId, setDraggedTaskId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchBoardData = async () => {
      setLoading(true);
      setError(null);
      try {
        const [projRes, taskRes] = await Promise.all([
          API.get(`/projects/${id}`),
          API.get(`/tasks?projectId=${id}`),
        ]);
        setProject(projRes.data);
        setTasks(taskRes.data);
      } catch (err) {
        setError("Failed to load board. Please try again.");
      } finally {
        setLoading(false);
      }
    };
    fetchBoardData();
  }, [id]);

  // ---- Callbacks ----
  const handleTaskCreated = (newTask) => setTasks((prev) => [newTask, ...prev]);

  const handleTaskUpdated = (updatedTask) => {
    setTasks((prev) =>
      prev.map((t) => (t.id === updatedTask.id ? updatedTask : t))
    );
    setSelectedTask(updatedTask);
  };

  const handleTaskDeleted = (taskId) => {
    setTasks((prev) => prev.filter((t) => t.id !== taskId));
  };

  // ---- Drag & Drop ----
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
    // Optimistic update
    setTasks((prev) =>
      prev.map((t) => (t.id === draggedTaskId ? { ...t, status: newStatus } : t))
    );
    setDraggedTaskId(null);
    try {
      await API.patch(`/tasks/${draggedTaskId}`, { status: newStatus });
    } catch (err) {
      // Revert on failure
      setTasks((prev) =>
        prev.map((t) =>
          t.id === draggedTaskId ? { ...t, status: taskToMove.status } : t
        )
      );
      alert("Failed to update task status");
    }
  };

  // ---- Helpers ----
  const formatDueDate = (dateStr) => {
    if (!dateStr) return null;
    const date = new Date(dateStr);
    const isOverdue = date < new Date();
    const label = date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
    return { label, isOverdue };
  };

  // ---- Render ----
  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="w-8 h-8 border-2 border-sky-500 border-t-transparent rounded-full animate-spin" />
        </div>
      </DashboardLayout>
    );
  }

  if (error) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center h-64 gap-4">
          <p className="text-red-400 font-medium">{error}</p>
          <Link to="/dashboard" className="text-sky-400 hover:underline text-sm">
            ← Back to Dashboard
          </Link>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      {/* Header */}
      <div className="flex justify-between items-end mb-8">
        <div>
          <Link
            to="/dashboard"
            className="flex items-center text-zinc-500 hover:text-sky-500 mb-4 transition"
          >
            <ChevronLeft size={20} /> Back to Projects
          </Link>
          <h1 className="text-4xl font-black text-white">
            {project?.name || "Board"}
          </h1>
          {project?.description && (
            <p className="text-zinc-500 mt-1 text-sm">{project.description}</p>
          )}
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsMembersModalOpen(true)}
            className="border border-zinc-700 hover:border-zinc-500 text-zinc-300 hover:text-white px-4 py-2 rounded-lg font-medium flex items-center gap-2 transition"
          >
            <Users size={17} /> Team
          </button>
          <button
            onClick={() => setIsTaskModalOpen(true)}
            className="bg-sky-600 hover:bg-sky-500 text-white px-6 py-2 rounded-lg font-bold flex items-center gap-2 transition shadow-lg shadow-sky-900/20"
          >
            <Plus size={20} /> Add Task
          </button>
        </div>
      </div>

      {/* Kanban Columns */}
      <div className="flex gap-6 overflow-x-auto pb-4">
        {columns.map((column) => {
          const columnTasks = tasks.filter((t) => t.status === column.key);
          return (
            <div
              key={column.key}
              className="min-w-[320px] flex-shrink-0 bg-zinc-900/50 rounded-2xl p-4 border border-zinc-800"
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, column.key)}
            >
              {/* Column Header */}
              <div className="flex items-center gap-2 mb-5 px-1">
                <span className={`w-2 h-2 rounded-full ${column.color}`} />
                <h3 className="font-bold text-zinc-300">{column.label}</h3>
                <span className="ml-auto bg-zinc-800 text-zinc-500 px-2 py-0.5 rounded text-xs font-mono">
                  {columnTasks.length}
                </span>
              </div>

              {/* Task Cards */}
              <div className="space-y-3">
                {columnTasks.length === 0 && (
                  <div className="py-8 text-center text-zinc-700 text-sm border-2 border-dashed border-zinc-800 rounded-xl">
                    Drop tasks here
                  </div>
                )}
                {columnTasks.map((task) => {
                  const due = formatDueDate(task.dueDate);
                  return (
                    <div
                      key={task.id}
                      draggable
                      onDragStart={(e) => handleDragStart(e, task.id)}
                      onClick={() => setSelectedTask(task)}
                      className={`bg-zinc-900 p-4 rounded-xl border border-zinc-800 hover:border-zinc-600 shadow-sm cursor-pointer group transition-all ${
                        draggedTaskId === task.id ? "opacity-40 scale-95" : ""
                      }`}
                    >
                      {/* Priority */}
                      <div className="flex items-center justify-between mb-2.5">
                        <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${PRIORITY_STYLES[task.priority]}`}>
                          {task.priority}
                        </span>
                      </div>

                      {/* Title */}
                      <h4 className="font-bold text-white group-hover:text-sky-400 transition text-sm leading-snug mb-1.5">
                        {task.title}
                      </h4>

                      {/* Description */}
                      {task.description && (
                        <p className="text-xs text-zinc-500 line-clamp-2 mb-3">
                          {task.description}
                        </p>
                      )}

                      {/* Due Date */}
                      {due && (
                        <div className={`flex items-center gap-1.5 text-xs font-medium ${due.isOverdue ? "text-red-400" : "text-zinc-500"}`}>
                          <Calendar size={12} />
                          {due.label}
                          {due.isOverdue && <span className="text-[10px] bg-red-900/40 text-red-400 px-1.5 py-0.5 rounded-full">Overdue</span>}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* Modals */}
      <CreateTaskModal
        isOpen={isTaskModalOpen}
        onClose={() => setIsTaskModalOpen(false)}
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

      <MembersModal
        isOpen={isMembersModalOpen}
        onClose={() => setIsMembersModalOpen(false)}
        projectId={id}
      />
    </DashboardLayout>
  );
};

export default Board;
