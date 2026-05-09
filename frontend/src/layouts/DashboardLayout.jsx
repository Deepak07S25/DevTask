import { useContext, useEffect, useState } from 'react';
import { AuthContext } from '../context/AuthContext';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { LayoutGrid, LogOut, ChevronRight, PanelLeftClose, PanelLeft, Bell, Menu, X, BarChart3 } from 'lucide-react';
import API from '../api/axios';
import NotificationPanel from '../components/NotificationPanel';
import { NotificationContext } from '../context/NotificationContext';

/* ── Logo mark SVG ─────────────────────────────────────────────────────── */
const LogoMark = () => (
  <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
    <rect x="1" y="1" width="7" height="7" rx="1.5" fill="white" fillOpacity="0.9"/>
    <rect x="10" y="1" width="7" height="7" rx="1.5" fill="white" fillOpacity="0.55"/>
    <rect x="1" y="10" width="7" height="7" rx="1.5" fill="white" fillOpacity="0.55"/>
    <rect x="10" y="10" width="7" height="7" rx="1.5" fill="white" fillOpacity="0.25"/>
  </svg>
);

/* ── Avatar ─────────────────────────────────────────────────────────────── */
const COLORS = ['#3b82f6','#06b6d4','#10b981','#f59e0b','#8b5cf6','#ec4899'];
const Avatar = ({ name }) => {
  const initials = name ? name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) : '?';
  const bg = COLORS[initials.charCodeAt(0) % COLORS.length];
  return (
    <div
      className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0"
      style={{ background: bg }}
    >
      {initials}
    </div>
  );
};

