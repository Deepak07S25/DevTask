import { createElement, useEffect, useMemo, useState } from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { AlertTriangle, BarChart3, Download, Filter, ListChecks, Target, TimerReset } from "lucide-react";
import API from "../api/axios";
import DashboardLayout from "../layouts/DashboardLayout";
import { Badge, Button, Card, CardHeader, EmptyState, Skeleton, Select } from "../design-system";
import * as XLSX from "xlsx";

const PRIORITY_LABELS = {
  HIGH: "High",
  MEDIUM: "Medium",
  LOW: "Low",
};

const PRIORITY_COLORS = {
  HIGH: "#ef4444",
  MEDIUM: "#f59e0b",
  LOW: "#22c55e",
};

const getStatusColor = (status) => {
  if (!status) return "#64748b";
  const s = String(status).toLowerCase();
  if (s.includes("done") || s.includes("complete") || s.includes("finish") || s.includes("resolve")) return "#22c55e";
  if (s.includes("progress") || s.includes("review") || s.includes("test")) return "#3b82f6";
  if (s.includes("todo") || s.includes("to do") || s.includes("backlog") || s.includes("new")) return "#64748b";
  let hash = 0;
  for (let i = 0; i < status.length; i++) hash = status.charCodeAt(i) + ((hash << 5) - hash);
  const c = (Math.abs(hash) & 0x00FFFFFF).toString(16).toUpperCase();
  return "#" + "00000".substring(0, 6 - c.length) + c;
};

const dateKey = (value) => new Date(value).toISOString().slice(0, 10);
const isDone = (task) => /done|completed?|finished|resolved/i.test(task.status);
const isOpen = (task) => !isDone(task);
const isOverdue = (task, now = new Date()) => task.dueDate && isOpen(task) && new Date(task.dueDate) < now;
const isDueSoon = (task, now = new Date()) => {
  if (!task.dueDate || !isOpen(task)) return false;
  const due = new Date(task.dueDate);
  const days = (due - now) / (1000 * 60 * 60 * 24);
  return days >= 0 && days <= 7;
};

const formatPercent = (value) => `${Math.round(value)}%`;

const makeCsv = (tasks) => {
  const rows = [
    ["Project", "Key", "Task", "Status", "Priority", "Assignee", "Due date", "Updated"],
    ...tasks.map((task) => [
      task.project?.name || "",
      task.project?.key || "",
      task.title || "",
      task.status || "Unknown",
      PRIORITY_LABELS[task.priority] || task.priority,
      task.assignee?.name || "Unassigned",
      task.dueDate ? dateKey(task.dueDate) : "",
      task.updatedAt ? dateKey(task.updatedAt) : "",
    ]),
  ];

  return rows
    .map((row) => row.map((cell) => `"${String(cell).replaceAll('"', '""')}"`).join(","))
    .join("\n");
};

const StatCard = ({ icon, label, value, detail, tone = "default" }) => {
  const tones = {
    default: ["var(--surface-raised)", "var(--border)", "var(--text-primary)"],
    accent: ["var(--accent-muted)", "rgba(59,130,246,0.24)", "var(--accent-text)"],
    success: ["var(--success-bg)", "var(--success-border)", "var(--success)"],
    warning: ["var(--warning-bg)", "var(--warning-border)", "var(--warning)"],
    danger: ["var(--danger-bg)", "var(--danger-border)", "var(--danger)"],
  };
  const [background, borderColor, color] = tones[tone];

  return (
    <div className="rounded-[var(--radius-md)] border px-4 py-3" style={{ background, borderColor }}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs text-[var(--text-muted)]">{label}</p>
          <p className="mt-1 text-2xl font-black tabular-nums" style={{ color }}>{value}</p>
        </div>
        {createElement(icon, { size: 18, style: { color } })}
      </div>
      {detail && <p className="mt-2 text-xs text-[var(--text-secondary)]">{detail}</p>}
    </div>
  );
};

const ChartTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-[var(--radius-sm)] border border-[var(--border-strong)] bg-[var(--surface-overlay)] px-3 py-2 shadow-[var(--shadow-md)]">
      <p className="mb-1 text-xs font-semibold text-[var(--text-primary)]">{label}</p>
      {payload.map((entry) => (
        <p key={entry.name} className="text-xs text-[var(--text-secondary)]">
          <span style={{ color: entry.color }}>■</span> {entry.name}: {entry.value}
        </p>
      ))}
    </div>
  );
};

