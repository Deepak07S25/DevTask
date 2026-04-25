import { Link } from 'react-router-dom';
import { ArrowLeft, Home, LayoutDashboard } from 'lucide-react';

const NotFoundPage = () => (
  <div
    className="min-h-screen flex flex-col items-center justify-center p-8 text-center"
    style={{ background: 'var(--surface-base)' }}
  >
    {/* Numeric treatment */}
    <div className="relative mb-8 select-none" aria-hidden>
      <span
        className="text-[108px] font-black leading-none tracking-tighter"
        style={{ color: 'var(--surface-overlay)' }}
      >
        404
      </span>
      <span
        className="absolute inset-0 text-[108px] font-black leading-none tracking-tighter blur-2xl"
        style={{ color: 'var(--accent)', opacity: 0.15 }}
      >
        404
      </span>
    </div>

    {/* Message */}
    <div className="max-w-sm mb-10">
      <h1 className="text-xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>
        Page not found
      </h1>
      <p className="text-sm leading-relaxed" style={{ color: 'var(--text-muted)' }}>
        This page doesn't exist or may have been moved.
        Check the URL, or head back somewhere useful.
      </p>
    </div>

    {/* Actions */}
    <div className="flex flex-col sm:flex-row items-center gap-3">
      <button
        onClick={() => window.history.back()}
        className="flex items-center gap-2 px-4 py-2.5 rounded-[var(--radius-md)] text-sm font-medium transition-all duration-150"
        style={{ color: 'var(--text-secondary)', border: '1px solid var(--border)' }}
        onMouseEnter={e => { e.currentTarget.style.color = 'var(--text-primary)'; e.currentTarget.style.borderColor = 'var(--border-strong)'; }}
        onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-secondary)'; e.currentTarget.style.borderColor = 'var(--border)'; }}
      >
        <ArrowLeft size={14} /> Go back
      </button>
      <Link
        to="/"
        className="flex items-center gap-2 px-4 py-2.5 rounded-[var(--radius-md)] text-sm font-medium transition-all duration-150"
        style={{ color: 'var(--text-secondary)', border: '1px solid var(--border)' }}
        onMouseEnter={e => { e.currentTarget.style.color = 'var(--text-primary)'; e.currentTarget.style.borderColor = 'var(--border-strong)'; }}
        onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-secondary)'; e.currentTarget.style.borderColor = 'var(--border)'; }}
      >
        <Home size={14} /> Home
      </Link>
      <Link
        to="/dashboard"
        className="flex items-center gap-2 px-4 py-2.5 rounded-[var(--radius-md)] text-sm font-semibold transition-all duration-150 text-white"
        style={{ background: 'var(--accent)' }}
        onMouseEnter={e => e.currentTarget.style.opacity = '0.9'}
        onMouseLeave={e => e.currentTarget.style.opacity = '1'}
      >
        <LayoutDashboard size={14} /> Dashboard
      </Link>
    </div>
  </div>
);

export default NotFoundPage;
