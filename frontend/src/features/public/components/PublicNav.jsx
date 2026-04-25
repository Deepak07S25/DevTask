import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';

const LogoMark = () => (
  <div
    className="w-8 h-8 rounded-[10px] flex items-center justify-center shrink-0"
    style={{ background: 'var(--accent)' }}
  >
    <svg width="16" height="16" viewBox="0 0 18 18" fill="none">
      <rect x="1" y="1" width="7" height="7" rx="1.5" fill="white" fillOpacity="0.95" />
      <rect x="10" y="1" width="7" height="7" rx="1.5" fill="white" fillOpacity="0.5" />
      <rect x="1" y="10" width="7" height="7" rx="1.5" fill="white" fillOpacity="0.5" />
      <rect x="10" y="10" width="7" height="7" rx="1.5" fill="white" fillOpacity="0.2" />
    </svg>
  </div>
);

export const PublicNav = () => (
  <nav
    className="fixed top-0 inset-x-0 z-50 h-14 flex items-center backdrop-blur-xl"
    style={{
      borderBottom: '1px solid var(--border)',
      background: 'rgba(14,16,20,0.85)',
    }}
  >
    <div className="max-w-5xl mx-auto w-full px-6 flex items-center justify-between">
      {/* Logo */}
      <Link to="/" className="flex items-center gap-2.5">
        <LogoMark />
        <span className="text-base font-bold tracking-tight" style={{ color: 'var(--text-primary)' }}>
          DevTask
        </span>
      </Link>

      {/* Nav actions */}
      <div className="flex items-center gap-2">
        <Link
          to="/login"
          className="px-4 py-1.5 text-sm font-medium rounded-[var(--radius-md)] transition-colors duration-150"
          style={{ color: 'var(--text-secondary)' }}
          onMouseEnter={e => e.currentTarget.style.color = 'var(--text-primary)'}
          onMouseLeave={e => e.currentTarget.style.color = 'var(--text-secondary)'}
        >
          Log In
        </Link>
        <Link
          to="/register"
          className="flex items-center gap-1.5 px-4 py-1.5 text-sm font-semibold rounded-[var(--radius-md)] transition-all duration-150"
          style={{
            background: 'var(--accent)',
            color: '#fff',
            boxShadow: '0 0 16px var(--accent-glow)',
          }}
          onMouseEnter={e => { e.currentTarget.style.opacity = '0.9'; e.currentTarget.style.transform = 'translateY(-1px)'; }}
          onMouseLeave={e => { e.currentTarget.style.opacity = '1'; e.currentTarget.style.transform = 'translateY(0)'; }}
        >
          Get Started <ArrowRight size={13} />
        </Link>
      </div>
    </div>
  </nav>
);

export default PublicNav;