/* ── DashboardLayout ─────────────────────────────────────────────────────── */
const DashboardLayout = ({ children }) => {
  const { logout } = useContext(AuthContext);
  const { unreadCount } = useContext(NotificationContext);
  const navigate = useNavigate();
  const location = useLocation();
  const [profile, setProfile] = useState(null);
  const [open, setOpen] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    API.get('/auth/me').then(r => setProfile(r.data)).catch(() => {});
  }, []);

  const isActive = (p) => location.pathname === p;
  const closeMobileMenu = () => setMobileMenuOpen(false);

  return (
    <div className="flex min-h-screen relative" style={{ background: 'var(--surface-base)', color: 'var(--text-primary)' }}>

      {/* Mobile Backdrop */}
      {mobileMenuOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black/60 md:hidden backdrop-blur-sm"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* ── Sidebar ──────────────────────────────────────────────────────── */}
      <aside
        className={`
          fixed md:relative inset-y-0 z-50 flex flex-col shrink-0 overflow-hidden transition-all duration-[var(--ease-layout)]
          ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
        `}
        style={{
          width: open ? 'var(--sidebar-w)' : 'var(--sidebar-collapsed)',
          background: 'var(--surface-raised)',
          borderRight: '1px solid var(--border)',
        }}
      >
        {/* Toggle Desktop */}
        <button
          onClick={() => setOpen(!open)}
          title={open ? 'Collapse' : 'Expand'}
          className="hidden md:flex absolute -right-3 top-6 z-10 w-6 h-6 items-center justify-center rounded-full text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors duration-[var(--ease-base)]"
          style={{ background: 'var(--surface-overlay)', border: '1px solid var(--border)' }}
        >
          {open ? <PanelLeftClose size={12} /> : <PanelLeft size={12} />}
        </button>

        {/* Close Mobile */}
        <button
          onClick={() => setMobileMenuOpen(false)}
          className="absolute right-3 top-4 z-10 md:hidden p-1 text-[var(--text-muted)] hover:text-[var(--text-primary)]"
        >
          <X size={18} />
        </button>

        <div className="flex flex-col flex-1 overflow-hidden p-3 gap-1">

          {/* Logo */}
          <Link
            to="/dashboard"
            onClick={closeMobileMenu}
            className="flex items-center gap-2.5 px-2 py-2 mb-5 mt-1 transition-all duration-[var(--ease-base)]"
            style={{ textDecoration: 'none', justifyContent: open ? 'flex-start' : 'center' }}
          >
            <div
              className="w-7 h-7 rounded-[var(--radius-sm)] flex items-center justify-center shrink-0"
              style={{ background: 'var(--accent)', boxShadow: '0 0 12px var(--accent-glow)' }}
            >
              <LogoMark />
            </div>
            {open && (
              <span className="text-base font-bold tracking-tight text-[var(--text-primary)]">DevTask</span>
            )}
          </Link>

          {/* Nav */}
          <nav className="flex-1 flex flex-col gap-0.5">
            <Link
              to="/dashboard"
              title="Projects"
              onClick={closeMobileMenu}
              className="flex items-center gap-3 px-3 py-2.5 rounded-[var(--radius-md)] text-sm font-medium transition-all duration-[var(--ease-base)]"
              style={{
                justifyContent: open ? 'flex-start' : 'center',
                textDecoration: 'none',
                background: isActive('/dashboard') ? 'var(--accent-muted)' : 'transparent',
                color: isActive('/dashboard') ? 'var(--accent-text)' : 'var(--text-muted)',
              }}
              onMouseEnter={e => { if (!isActive('/dashboard')) { e.currentTarget.style.background='var(--surface-overlay)'; e.currentTarget.style.color='var(--text-primary)'; } }}
              onMouseLeave={e => { if (!isActive('/dashboard')) { e.currentTarget.style.background='transparent'; e.currentTarget.style.color='var(--text-muted)'; } }}
            >
              <LayoutGrid size={16} className="shrink-0" />
              {open && <span>Projects</span>}
            </Link>
            
            <Link
              to="/notifications"
              title="Notifications"
              onClick={closeMobileMenu}
              className="flex items-center gap-3 px-3 py-2.5 rounded-[var(--radius-md)] text-sm font-medium transition-all duration-[var(--ease-base)]"
              style={{
                justifyContent: open ? 'flex-start' : 'center',
                textDecoration: 'none',
                background: isActive('/notifications') ? 'var(--accent-muted)' : 'transparent',
                color: isActive('/notifications') ? 'var(--accent-text)' : 'var(--text-muted)',
              }}
              onMouseEnter={e => { if (!isActive('/notifications')) { e.currentTarget.style.background='var(--surface-overlay)'; e.currentTarget.style.color='var(--text-primary)'; } }}
              onMouseLeave={e => { if (!isActive('/notifications')) { e.currentTarget.style.background='transparent'; e.currentTarget.style.color='var(--text-muted)'; } }}
            >
              <div className="relative flex items-center justify-center shrink-0">
                <Bell size={16} />
                {unreadCount > 0 && !open && (
                  <span className="absolute -top-1 -right-1 flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500 border border-[var(--surface-raised)]"></span>
                  </span>
                )}
              </div>
              {open && (
                <span className="flex-1 flex justify-between items-center">
                  Notifications
                  {unreadCount > 0 && <span className="bg-[var(--accent)] text-white text-[10px] px-1.5 py-0.5 rounded-full">{unreadCount}</span>}
                </span>
              )}
            </Link>

            <Link
              to="/reports"
              title="Reports"
              onClick={closeMobileMenu}
              className="flex items-center gap-3 px-3 py-2.5 rounded-[var(--radius-md)] text-sm font-medium transition-all duration-[var(--ease-base)]"
              style={{
                justifyContent: open ? 'flex-start' : 'center',
                textDecoration: 'none',
                background: isActive('/reports') ? 'var(--accent-muted)' : 'transparent',
                color: isActive('/reports') ? 'var(--accent-text)' : 'var(--text-muted)',
              }}
              onMouseEnter={e => { if (!isActive('/reports')) { e.currentTarget.style.background='var(--surface-overlay)'; e.currentTarget.style.color='var(--text-primary)'; } }}
              onMouseLeave={e => { if (!isActive('/reports')) { e.currentTarget.style.background='transparent'; e.currentTarget.style.color='var(--text-muted)'; } }}
            >
              <BarChart3 size={16} className="shrink-0" />
              {open && <span>Reports</span>}
            </Link>
          </nav>

          {/* Bottom */}
          <div className="flex flex-col gap-0.5 pt-3" style={{ borderTop: '1px solid var(--border)' }}>
            {/* Profile */}
            <Link
              to="/profile"
              title={profile?.name || 'Profile'}
              onClick={closeMobileMenu}
              className="flex items-center gap-3 px-3 py-2.5 rounded-[var(--radius-md)] group transition-all duration-[var(--ease-base)]"
              style={{ justifyContent: open ? 'flex-start' : 'center', textDecoration: 'none', color: 'var(--text-muted)' }}
              onMouseEnter={e => { e.currentTarget.style.background='var(--surface-overlay)'; e.currentTarget.style.color='var(--text-primary)'; }}
              onMouseLeave={e => { e.currentTarget.style.background='transparent'; e.currentTarget.style.color='var(--text-muted)'; }}
            >
              {profile
                ? <Avatar name={profile.name} />
                : <div className="w-8 h-8 rounded-full dt-skeleton shrink-0" />
              }
              {open && (
                <>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-[var(--text-primary)] truncate">{profile?.name || '···'}</p>
                    <p className="text-[11px] text-[var(--text-muted)] truncate">{profile?.email || ''}</p>
                  </div>
                  <ChevronRight size={12} className="opacity-0 group-hover:opacity-50 transition-opacity shrink-0" />
                </>
              )}
            </Link>

            {/* Logout */}
            <button
              onClick={() => { logout(); navigate('/login'); }}
              title="Log out"
              className="flex items-center gap-3 px-3 py-2.5 rounded-[var(--radius-md)] text-sm font-medium text-red-400 hover:bg-[var(--danger-bg)] hover:text-red-300 transition-all duration-[var(--ease-base)] w-full"
              style={{ justifyContent: open ? 'flex-start' : 'center' }}
            >
              <LogOut size={15} className="shrink-0" />
              {open && <span>Log Out</span>}
            </button>
          </div>
        </div>
      </aside>

      {/* ── Main ─────────────────────────────────────────────────────────── */}
      <main className="flex-1 overflow-y-auto relative min-w-0">
        {/* Mobile Header */}
        <div className="md:hidden flex items-center justify-between px-4 py-3 sticky top-0 z-30" style={{ background: 'var(--surface-raised)', borderBottom: '1px solid var(--border)' }}>
          <div className="flex items-center gap-3">
            <button onClick={() => setMobileMenuOpen(true)} className="p-1 -ml-1 text-[var(--text-muted)] hover:text-[var(--text-primary)]">
              <Menu size={20} />
            </button>
            <div className="w-6 h-6 rounded-[var(--radius-sm)] flex items-center justify-center shrink-0" style={{ background: 'var(--accent)' }}>
              <LogoMark />
            </div>
            <span className="text-sm font-bold tracking-tight text-[var(--text-primary)]">DevTask</span>
          </div>
          <div>
            <NotificationPanel />
          </div>
        </div>

        {/* Desktop Notification Panel */}
        <div className="hidden md:block absolute top-4 right-6 z-40">
          <NotificationPanel />
        </div>

        <div className="max-w-[1280px] mx-auto px-4 md:px-7 py-5 md:py-7 mt-0 md:mt-8">
          {children}
        </div>
      </main>
    </div>
  );
};

export default DashboardLayout;
