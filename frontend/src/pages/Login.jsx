import { useState, useContext } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import API from '../api/axios';
import { Mail, Lock, ArrowRight, CheckCircle2 } from 'lucide-react';
import { Button } from '../design-system/Button';
import { Input } from '../design-system/Input';

/* ── Logo mark ───────────────────────────────────────────────────────────── */
const LogoMark = () => (
  <Link
    to="/"
    className="inline-flex items-center justify-center w-12 h-12 rounded-[var(--radius-lg)] hover:scale-105 transition-transform duration-[var(--ease-base)]"
    style={{ background: 'var(--accent)', boxShadow: '0 0 24px var(--accent-glow)' }}
  >
    <svg width="20" height="20" viewBox="0 0 18 18" fill="none">
      <rect x="1" y="1" width="7" height="7" rx="1.5" fill="white" fillOpacity="0.9" />
      <rect x="10" y="1" width="7" height="7" rx="1.5" fill="white" fillOpacity="0.55" />
      <rect x="1" y="10" width="7" height="7" rx="1.5" fill="white" fillOpacity="0.55" />
      <rect x="10" y="10" width="7" height="7" rx="1.5" fill="white" fillOpacity="0.25" />
    </svg>
  </Link>
);

/* ── Alert banner ────────────────────────────────────────────────────────── */
const Alert = ({ type, children }) => {
  const s = type === 'success'
    ? { bg: 'var(--success-bg)', bar: 'var(--success)', text: 'var(--success)', border: 'var(--success-border)' }
    : { bg: 'var(--danger-bg)',  bar: 'var(--danger)',  text: 'var(--danger)',  border: 'var(--danger-border)' };
  return (
    <div className="relative mb-5 px-4 py-3 rounded-[var(--radius-md)] text-sm flex items-center gap-2 overflow-hidden"
      style={{ background: s.bg, border: `1px solid ${s.border}`, color: s.text }}>
      <div className="absolute left-0 top-0 bottom-0 w-0.5" style={{ background: s.bar }} />
      <span className="pl-1">{children}</span>
    </div>
  );
};

/* ── Login ───────────────────────────────────────────────────────────────── */
const Login = () => {
  const [formData, setFormData]   = useState({ email: '', password: '' });
  const [error, setError]         = useState('');
  const [success, setSuccess]     = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useContext(AuthContext);
  const navigate  = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setSuccess('');
    try {
      const res = await API.post('/auth/login', formData);
      login(res.data.token, res.data.user);
      setSuccess('Signed in — redirecting…');
      setTimeout(() => navigate('/dashboard'), 1400);
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid credentials. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center px-6 py-16 relative overflow-hidden"
      style={{ background: 'var(--surface-base)' }}
    >
      {/* Subtle ambient glow */}
      <div
        className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(59,130,246,0.07) 0%, transparent 70%)' }}
        aria-hidden
      />

      <div className="relative w-full max-w-[400px] z-10">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-5"><LogoMark /></div>
          <h1 className="text-2xl font-bold tracking-tight mb-1" style={{ color: 'var(--text-primary)' }}>
            Welcome back
          </h1>
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
            Sign in to your DevTask account
          </p>
        </div>

        {/* Card */}
        <div className="p-7 rounded-[var(--radius-xl)] shadow-[var(--shadow-lg)]"
          style={{ background: 'var(--surface-raised)', border: '1px solid var(--border)' }}>
          {error   && <Alert type="error">{error}</Alert>}
          {success && <Alert type="success"><CheckCircle2 size={14} className="inline mr-1" />{success}</Alert>}

          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            <Input
              label="Email"
              id="login-email"
              type="email"
              placeholder="you@company.com"
              leadingIcon={<Mail size={15} />}
              value={formData.email}
              onChange={e => setFormData({ ...formData, email: e.target.value })}
              required
              autoComplete="email"
              disabled={isLoading || !!success}
            />

            <Input
              label="Password"
              id="login-password"
              type="password"
              placeholder="••••••••"
              leadingIcon={<Lock size={15} />}
              value={formData.password}
              onChange={e => setFormData({ ...formData, password: e.target.value })}
              required
              autoComplete="current-password"
              disabled={isLoading || !!success}
            />

            <Button
              type="submit"
              variant="primary"
              size="lg"
              loading={isLoading && !success}
              disabled={!!success}
              iconRight={!isLoading && !success ? <ArrowRight size={15} /> : undefined}
              className="w-full mt-2"
            >
              {success ? 'Redirecting…' : 'Sign In'}
            </Button>
          </form>
        </div>

        <p className="text-center mt-6 text-sm" style={{ color: 'var(--text-muted)' }}>
          New to DevTask?{' '}
          <Link to="/register" className="font-semibold transition-colors" style={{ color: 'var(--accent-text)' }}>
            Create an account
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Login;