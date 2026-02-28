import { useEffect, useState, useRef } from "react";
import API from "../api/axios";
import DashboardLayout from "../layouts/DashboardLayout";
import CreateProjectModal from "../components/CreateProjectModal";
import EditProjectModal from "../components/EditProjectModal";
import { Folder, MoreVertical, Plus, Pencil, Trash2 } from "lucide-react";
import { Link } from "react-router-dom";

const Dashboard = () => {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editProject, setEditProject] = useState(null);
  const [menuOpenId, setMenuOpenId] = useState(null);
  const menuRef = useRef(null);

  const fetchProjects = async () => {
    try {
      const res = await API.get("/projects");
      setProjects(res.data);
    } catch {
      // Failed to fetch projects; error handling can be done here.
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
    // close menu on outside click
    const handler = (e) => { if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpenId(null); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleProjectCreated = (newProject) => setProjects([newProject, ...projects]);

  const handleProjectUpdated = (updated) => {
    setProjects((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
  };

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
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white">My Projects</h1>
          <p className="text-zinc-500 text-sm mt-1">{projects.length} project{projects.length !== 1 ? 's' : ''}</p>
        </div>
        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="bg-sky-600 hover:bg-sky-500 text-white px-5 py-2.5 rounded-lg font-bold transition shadow-lg shadow-sky-900/20 flex items-center gap-2"
        >
          <Plus size={18} /> New Project
        </button>
      </div>

      {/* Project Grid */}
      {loading ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-zinc-900 border border-zinc-800 p-6 rounded-xl animate-pulse">
              <div className="w-8 h-8 bg-zinc-800 rounded-lg mb-4" />
              <div className="h-5 bg-zinc-800 rounded w-2/3 mb-2" />
              <div className="h-3 bg-zinc-800 rounded w-full" />
            </div>
          ))}
        </div>
      ) : projects.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="w-16 h-16 bg-zinc-800 rounded-2xl flex items-center justify-center mb-4">
            <Folder className="text-zinc-600" size={32} />
          </div>
          <h3 className="text-xl font-bold text-zinc-400 mb-2">No projects yet</h3>
          <p className="text-zinc-600 text-sm mb-6">Create your first project to get started</p>
          <button onClick={() => setIsCreateModalOpen(true)} className="bg-sky-600 hover:bg-sky-500 text-white px-5 py-2.5 rounded-lg font-bold transition flex items-center gap-2">
            <Plus size={16} /> Create Project
          </button>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6" ref={menuRef}>
          {projects.map((project) => (
            <div key={project.id} className="relative group">
              <Link to={`/project/${project.id}`}>
                <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-xl hover:border-sky-500/50 transition cursor-pointer group h-full">
                  <Folder className="text-sky-500 mb-4 group-hover:scale-110 transition" size={28} />
                  <h3 className="text-xl font-bold text-white mb-2 pr-6">{project.name}</h3>
                  <p className="text-zinc-500 text-sm line-clamp-2">
                    {project.description || <span className="italic">No description</span>}
                  </p>
                </div>
              </Link>

              {/* ⋮ Menu */}
              <div className="absolute top-4 right-4">
                <button
                  onClick={(e) => { e.preventDefault(); setMenuOpenId(menuOpenId === project.id ? null : project.id); }}
                  className="p-1.5 text-zinc-600 hover:text-white hover:bg-zinc-800 rounded-lg transition opacity-0 group-hover:opacity-100"
                >
                  <MoreVertical size={16} />
                </button>

                {menuOpenId === project.id && (
                  <div className="absolute right-0 top-8 bg-zinc-800 border border-zinc-700 rounded-xl shadow-xl py-1 z-50 min-w-[140px]">
                    <button
                      onClick={(e) => { e.preventDefault(); setEditProject(project); setMenuOpenId(null); }}
                      className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-zinc-300 hover:text-white hover:bg-zinc-700 transition"
                    >
                      <Pencil size={14} /> Edit
                    </button>
                    <button
                      onClick={(e) => { e.preventDefault(); handleDeleteProject(project.id); }}
                      className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-red-400 hover:text-red-300 hover:bg-red-900/20 transition"
                    >
                      <Trash2 size={14} /> Delete
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modals */}
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
