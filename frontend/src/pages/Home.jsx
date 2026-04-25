import { Link } from 'react-router-dom';
import { ArrowRight, Layers, KanbanSquare, FileText, LayoutDashboard, Check, X } from 'lucide-react';
import { PublicNav } from '../features/public/components/PublicNav';

/* ── Mock product preview ─────────────────────────────────────────────────── */
const MockCard = ({ title, priority, status }) => {
  const pColor = { HIGH: '#ef4444', MEDIUM: '#f59e0b', LOW: '#22c55e' }[priority] || '#6b7280';
  const sColor = { 'To Do': '#6b7280', 'In Progress': '#3b82f6', 'Done': '#22c55e' }[status] || '#6b7280';
  return (
    <div className="px-3 py-2.5 rounded-lg mb-2" style={{ background: 'var(--surface-overlay)', border: '1px solid var(--border)' }}>
      <div className="flex items-start gap-2">
        <span className="w-1.5 h-1.5 rounded-full mt-1.5 shrink-0" style={{ background: pColor }} />
        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium truncate" style={{ color: 'var(--text-primary)' }}>{title}</p>
          <span className="text-[10px] font-semibold mt-1 inline-block" style={{ color: sColor }}>{status}</span>
        </div>
      </div>
    </div>
  );
};

const MockColumn = ({ label, tasks }) => (
  <div className="flex-1 min-w-0">
    <div className="flex items-center gap-2 mb-3">
      <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>{label}</span>
      <span className="text-[10px] px-1.5 py-0.5 rounded-full font-medium" style={{ background: 'var(--surface-subtle)', color: 'var(--text-muted)' }}>{tasks.length}</span>
    </div>
    {tasks.map((t, i) => <MockCard key={i} {...t} />)}
  </div>
);

const ProductPreview = () => (
  <div
    className="rounded-[var(--radius-xl)] overflow-hidden shadow-2xl select-none"
    style={{
      border: '1px solid var(--border)',
      background: 'var(--surface-raised)',
      boxShadow: '0 32px 80px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.04)',
    }}
  >
    {/* Board toolbar */}
    <div className="px-4 py-3 flex items-center gap-3" style={{ borderBottom: '1px solid var(--border)', background: 'var(--surface-base)' }}>
      <div className="flex gap-1.5">
        <span className="w-2.5 h-2.5 rounded-full" style={{ background: 'var(--border)' }} />
        <span className="w-2.5 h-2.5 rounded-full" style={{ background: 'var(--border)' }} />
        <span className="w-2.5 h-2.5 rounded-full" style={{ background: 'var(--border)' }} />
      </div>
      <div className="flex-1 h-5 rounded" style={{ background: 'var(--surface-overlay)', maxWidth: 180 }} />
      <div className="h-5 w-16 rounded" style={{ background: 'var(--accent)', opacity: 0.7 }} />
    </div>

    {/* Columns */}
    <div className="flex gap-3 p-4">
      <MockColumn label="To Do" tasks={[
        { title: 'Set up CI/CD pipeline', priority: 'HIGH', status: 'To Do' },
        { title: 'Write API documentation', priority: 'MEDIUM', status: 'To Do' },
      ]} />
      <MockColumn label="In Progress" tasks={[
        { title: 'Implement auth middleware', priority: 'HIGH', status: 'In Progress' },
        { title: 'Design backlog interface', priority: 'MEDIUM', status: 'In Progress' },
      ]} />
      <MockColumn label="Done" tasks={[
        { title: 'Database schema design', priority: 'HIGH', status: 'Done' },
        { title: 'Project scaffolding', priority: 'LOW', status: 'Done' },
      ]} />
    </div>
  </div>
);

