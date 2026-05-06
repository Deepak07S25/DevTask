import { useEffect, useState } from 'react';
import API from '../api/axios';
import DashboardLayout from '../layouts/DashboardLayout';
import CreateProjectModal from '../components/CreateProjectModal';
import EditProjectModal from '../components/EditProjectModal';
import MyTasksWidget from '../components/MyTasksWidget';
import { DashboardHero } from '../features/dashboard/DashboardHero';
import { StatsBar } from '../features/dashboard/StatsBar';
import { ProjectList } from '../features/dashboard/ProjectList';
import { Skeleton } from '../design-system/Skeleton';
import { useToast } from '../design-system/Toast';
import { useConfirm } from '../design-system/Confirm';

/* Loading skeleton for the full dashboard */
const DashboardSkeleton = () => (
  <div>
    <div className="flex items-center justify-between mb-7">
      <div className="space-y-2"><Skeleton width="220px" height="24px" /><Skeleton width="180px" height="14px" /></div>
      <Skeleton width="120px" height="32px" rounded="md" />
    </div>
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
      {[1,2,3,4].map(i => <Skeleton key={i} height="68px" rounded="md" />)}
    </div>
    <div className="flex flex-col lg:grid lg:grid-cols-[1fr_340px] gap-6">
      <div className="space-y-3">
        <Skeleton height="180px" rounded="lg" />
      </div>
      <div className="space-y-2">
        {[1,2,3].map(i => <Skeleton key={i} height="60px" rounded="lg" />)}
      </div>
    </div>
  </div>
);

const Dashboard = () => {
  const [projects, setProjects] = useState([]);
  const [myTasks, setMyTasks]   = useState([]);
  const [loading, setLoading]   = useState(true);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editProject, setEditProject]   = useState(null);
  const [menuOpenId, setMenuOpenId]     = useState(null);
  const { success, error: toastError }  = useToast();
  const confirm                         = useConfirm();

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [pRes, tRes] = await Promise.all([
          API.get('/projects'),
          API.get('/tasks/my-tasks'),
        ]);
        setProjects(pRes.data);
        setMyTasks(tRes.data);
      } catch { /* silently ignore */ }
      finally { setLoading(false); }
    };
    fetchAll();
    // Close menu on outside click is handled within ProjectCard
  }, []);

  const handleProjectCreated = (p) => setProjects(prev => [p, ...prev]);
  const handleProjectUpdated = (p) => setProjects(prev => prev.map(x => x.id === p.id ? p : x));
  const handleDeleteProject  = async (id) => {
    const isConfirmed = await confirm({
      title: 'Delete Project',
      message: 'Delete this project? All tasks will be permanently removed.',
      confirmText: 'Delete',
      danger: true
    });
    if (!isConfirmed) return;
    
    try {
      await API.delete(`/projects/${id}`);
      setProjects(prev => prev.filter(p => p.id !== id));
      success('Project deleted');
    } catch (err) { toastError(err.response?.data?.error || 'Failed to delete project'); }
    setMenuOpenId(null);
  };

  return (
    <DashboardLayout>
      {loading ? (
        <DashboardSkeleton />
      ) : (
        <>
          {/* ── Hero ───────────────────────────────────────────────────── */}
          <DashboardHero onNewProject={() => setIsCreateOpen(true)} />

          {/* ── Stats Row ──────────────────────────────────────────────── */}
          <StatsBar tasks={myTasks} projectCount={projects.length} />

          {/* ── Two-column workspace ────────────────────────────────────── */}
          <div className="flex flex-col lg:grid lg:grid-cols-[1fr_340px] gap-6 items-start">

            {/* LEFT — My Work */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <h2 className="text-sm font-semibold text-[var(--text-primary)]">My Work</h2>
                <span className="text-[11px] text-[var(--text-muted)]">
                  Tasks assigned to you
                </span>
              </div>
              <MyTasksWidget />
            </div>

            {/* RIGHT — Projects */}
            <ProjectList
              projects={projects}
              onNewProject={() => setIsCreateOpen(true)}
              onEdit={(p) => { setEditProject(p); setMenuOpenId(null); }}
              onDelete={handleDeleteProject}
              menuOpenId={menuOpenId}
              onMenuToggle={setMenuOpenId}
            />
          </div>
        </>
      )}

      <CreateProjectModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
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
