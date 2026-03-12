import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  Layers, Bookmark, Bug, CheckSquare,
  Calendar, AlertCircle, Loader2,
} from "lucide-react";
import API from "../api/axios";

const TYPE_ICONS = {
  EPIC:  <Layers size={13} className="text-purple-400 flex-shrink-0" />,
  STORY: <Bookmark size={13} className="text-emerald-400 flex-shrink-0" />,
  BUG:   <Bug size={13} className="text-red-400 flex-shrink-0" />,
  TASK:  <CheckSquare size={13} className="text-sky-400 flex-shrink-0" />,
};

const PRIORITY_DOT = {
  HIGH:   "bg-red-500",
  MEDIUM: "bg-amber-400",
  LOW:    "bg-green-500",
};

const STATUS_LABEL = {
  TODO:        { label: "To Do",       cls: "bg-zinc-700 text-zinc-400" },
  IN_PROGRESS: { label: "In Progress", cls: "bg-sky-900/40 text-sky-400" },
  DONE:        { label: "Done",        cls: "bg-green-900/40 text-green-400" },
};

const isOverdue = (dueDate, status) => {
  if (!dueDate || status === "DONE") return false;
  return new Date(dueDate) < new Date();
};

const formatDate = (d) =>
  new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric" });

const MyTasksWidget = () => {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    API.get("/tasks/my-tasks")
      .then((res) => setTasks(res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12 text-zinc-600">
        <Loader2 size={20} className="animate-spin mr-2" /> Loading your tasks…
      </div>
    );
  }

  const active = tasks.filter((t) => t.status !== "DONE");
  const done   = tasks.filter((t) => t.status === "DONE");

  return (
    <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-800">
        <h2 className="font-bold text-white text-base">My Issues</h2>
        <span className="text-xs text-zinc-500">{active.length} active</span>
      </div>

      {tasks.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center px-4">
          <CheckSquare size={28} className="text-zinc-700 mb-3" />
          <p className="text-zinc-500 text-sm">No tasks assigned to you yet.</p>
        </div>
      ) : (
        <div className="divide-y divide-zinc-800/60">
          {/* Active tasks */}
          {active.map((task) => (
            <TaskRow key={task.id} task={task} />
          ))}

          {/* Completed — collapsible section */}
          {done.length > 0 && (
            <div className="px-5 py-2">
              <p className="text-[11px] text-zinc-600 font-semibold uppercase tracking-wider mt-1 mb-2">
                Done ({done.length})
              </p>
              {done.slice(0, 3).map((task) => (
                <TaskRow key={task.id} task={task} faded />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

const TaskRow = ({ task, faded = false }) => {
  const overdue = isOverdue(task.dueDate, task.status);
  const status = STATUS_LABEL[task.status];

  return (
    <Link
      to={`/project/${task.project.id}`}
      className={`flex items-center gap-3 px-5 py-3 hover:bg-zinc-800/50 transition group ${faded ? "opacity-50" : ""}`}
    >
      {/* Priority dot */}
      <span className={`w-2 h-2 rounded-full flex-shrink-0 ${PRIORITY_DOT[task.priority]}`} />

      {/* Type icon */}
      {TYPE_ICONS[task.type || "TASK"]}

      {/* Title + project */}
      <div className="flex-1 min-w-0">
        <p className={`text-sm font-medium truncate group-hover:text-sky-400 transition ${faded ? "line-through text-zinc-500" : "text-white"}`}>
          {task.title}
        </p>
        <p className="text-[11px] text-zinc-600 truncate">{task.project.name}</p>
      </div>

      {/* Status badge */}
      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex-shrink-0 ${status.cls}`}>
        {status.label}
      </span>

      {/* Due date */}
      {task.dueDate && (
        <span className={`flex items-center gap-1 text-[11px] flex-shrink-0 ${overdue ? "text-red-400" : "text-zinc-600"}`}>
          {overdue && <AlertCircle size={11} />}
          <Calendar size={11} />
          {formatDate(task.dueDate)}
        </span>
      )}
    </Link>
  );
};

export default MyTasksWidget;