/* ── Workflow step ────────────────────────────────────────────────────────── */
// eslint-disable-next-line no-unused-vars
const WorkflowStep = ({ icon: Icon, step, title, description }) => (
  <div className="flex gap-5">
    <div className="shrink-0 flex flex-col items-center">
      <div
        className="w-10 h-10 rounded-[var(--radius-md)] flex items-center justify-center"
        style={{ background: 'rgba(59,130,246,0.1)', color: 'var(--accent-text)', border: '1px solid rgba(59,130,246,0.2)' }}
      >
        <Icon size={18} />
      </div>
      <div className="w-px flex-1 mt-3" style={{ background: 'var(--border)' }} />
    </div>
    <div className="pb-10">
      <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: 'var(--accent-text)' }}>
        {step}
      </span>
      <h3 className="text-base font-semibold mt-0.5 mb-1.5" style={{ color: 'var(--text-primary)' }}>{title}</h3>
      <p className="text-sm leading-relaxed" style={{ color: 'var(--text-muted)' }}>{description}</p>
    </div>
  </div>
);

/* ── Differentiator row ───────────────────────────────────────────────────── */
const DiffRow = ({ label, jira = false }) => (
  <div className="flex items-center gap-3 py-2.5" style={{ borderBottom: '1px solid var(--border)' }}>
    <span
      className="w-5 h-5 rounded-full flex items-center justify-center shrink-0"
      style={{
        background: jira ? 'var(--danger-bg)' : 'rgba(34,197,94,0.1)',
        color: jira ? 'var(--danger)' : '#22c55e',
      }}
    >
      {jira ? <X size={11} /> : <Check size={11} />}
    </span>
    <span className="text-sm" style={{ color: jira ? 'var(--text-muted)' : 'var(--text-secondary)', textDecoration: jira ? 'line-through' : 'none' }}>
      {label}
    </span>
  </div>
);

