import { useContext, useEffect, useState } from 'react';
import { AuthContext } from '../context/AuthContext';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { LayoutGrid, LogOut, ChevronRight } from 'lucide-react';
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
      <aside className="w-64 border-r border-zinc-800 bg-zinc-900/50 p-6 flex flex-col">
        {/* Logo */}
        <Link to="/dashboard" className="text-2xl font-black text-sky-500 mb-10 block">DevTask</Link>

        {/* Nav */}
        <nav className="flex-1 space-y-1">
          <Link
            to="/dashboard"
            className={`flex items-center gap-3 p-3 rounded-lg font-medium transition ${isActive('/dashboard') ? 'bg-sky-600/15 text-sky-400' : 'text-zinc-400 hover:bg-zinc-800 hover:text-white'}`}
          >
            <LayoutGrid size={18} /> Projects
          </Link>
        </nav>

        {/* Profile at bottom */}
        <div className="border-t border-zinc-800 pt-4 space-y-1">
          <Link
            to="/profile"
            className="flex items-center gap-3 p-3 rounded-lg text-zinc-400 hover:bg-zinc-800 hover:text-white transition group"
          >
            {profile ? <Avatar name={profile.name} /> : <div className="w-8 h-8 rounded-full bg-zinc-800 animate-pulse" />}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-white truncate">{profile?.name || '...'}</p>
              <p className="text-[11px] text-zinc-500 truncate">{profile?.email || ''}</p>
            </div>
            <ChevronRight size={14} className="opacity-0 group-hover:opacity-100 transition" />
          </Link>

          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 p-3 text-red-400 hover:bg-red-400/10 rounded-lg transition"
          >
            <LogOut size={18} /> Logout
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