const ReportsSkeleton = () => (
  <div>
    <div className="mb-6 flex items-center justify-between">
      <div className="space-y-2">
        <Skeleton width="220px" height="26px" rounded="md" />
        <Skeleton width="320px" height="14px" rounded="md" />
      </div>
      <Skeleton width="130px" height="32px" rounded="md" />
    </div>
    <div className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-4">
      {[1, 2, 3, 4].map((item) => <Skeleton key={item} height="88px" rounded="lg" />)}
    </div>
    <div className="grid gap-5 lg:grid-cols-[1.2fr_0.8fr]">
      <Skeleton height="320px" rounded="lg" />
      <Skeleton height="320px" rounded="lg" />
    </div>
  </div>
);

const Reports = () => {
  const [projects, setProjects] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [projectFilter, setProjectFilter] = useState("all");
  const [range, setRange] = useState("30");

  useEffect(() => {
    const fetchReports = async () => {
      setLoading(true);
      setError("");
      try {
        const projectRes = await API.get("/projects");
        const projectList = projectRes.data;
        const taskResults = await Promise.all(
          projectList.map((project) =>
            API.get(`/tasks?projectId=${project.id}`).then((res) =>
              res.data.map((task) => ({ ...task, project: { id: project.id, name: project.name, key: project.key } })),
            ),
          ),
        );
        setProjects(projectList);
        setTasks(taskResults.flat());
      } catch {
        setError("Failed to load report data.");
      } finally {
        setLoading(false);
      }
    };

    fetchReports();
  }, []);

  const report = useMemo(() => {
    const now = new Date();
    const since = new Date(now);
    since.setDate(now.getDate() - Number(range));

    const filtered = tasks.filter((task) => {
      const matchesProject = projectFilter === "all" || task.projectId === projectFilter;
      const changedInRange = !task.updatedAt || new Date(task.updatedAt) >= since;
      return matchesProject && changedInRange;
    });

    const total = filtered.length;
    const completed = filtered.filter(isDone).length;
    const open = filtered.filter(isOpen).length;
    const overdue = filtered.filter((task) => isOverdue(task, now)).length;
    const dueSoon = filtered.filter((task) => isDueSoon(task, now)).length;
    const completionRate = total ? (completed / total) * 100 : 0;

    const statusCounts = {};
    filtered.forEach((task) => {
      const s = task.status || "Unknown";
      statusCounts[s] = (statusCounts[s] || 0) + 1;
    });

    const statusData = Object.keys(statusCounts).map((status) => ({
      name: status,
      value: statusCounts[status],
      color: getStatusColor(status),
    }));

    const priorityData = Object.keys(PRIORITY_LABELS).map((priority) => ({
      name: PRIORITY_LABELS[priority],
      value: filtered.filter((task) => task.priority === priority).length,
      color: PRIORITY_COLORS[priority],
    }));

    const projectData = projects
      .map((project) => {
        const projectTasks = filtered.filter((task) => task.projectId === project.id);
        return {
          name: project.key || project.name,
          open: projectTasks.filter(isOpen).length,
          done: projectTasks.filter(isDone).length,
          overdue: projectTasks.filter((task) => isOverdue(task, now)).length,
        };
      })
      .filter((project) => project.open || project.done || project.overdue);

    const trendDays = Array.from({ length: Math.min(Number(range), 30) }, (_, index) => {
      const date = new Date(now);
      date.setDate(now.getDate() - (Math.min(Number(range), 30) - index - 1));
      const key = dateKey(date);
      const created = filtered.filter((task) => task.createdAt && dateKey(task.createdAt) === key).length;
      const done = filtered.filter((task) => isDone(task) && task.updatedAt && dateKey(task.updatedAt) === key).length;
      return { date: key.slice(5), created, done };
    });

    const riskList = filtered
      .filter((task) => isOverdue(task, now) || task.priority === "HIGH")
      .sort((a, b) => {
        const aDue = a.dueDate ? new Date(a.dueDate).getTime() : Number.MAX_SAFE_INTEGER;
        const bDue = b.dueDate ? new Date(b.dueDate).getTime() : Number.MAX_SAFE_INTEGER;
        return aDue - bDue;
      })
      .slice(0, 6);

    return { completionRate, completed, dueSoon, filtered, open, overdue, priorityData, projectData, riskList, statusData, total, trendDays };
  }, [projectFilter, projects, range, tasks]);

  const exportCsv = () => {
    const blob = new Blob([makeCsv(report.filtered)], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "devtask-report.csv";
    link.click();
    URL.revokeObjectURL(url);
  };

  const exportExcel = () => {
    const rows = [
      ["Project", "Key", "Task", "Status", "Priority", "Assignee", "Due date", "Updated"],
      ...report.filtered.map((task) => [
        task.project?.name || "",
        task.project?.key || "",
        task.title || "",
        task.status || "Unknown",
        PRIORITY_LABELS[task.priority] || task.priority,
        task.assignee?.name || "Unassigned",
        task.dueDate ? dateKey(task.dueDate) : "",
        task.updatedAt ? dateKey(task.updatedAt) : "",
      ]),
    ];
    const ws = XLSX.utils.aoa_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Report");
    XLSX.writeFile(wb, "devtask-report.xlsx");
  };

  return (
    <DashboardLayout>
      {loading ? (
        <ReportsSkeleton />
      ) : (
        <>
          <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <div className="mb-2 flex items-center gap-2">
                <Badge variant="accent" dot>Reports</Badge>
                <span className="text-xs text-[var(--text-muted)]">Updated from live project data</span>
              </div>
              <h1 className="text-2xl font-black tracking-tight text-[var(--text-primary)]">Reporting</h1>
              <p className="mt-1 max-w-2xl text-sm text-[var(--text-secondary)]">
                Track throughput, workload health, priorities, and delivery risk across your projects.
              </p>
            </div>

            <div className="flex flex-col gap-2 sm:flex-row">
              <div className="flex items-center gap-2 rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--surface-raised)] px-2 py-1">
                <Filter size={14} className="text-[var(--text-muted)]" />
                <Select
                  value={projectFilter}
                  onChange={setProjectFilter}
                  placeholder="All projects"
                  options={[
                    { label: "All projects", value: "all" },
                    ...projects.map((p) => ({ label: p.name, value: p.id }))
                  ]}
                />
              </div>
              <div className="flex rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--surface-raised)] p-1">
                {["7", "30", "90"].map((days) => (
                  <button
                    key={days}
                    onClick={() => setRange(days)}
                    className="h-8 rounded-[var(--radius-sm)] px-3 text-xs font-semibold transition-colors"
                    style={{
                      background: range === days ? "var(--accent-muted)" : "transparent",
                      color: range === days ? "var(--accent-text)" : "var(--text-muted)",
                    }}
                  >
                    {days}d
                  </button>
                ))}
              </div>
              <div className="flex gap-2">
                <Button variant="secondary" icon={<Download size={14} />} onClick={exportCsv} disabled={!report.total}>
                  CSV
                </Button>
                <Button variant="secondary" icon={<Download size={14} />} onClick={exportExcel} disabled={!report.total}>
                  Excel
                </Button>
              </div>
            </div>
          </div>

          {error ? (
            <EmptyState title={error} description="Try refreshing the page, or open a project board to confirm task access." />
          ) : report.total === 0 ? (
            <EmptyState title="No report data yet" description="Create or update tasks in a project to populate the reporting dashboard." />
          ) : (
            <>
              <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
                <StatCard icon={ListChecks} label="Tasks tracked" value={report.total} detail={`${report.open} still open`} tone="accent" />
                <StatCard icon={Target} label="Completion" value={formatPercent(report.completionRate)} detail={`${report.completed} finished`} tone="success" />
                <StatCard icon={TimerReset} label="Due soon" value={report.dueSoon} detail="Open tasks due in 7 days" tone="warning" />
                <StatCard icon={AlertTriangle} label="Overdue" value={report.overdue} detail="Open tasks past due" tone={report.overdue ? "danger" : "default"} />
              </div>

              <div className="grid gap-5 xl:grid-cols-[1.2fr_0.8fr]">
                <Card padding="lg">
                  <CardHeader title="Project Workload" subtitle="Open, done, and overdue work by project" />
                  <div className="h-80" style={{ minWidth: 0, minHeight: 0 }}>
                    <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                      <BarChart data={report.projectData} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
                        <CartesianGrid stroke="var(--border)" vertical={false} />
                        <XAxis dataKey="name" stroke="var(--text-muted)" fontSize={11} tickLine={false} axisLine={false} />
                        <YAxis stroke="var(--text-muted)" fontSize={11} tickLine={false} axisLine={false} allowDecimals={false} />
                        <Tooltip content={<ChartTooltip />} />
                        <Bar dataKey="open" name="Open" stackId="tasks" fill="#3b82f6" radius={[0, 0, 4, 4]} />
                        <Bar dataKey="done" name="Done" stackId="tasks" fill="#22c55e" />
                        <Bar dataKey="overdue" name="Overdue" stackId="tasks" fill="#ef4444" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </Card>

                <Card padding="lg">
                  <CardHeader title="Status Mix" subtitle="Current distribution across the filtered work" />
                  <div className="grid gap-4 sm:grid-cols-[180px_1fr] xl:grid-cols-1">
                    <div className="h-52" style={{ minWidth: 0, minHeight: 0 }}>
                      <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                        <PieChart>
                          <Pie data={report.statusData} dataKey="value" innerRadius={52} outerRadius={78} paddingAngle={3}>
                            {report.statusData.map((entry) => <Cell key={entry.name} fill={entry.color} />)}
                          </Pie>
                          <Tooltip content={<ChartTooltip />} />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                    <div className="space-y-2">
                      {report.statusData.map((item) => (
                        <div key={item.name} className="flex items-center justify-between rounded-[var(--radius-sm)] bg-[var(--surface-overlay)] px-3 py-2">
                          <span className="flex items-center gap-2 text-sm text-[var(--text-secondary)]">
                            <span className="h-2 w-2 rounded-full" style={{ background: item.color }} />
                            {item.name}
                          </span>
                          <span className="text-sm font-bold tabular-nums text-[var(--text-primary)]">{item.value}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </Card>

                <Card padding="lg">
                  <CardHeader title="Throughput Trend" subtitle={`Created vs completed tasks over the last ${Math.min(Number(range), 30)} days`} />
                  <div className="h-72" style={{ minWidth: 0, minHeight: 0 }}>
                    <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                      <AreaChart data={report.trendDays} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
                        <defs>
                          <linearGradient id="createdGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                            <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                          </linearGradient>
                          <linearGradient id="doneGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3} />
                            <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid stroke="var(--border)" vertical={false} />
                        <XAxis dataKey="date" stroke="var(--text-muted)" fontSize={11} tickLine={false} axisLine={false} minTickGap={18} />
                        <YAxis stroke="var(--text-muted)" fontSize={11} tickLine={false} axisLine={false} allowDecimals={false} />
                        <Tooltip content={<ChartTooltip />} />
                        <Area dataKey="created" name="Created" stroke="#3b82f6" fill="url(#createdGradient)" strokeWidth={2} />
                        <Area dataKey="done" name="Done" stroke="#22c55e" fill="url(#doneGradient)" strokeWidth={2} />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </Card>

                <Card padding="lg">
                  <CardHeader title="Priority Focus" subtitle="Where attention is concentrated" />
                  <div className="space-y-4">
                    {report.priorityData.map((item) => {
                      const width = report.total ? (item.value / report.total) * 100 : 0;
                      return (
                        <div key={item.name}>
                          <div className="mb-1 flex items-center justify-between text-sm">
                            <span className="text-[var(--text-secondary)]">{item.name}</span>
                            <span className="font-bold tabular-nums text-[var(--text-primary)]">{item.value}</span>
                          </div>
                          <div className="h-2 overflow-hidden rounded-full bg-[var(--surface-overlay)]">
                            <div className="h-full rounded-full" style={{ width: `${width}%`, background: item.color }} />
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <div className="mt-6">
                    <div className="mb-3 flex items-center gap-2">
                      <BarChart3 size={14} className="text-[var(--text-muted)]" />
                      <h3 className="text-sm font-semibold text-[var(--text-primary)]">Risk Queue</h3>
                    </div>
                    <div className="space-y-2">
                      {report.riskList.length === 0 ? (
                        <p className="rounded-[var(--radius-sm)] border border-[var(--success-border)] bg-[var(--success-bg)] px-3 py-2 text-xs text-[var(--success)]">
                          No overdue or high-priority tasks in this view.
                        </p>
                      ) : report.riskList.map((task) => (
                        <div key={task.id} className="rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--surface-overlay)] px-3 py-2">
                          <div className="flex items-center justify-between gap-3">
                            <p className="min-w-0 truncate text-sm font-semibold text-[var(--text-primary)]">{task.title}</p>
                            <Badge variant={isOverdue(task) ? "danger" : "warning"}>{task.priority}</Badge>
                          </div>
                          <p className="mt-1 text-xs text-[var(--text-muted)]">
                            {task.project?.key || task.project?.name} · {task.dueDate ? `Due ${dateKey(task.dueDate)}` : "No due date"}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                </Card>
              </div>
            </>
          )}
        </>
      )}
    </DashboardLayout>
  );
};

export default Reports;