/* ── Home ─────────────────────────────────────────────────────────────────── */
const Home = () => (
  <div className="min-h-screen selection:bg-blue-500/20 font-sans overflow-x-hidden" style={{ background: 'var(--surface-base)', color: 'var(--text-primary)' }}>
    <PublicNav />

    {/* ── HERO ──────────────────────────────────────────────────────────── */}
    <section className="pt-32 pb-20 md:pt-40 md:pb-28 px-6">
      <div className="max-w-5xl mx-auto">
        {/* Badge */}
        <div
          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold mb-8"
          style={{ background: 'rgba(59,130,246,0.08)', border: '1px solid rgba(59,130,246,0.2)', color: 'var(--accent-text)' }}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-blue-500 shadow-[0_0_6px_rgba(59,130,246,0.7)]" />
          Agile workspace for software teams
        </div>

        {/* Headline */}
        <h1
          className="text-5xl md:text-6xl lg:text-7xl font-black tracking-tight mb-6 leading-[1.06]"
          style={{ color: 'var(--text-primary)' }}
        >
          Plan clearly.<br />
          <span style={{ color: 'var(--accent-text)' }}>Execute calmly.</span>
        </h1>

        <p className="text-lg md:text-xl max-w-2xl mb-10 leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
          Backlog, sprints, boards, and task detail — without the Jira overhead.
          Built for teams that want clarity, not configuration.
        </p>

        {/* CTAs */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 mb-16">
          <Link
            to="/register"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-[var(--radius-md)] text-sm font-bold text-white transition-all duration-150"
            style={{ background: 'var(--accent)', boxShadow: '0 0 24px var(--accent-glow)' }}
            onMouseEnter={e => { e.currentTarget.style.opacity = '0.9'; e.currentTarget.style.transform = 'translateY(-1px)'; }}
            onMouseLeave={e => { e.currentTarget.style.opacity = '1'; e.currentTarget.style.transform = 'translateY(0)'; }}
          >
            Get Started Free <ArrowRight size={15} />
          </Link>
          <Link
            to="/login"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-[var(--radius-md)] text-sm font-medium transition-all duration-150"
            style={{ color: 'var(--text-secondary)', border: '1px solid var(--border)' }}
            onMouseEnter={e => { e.currentTarget.style.color = 'var(--text-primary)'; e.currentTarget.style.borderColor = 'var(--border-strong)'; }}
            onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-secondary)'; e.currentTarget.style.borderColor = 'var(--border)'; }}
          >
            Sign In to your workspace
          </Link>
        </div>

        {/* Product preview */}
        <ProductPreview />
      </div>
    </section>

    {/* ── WORKFLOW ──────────────────────────────────────────────────────── */}
    <section className="py-24 px-6" style={{ borderTop: '1px solid var(--border)' }}>
      <div className="max-w-5xl mx-auto grid md:grid-cols-2 gap-16 items-start">
        {/* Left: Heading */}
        <div className="md:sticky md:top-24">
          <p className="text-xs font-bold uppercase tracking-widest mb-4" style={{ color: 'var(--accent-text)' }}>
            How it works
          </p>
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-5" style={{ color: 'var(--text-primary)' }}>
            Your team's full workflow,<br />in one surface
          </h2>
          <p className="text-base leading-relaxed" style={{ color: 'var(--text-muted)' }}>
            DevTask connects planning to execution without the overhead of enterprise PM tooling.
            Every step is built around the way engineering teams actually work.
          </p>
        </div>

        {/* Right: Steps */}
        <div className="pt-2">
          <WorkflowStep
            icon={Layers}
            step="01 — Plan"
            title="Backlog & Sprint Planning"
            description="Organize work into sprints from a structured backlog. Prioritize clearly, assign tasks, and set sprint goals before writing a line of code."
          />
          <WorkflowStep
            icon={KanbanSquare}
            step="02 — Execute"
            title="Board-driven execution"
            description="Move tasks across To Do, In Progress, and Done with drag-and-drop. See exactly what is moving, what is blocked, and what matters right now."
          />
          <WorkflowStep
            icon={FileText}
            step="03 — Track"
            title="Full task context"
            description="Every task has a dedicated detail view — description in Markdown, comments, assignee, epic link, due date, and full activity history."
          />
          <WorkflowStep
            icon={LayoutDashboard}
            step="04 — Review"
            title="Project dashboard"
            description="Dashboard surfaces project health at a glance: sprint status, task distribution, recent activity, and team membership."
          />
        </div>
      </div>
    </section>

    {/* ── TRUST / DIFFERENTIATORS ───────────────────────────────────────── */}
    <section className="py-24 px-6" style={{ borderTop: '1px solid var(--border)', background: 'var(--surface-raised)' }}>
      <div className="max-w-5xl mx-auto grid md:grid-cols-2 gap-16 items-start">
        {/* Left: Copy */}
        <div>
          <p className="text-xs font-bold uppercase tracking-widest mb-4" style={{ color: 'var(--accent-text)' }}>
            Built for focus
          </p>
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-5" style={{ color: 'var(--text-primary)' }}>
            Not another Jira.
          </h2>
          <p className="text-base leading-relaxed mb-8" style={{ color: 'var(--text-muted)' }}>
            Jira is powerful. It is also slow, configuration-heavy, and designed
            for enterprise hierarchies. DevTask is designed for the opposite:
            small and medium teams that want to move fast without the admin overhead.
          </p>
          <Link
            to="/register"
            className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold rounded-[var(--radius-md)] transition-all duration-150 text-white"
            style={{ background: 'var(--accent)' }}
            onMouseEnter={e => e.currentTarget.style.opacity = '0.9'}
            onMouseLeave={e => e.currentTarget.style.opacity = '1'}
          >
            See it for yourself <ArrowRight size={14} />
          </Link>
        </div>

        {/* Right: Comparison */}
        <div
          className="rounded-[var(--radius-xl)] p-6"
          style={{ border: '1px solid var(--border)', background: 'var(--surface-base)' }}
        >
          <div className="grid grid-cols-2 gap-4 mb-3 pb-3" style={{ borderBottom: '1px solid var(--border)' }}>
            <p className="text-xs font-bold uppercase tracking-wider text-center" style={{ color: 'var(--text-muted)' }}>Jira-style tools</p>
            <p className="text-xs font-bold uppercase tracking-wider text-center" style={{ color: 'var(--accent-text)' }}>DevTask</p>
          </div>
          <div className="grid grid-cols-2 gap-x-6">
            <div>
              <DiffRow label="Configure workflows before first sprint" jira />
              <DiffRow label="Nested permission schemes" jira />
              <DiffRow label="Slow page loads, complex menus" jira />
              <DiffRow label="Expensive per-seat licensing" jira />
            </div>
            <div>
              <DiffRow label="First sprint in under 2 minutes" />
              <DiffRow label="Invite teammates, start working" />
              <DiffRow label="Fast, clean, keyboard-friendly" />
              <DiffRow label="Free to get started" />
            </div>
          </div>
        </div>
      </div>
    </section>

    {/* ── FINAL CTA ─────────────────────────────────────────────────────── */}
    <section className="py-28 px-6 text-center" style={{ borderTop: '1px solid var(--border)' }}>
      <div className="max-w-xl mx-auto">
        <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4" style={{ color: 'var(--text-primary)' }}>
          Start managing work more clearly
        </h2>
        <p className="text-base mb-10" style={{ color: 'var(--text-muted)' }}>
          Your first project takes 30 seconds to set up.
          No credit card, no enterprise sales call.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            to="/register"
            className="inline-flex items-center gap-2 px-7 py-3 rounded-[var(--radius-md)] text-sm font-bold text-white transition-all duration-150"
            style={{ background: 'var(--accent)', boxShadow: '0 0 32px var(--accent-glow)' }}
            onMouseEnter={e => { e.currentTarget.style.opacity = '0.9'; e.currentTarget.style.transform = 'translateY(-1px)'; }}
            onMouseLeave={e => { e.currentTarget.style.opacity = '1'; e.currentTarget.style.transform = 'translateY(0)'; }}
          >
            Create a free account <ArrowRight size={14} />
          </Link>
          <Link
            to="/login"
            className="text-sm font-medium transition-colors"
            style={{ color: 'var(--text-muted)' }}
            onMouseEnter={e => e.currentTarget.style.color = 'var(--text-primary)'}
            onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'}
          >
            Already have an account? Sign in
          </Link>
        </div>
      </div>
    </section>

    {/* ── FOOTER ────────────────────────────────────────────────────────── */}
    <footer
      className="py-10 px-6"
      style={{ borderTop: '1px solid var(--border)', background: 'var(--surface-base)' }}
    >
      <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-[6px] flex items-center justify-center" style={{ background: 'var(--accent)' }}>
            <svg width="11" height="11" viewBox="0 0 18 18" fill="none">
              <rect x="1" y="1" width="7" height="7" rx="1.5" fill="white" fillOpacity="0.9" />
              <rect x="10" y="1" width="7" height="7" rx="1.5" fill="white" fillOpacity="0.5" />
              <rect x="1" y="10" width="7" height="7" rx="1.5" fill="white" fillOpacity="0.5" />
              <rect x="10" y="10" width="7" height="7" rx="1.5" fill="white" fillOpacity="0.2" />
            </svg>
          </div>
          <span className="text-sm font-bold" style={{ color: 'var(--text-secondary)' }}>DevTask</span>
          <span className="text-xs ml-2" style={{ color: 'var(--text-muted)' }}>
            © {new Date().getFullYear()}
          </span>
        </div>
        <div className="flex gap-6">
          {['Privacy', 'Terms', 'Contact'].map(label => (
            <a key={label} href="#" className="text-xs transition-colors" style={{ color: 'var(--text-muted)' }}
              onMouseEnter={e => e.currentTarget.style.color = 'var(--text-secondary)'}
              onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'}
            >
              {label}
            </a>
          ))}
        </div>
      </div>
    </footer>
  </div>
);

export default Home;
