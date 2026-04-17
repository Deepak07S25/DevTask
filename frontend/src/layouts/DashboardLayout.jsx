import { useContext, useEffect, useState } from 'react';
import { AuthContext } from '../context/AuthContext';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { LayoutGrid, LogOut, ChevronRight, PanelLeftClose, PanelLeft } from 'lucide-react';
import API from '../api/axios';

const Avatar = ({ name, size = 'sm' }) => {
  const initials = name ? name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2) : '?';
  const colors = ['bg-sky-600', 'bg-violet-600', 'bg-emerald-600', 'bg-rose-600', 'bg-amber-600'];
  const color = colors[initials.charCodeAt(0) % colors.length];
  const dim = size === 'lg' ? 'w-9 h-9 text-sm' : 'w-8 h-8 text-xs';
  return (
    <div className={`${dim} rounded-full ${color} flex items-center justify-center font-bold text-white flex-shrink-0`}>
      {initials}
    </div>
  );
};

const DashboardLayout = ({ children }) => {
  const { logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();
  const [profile, setProfile] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  useEffect(() => {
    API.get('/auth/me')
      .then((res) => setProfile(res.data))
      .catch(() => {});
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isActive = (path) => location.pathname === path;

  return (
    <div className="flex min-h-screen bg-zinc-950 text-zinc-100">
      {/* Sidebar */}
      <aside
        className={`${sidebarOpen ? 'w-64' : 'w-[72px]'} border-r border-zinc-800 bg-zinc-900/50 p-4 flex flex-col transition-all duration-300 ease-in-out relative flex-shrink-0`}
      >
        {/* Toggle Button */}
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="absolute -right-3 top-8 bg-zinc-800 border border-zinc-700 hover:bg-zinc-700 text-zinc-400 hover:text-white rounded-full p-1 transition-colors z-10"
          title={sidebarOpen ? 'Collapse sidebar' : 'Expand sidebar'}
        >
          {sidebarOpen ? <PanelLeftClose size={14} /> : <PanelLeft size={14} />}
        </button>

        {/* Logo */}
        <Link to="/dashboard" className={`text-2xl font-black text-sky-500 mb-10 block ${sidebarOpen ? 'px-2' : 'text-center text-lg'} transition-all duration-300`}>
          {sidebarOpen ? 'DevTask' : 'D'}
        </Link>

        {/* Nav */}
        <nav className="flex-1 space-y-1">
          <Link
            to="/dashboard"
            className={`flex items-center gap-3 p-3 rounded-lg font-medium transition ${isActive('/dashboard') ? 'bg-sky-600/15 text-sky-400' : 'text-zinc-400 hover:bg-zinc-800 hover:text-white'} ${!sidebarOpen ? 'justify-center' : ''}`}
            title="Projects"
          >
            <LayoutGrid size={18} className="flex-shrink-0" />
            {sidebarOpen && <span>Projects</span>}
          </Link>
        </nav>

        {/* Profile at bottom */}
        <div className="border-t border-zinc-800 pt-4 space-y-1">
          <Link
            to="/profile"
            className={`flex items-center gap-3 p-3 rounded-lg text-zinc-400 hover:bg-zinc-800 hover:text-white transition group ${!sidebarOpen ? 'justify-center' : ''}`}
            title={profile?.name || 'Profile'}
          >
            {profile ? <Avatar name={profile.name} /> : <div className="w-8 h-8 rounded-full bg-zinc-800 animate-pulse" />}
            {sidebarOpen && (
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-white truncate">{profile?.name || '...'}</p>
                <p className="text-[11px] text-zinc-500 truncate">{profile?.email || ''}</p>
              </div>
            )}
            {sidebarOpen && <ChevronRight size={14} className="opacity-0 group-hover:opacity-100 transition" />}
          </Link>

          <button
            onClick={handleLogout}
            className={`w-full flex items-center gap-3 p-3 text-red-400 hover:bg-red-400/10 rounded-lg transition ${!sidebarOpen ? 'justify-center' : ''}`}
            title="Logout"
          >
            <LogOut size={18} className="flex-shrink-0" />
            {sidebarOpen && <span>Logout</span>}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        <div className="p-8">
          {children}
        </div>
      </main>
    </div>
  );
};

export default DashboardLayout;