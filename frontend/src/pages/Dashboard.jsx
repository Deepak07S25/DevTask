import { useEffect, useState, useRef } from "react";
import API from "../api/axios";
import DashboardLayout from "../layouts/DashboardLayout";
import CreateProjectModal from "../components/CreateProjectModal";
import EditProjectModal from "../components/EditProjectModal";
import MyTasksWidget from "../components/MyTasksWidget";
import StatsWidget from "../components/StatsWidget";
import { Folder, MoreVertical, Plus, Pencil, Trash2 } from "lucide-react";
import { Link } from "react-router-dom";

const Dashboard = () => {
  const [projects, setProjects] = useState([]);
  const [myTasks, setMyTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editProject, setEditProject] = useState(null);
  const [menuOpenId, setMenuOpenId] = useState(null);
  const menuRef = useRef(null);

  const fetchAll = async () => {
    try {
      const [projRes, tasksRes] = await Promise.all([
        API.get("/projects"),
        API.get("/tasks/my-tasks"),
      ]);
      setProjects(projRes.data);
      setMyTasks(tasksRes.data);
    } catch {
      // silently ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAll();
    const handler = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpenId(null);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleProjectCreated = (newProject) => setProjects([newProject, ...projects]);
  const handleProjectUpdated = (updated) =>
    setProjects((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));

  const handleDeleteProject = async (projectId) => {
    if (!window.confirm("Delete this project? All tasks will be permanently removed.")) return;
    try {
      await API.delete(`/projects/${projectId}`);
      setProjects((prev) => prev.filter((p) => p.id !== projectId));
    } catch (err) {
      alert(err.response?.data?.error || "Failed to delete project");
    }
    setMenuOpenId(null);
  };

  return (
    <DashboardLayout>
      {loading ? (
        /* ---- Loading skeleton ---- */
        <div className="grid lg:grid-cols-[1fr_380px] gap-8">
          <div className="space-y-4">
            <div className="grid grid-cols-4 gap-3">
              {[1,2,3,4].map((i) => (
                <div key={i} className="h-20 bg-zinc-900 border border-zinc-800 rounded-xl animate-pulse" />
              ))}
            </div>
            <div className="h-64 bg-zinc-900 border border-zinc-800 rounded-2xl animate-pulse" />
          </div>
          <div className="space-y-4">
            {[1,2,3].map((i) => (
              <div key={i} className="h-24 bg-zinc-900 border border-zinc-800 rounded-xl animate-pulse" />
            ))}
          </div>
        </div>
      ) : (
        /* ---- Two-column layout ---- */
        <div className="grid lg:grid-cols-[1fr_380px] gap-8 items-start">

          {/* ═══ LEFT — My Work ═══ */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h1 className="text-2xl font-black text-white">My Work</h1>
            </div>
            <StatsWidget tasks={myTasks} projectCount={projects.length} />
            <MyTasksWidget />
          </div>

          {/* ═══ RIGHT — Projects ═══ */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-white">
                Projects
                <span className="ml-2 text-sm font-normal text-zinc-500">({projects.length})</span>
              </h2>
              <button
                onClick={() => setIsCreateModalOpen(true)}
                className="bg-sky-600 hover:bg-sky-500 text-white px-4 py-2 rounded-lg font-bold text-sm transition shadow-lg shadow-sky-900/20 flex items-center gap-1.5"
              >
                <Plus size={16} /> New
              </button>
            </div>

            {projects.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center bg-zinc-900/50 border border-zinc-800 rounded-2xl">
                <Folder className="text-zinc-700 mb-3" size={28} />
                <p className="text-zinc-500 text-sm mb-4">No projects yet</p>
                <button
                  onClick={() => setIsCreateModalOpen(true)}
                  className="bg-sky-600 hover:bg-sky-500 text-white px-4 py-2 rounded-lg font-bold text-sm transition flex items-center gap-2"
                >
                  <Plus size={14} /> Create Project
                </button>
              </div>
            ) : (
              <div className="space-y-2" ref={menuRef}>
                {projects.map((project) => (
                  <div key={project.id} className="relative group">
                    <Link to={`/project/${project.id}`}>
                      <div className="flex items-center gap-3 bg-zinc-900 border border-zinc-800 px-4 py-3.5 rounded-xl hover:border-sky-500/50 transition cursor-pointer group">
                        <div className="w-8 h-8 rounded-lg bg-sky-900/30 border border-sky-900/50 flex items-center justify-center flex-shrink-0">
                          <Folder size={15} className="text-sky-400" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-bold text-white truncate group-hover:text-sky-400 transition">
                            {project.name}
                          </p>
                          {project.description && (
                            <p className="text-xs text-zinc-600 truncate">{project.description}</p>
                          )}
                        </div>
                      </div>
                    </Link>

                    {/* ⋮ Menu */}
                    <div className="absolute top-2.5 right-3">
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          setMenuOpenId(menuOpenId === project.id ? null : project.id);
                        }}
                        className="p-1 text-zinc-600 hover:text-white hover:bg-zinc-700 rounded-lg transition opacity-0 group-hover:opacity-100"
                      >
                        <MoreVertical size={14} />
                      </button>
                      {menuOpenId === project.id && (
                        <div className="absolute right-0 top-7 bg-zinc-800 border border-zinc-700 rounded-xl shadow-xl py-1 z-50 min-w-[130px]">
                          <button
                            onClick={(e) => { e.preventDefault(); setEditProject(project); setMenuOpenId(null); }}
                            className="w-full flex items-center gap-2.5 px-4 py-2 text-sm text-zinc-300 hover:text-white hover:bg-zinc-700 transition"
                          >
                            <Pencil size={13} /> Edit
                          </button>
                          <button
                            onClick={(e) => { e.preventDefault(); handleDeleteProject(project.id); }}
                            className="w-full flex items-center gap-2.5 px-4 py-2 text-sm text-red-400 hover:text-red-300 hover:bg-red-900/20 transition"
                          >
                            <Trash2 size={13} /> Delete
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      <CreateProjectModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onProjectCreated={handleProjectCreated}
      />
      <EditProjectModal
        isOpen={!!editProject}
        project={editProject}
        onClose={() => setEditProject(null)}
        onProjectUpdated={handleProjectUpdated}
      />
    </DashboardLayout>
  );
};

export default Dashboard;
