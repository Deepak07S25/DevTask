const isToday = (dateStr) => {
  if (!dateStr) return false;
  const d = new Date(dateStr);
  const now = new Date();
  return d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate();
};

const isOverdue = (dateStr, status) => {
  if (!dateStr || status === "DONE") return false;
  return new Date(dateStr) < new Date();
};

/**
 * StatsWidget — derives quick stats from the user's task array.
 * Props:
 *   tasks  — the array from /api/tasks/my-tasks
 *   projectCount — number of projects user is in
 */
const StatsWidget = ({ tasks = [], projectCount = 0 }) => {
  const inProgress = tasks.filter((t) => t.status === "IN_PROGRESS").length;
  const dueToday   = tasks.filter((t) => t.status !== "DONE" && isToday(t.dueDate)).length;
  const overdue    = tasks.filter((t) => isOverdue(t.dueDate, t.status)).length;

  const stats = [
    {
      label: "In Progress",
      value: inProgress,
      color: "text-sky-400",
      bg: "bg-sky-900/20 border-sky-900/40",
      icon: "🔄",
    },
    {
      label: "Due Today",
      value: dueToday,
      color: "text-amber-400",
      bg: "bg-amber-900/20 border-amber-900/40",
      icon: "📅",
    },
    {
      label: "Overdue",
      value: overdue,
      color: overdue > 0 ? "text-red-400" : "text-zinc-500",
      bg: overdue > 0 ? "bg-red-900/20 border-red-900/40" : "bg-zinc-800/40 border-zinc-700",
      icon: "⚠️",
    },
    {
      label: "Projects",
      value: projectCount,
      color: "text-purple-400",
      bg: "bg-purple-900/20 border-purple-900/40",
      icon: "🗂️",
    },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
      {stats.map((s) => (
        <div
          key={s.label}
          className={`border rounded-xl px-4 py-3 flex flex-col gap-1 ${s.bg}`}
        >
          <span className="text-lg">{s.icon}</span>
          <span className={`text-2xl font-black ${s.color}`}>{s.value}</span>
          <span className="text-xs text-zinc-500">{s.label}</span>
        </div>
      ))}
    </div>
  );
};

export default StatsWidget;
