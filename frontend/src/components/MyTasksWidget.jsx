import { useEffect, useState, useMemo, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  Layers, Bookmark, Bug, CheckSquare,
  Calendar, AlertCircle, CheckCheck,
  ChevronLeft, ChevronRight,
} from 'lucide-react';
import API from '../api/axios';
import { StatusBadge } from '../design-system/Badge';
import { Skeleton }     from '../design-system/Skeleton';
import { EmptyState }   from '../design-system/EmptyState';

/* ─── Constants ──────────────────────────────────────────────────── */
const TYPE_ICON = {
  EPIC:  <Layers      size={13} style={{ color: 'var(--info)' }}        className="shrink-0" />,
  STORY: <Bookmark    size={13} style={{ color: 'var(--success)' }}     className="shrink-0" />,
  BUG:   <Bug         size={13} style={{ color: 'var(--danger)' }}      className="shrink-0" />,
  TASK:  <CheckSquare size={13} style={{ color: 'var(--accent-text)' }} className="shrink-0" />,
};
const PRIORITY_COLOR = { HIGH: '#ef4444', MEDIUM: '#f59e0b', LOW: '#22c55e' };

/* ─── Status helpers ─────────────────────────────────────────────── */
const isDoneLike = (s) => {
  if (!s) return false;
  return ['done','released','deployed','closed','complete','completed']
    .includes(s.toLowerCase());
};
const isOverdue = (dueDate, status) =>
  !!(dueDate && !isDoneLike(status) && new Date(dueDate) < new Date());

const fmtDate = (d) =>
  new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

const sortStatuses = (arr) => [
  ...arr.filter(s => !isDoneLike(s)),
  ...arr.filter(s =>  isDoneLike(s)),
];

/* ─── Pill ───────────────────────────────────────────────────────── */
const Pill = ({ label, count, active, danger, onClick }) => {
  const bg     = active ? (danger ? 'rgba(239,68,68,0.15)' : 'var(--surface-overlay)') : 'transparent';
  const color  = active ? (danger ? 'var(--danger)' : 'var(--text-primary)') : 'var(--text-secondary)';
  const border = active
    ? (danger ? 'rgba(239,68,68,0.4)' : 'var(--border-strong)')
    : 'transparent';

  return (
    <button
      onClick={onClick}
      style={{
        display: 'flex', alignItems: 'center', gap: '5px',
        padding: '4px 10px', borderRadius: 'var(--radius-full)',
        border: `1px solid ${border}`, background: bg, color,
        fontSize: '12px', fontWeight: active ? '600' : '400',
        cursor: 'pointer', whiteSpace: 'nowrap', flexShrink: 0,
        transition: 'all var(--ease-base)',
      }}
      onMouseEnter={e => {
        if (!active) {
          e.currentTarget.style.color      = 'var(--text-primary)';
          e.currentTarget.style.background = 'var(--surface-subtle)';
        }
      }}
      onMouseLeave={e => {
        if (!active) {
          e.currentTarget.style.color      = 'var(--text-secondary)';
          e.currentTarget.style.background = 'transparent';
        }
      }}
    >
      {label}
      {count > 0 && (
        <span style={{
          fontSize: '10px', fontWeight: '700', lineHeight: 1,
          padding: '2px 5px', borderRadius: 'var(--radius-full)',
          background: danger
            ? (active ? 'rgba(239,68,68,0.25)' : 'rgba(239,68,68,0.1)')
            : (active ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.05)'),
          color: danger ? 'var(--danger)' : (active ? 'var(--text-primary)' : 'var(--text-muted)'),
        }}>
          {count}
        </span>
      )}
    </button>
  );
};

/* ─── Arrow button (shared between left / right) ─────────────────── */
const ArrowBtn = ({ onClick, children }) => (
  <button
    onClick={onClick}
    style={{
      pointerEvents: 'all',
      background: 'var(--surface-overlay)',
      border: '1px solid var(--border)',
      borderRadius: 'var(--radius-full)',
      width: '22px', height: '22px',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      cursor: 'pointer', color: 'var(--text-secondary)', flexShrink: 0,
      transition: 'all var(--ease-base)',
    }}
    onMouseEnter={e => {
      e.currentTarget.style.background = 'var(--surface-subtle)';
      e.currentTarget.style.color      = 'var(--text-primary)';
    }}
    onMouseLeave={e => {
      e.currentTarget.style.background = 'var(--surface-overlay)';
      e.currentTarget.style.color      = 'var(--text-secondary)';
    }}
  >
    {children}
  </button>
);

/* ─── TaskRow ────────────────────────────────────────────────────── */
const TaskRow = ({ task }) => {
  const overdue = isOverdue(task.dueDate, task.status);
  const faded   = isDoneLike(task.status);

  return (
    <Link
      to={`/project/${task.project.id}`}
      style={{
        display: 'flex', alignItems: 'center', gap: '12px',
        padding: '11px 16px', textDecoration: 'none',
        transition: 'background var(--ease-base)',
      }}
      onMouseEnter={e => (e.currentTarget.style.background = 'var(--surface-overlay)')}
      onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
    >
      {/* Priority dot */}
      <span style={{
        width: '7px', height: '7px', borderRadius: '50%', flexShrink: 0,
        background: PRIORITY_COLOR[task.priority] ?? '#48536a',
        opacity: faded ? 0.35 : 1,
      }} />

      {/* Type icon */}
      <span style={{ flexShrink: 0, opacity: faded ? 0.35 : 1, display: 'flex' }}>
        {TYPE_ICON[task.type] ?? TYPE_ICON.TASK}
      </span>

      {/* Title + project */}
      <div style={{ flex: 1, minWidth: 0, opacity: faded ? 0.45 : 1 }}>
        <p style={{
          fontSize: '13px', fontWeight: '500', lineHeight: 1.4, margin: 0,
          color: faded ? 'var(--text-secondary)' : 'var(--text-primary)',
          textDecoration: faded ? 'line-through' : 'none',
          whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
        }}>
          {task.title}
        </p>
        <p style={{
          fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px', margin: '2px 0 0',
          whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
        }}>
          {task.project.name}
        </p>
      </div>

      {/* Status badge */}
      <StatusBadge status={task.status} />

      {/* Due date */}
      {task.dueDate && (
        <span style={{
          display: 'flex', alignItems: 'center', gap: '3px',
          fontSize: '11px', flexShrink: 0,
          color: overdue ? 'var(--danger)' : 'var(--text-muted)',
        }}>
          {overdue ? <AlertCircle size={11} /> : <Calendar size={11} />}
          {fmtDate(task.dueDate)}
        </span>
      )}
    </Link>
  );
};

/* ─── Fade + arrow overlay ───────────────────────────────────────── */
const FadeArrow = ({ side, visible, onScroll }) => {
  if (!visible) return null;
  const isLeft = side === 'left';
  return (
    <div style={{
      position: 'absolute', [isLeft ? 'left' : 'right']: 0,
      top: 0, bottom: '12px', zIndex: 2,
      display: 'flex', alignItems: 'center',
      background: `linear-gradient(to ${isLeft ? 'right' : 'left'}, var(--surface-raised) 50%, transparent)`,
      [isLeft ? 'paddingRight' : 'paddingLeft']: '12px',
      pointerEvents: 'none',
    }}>
      <ArrowBtn onClick={onScroll}>
        {isLeft ? <ChevronLeft size={13} /> : <ChevronRight size={13} />}
      </ArrowBtn>
    </div>
  );
};

/* ─── Widget ─────────────────────────────────────────────────────── */
const MyTasksWidget = () => {
  const [tasks,   setTasks]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab,     setTab]     = useState('__all__');
  const [canL,    setCanL]    = useState(false);
  const [canR,    setCanR]    = useState(false);
  const pillsRef = useRef(null);

  /* Fetch tasks */
  useEffect(() => {
    API.get('/tasks/my-tasks')
      .then(r => setTasks(r.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  /* Derived data */
  const uniqueStatuses = useMemo(() => {
    const raw = [...new Set(tasks.map(t => t.status).filter(Boolean))];
    return sortStatuses(raw);
  }, [tasks]);

  const activeCount  = useMemo(() => tasks.filter(t => !isDoneLike(t.status)).length, [tasks]);
  const overdueCount = useMemo(() => tasks.filter(t => isOverdue(t.dueDate, t.status)).length, [tasks]);
  const visible      = useMemo(() => {
    if (tab === '__all__')     return tasks;
    if (tab === '__overdue__') return tasks.filter(t => isOverdue(t.dueDate, t.status));
    return tasks.filter(t => t.status === tab);
  }, [tasks, tab]);

  /* Arrow visibility — synced on scroll + resize */
  const syncArrows = useCallback(() => {
    const el = pillsRef.current;
    if (!el) return;
    setCanL(el.scrollLeft > 4);
    setCanR(el.scrollLeft + el.clientWidth < el.scrollWidth - 4);
  }, []);

  useEffect(() => {
    const el = pillsRef.current;
    if (!el) return;
    syncArrows();
    el.addEventListener('scroll', syncArrows, { passive: true });
    const ro = new ResizeObserver(syncArrows);
    ro.observe(el);
    return () => { el.removeEventListener('scroll', syncArrows); ro.disconnect(); };
  }, [loading, syncArrows]);

  const nudge = (dir) => pillsRef.current?.scrollBy({ left: dir * 160, behavior: 'smooth' });

  return (
    <div style={{
      background: 'var(--surface-raised)', border: '1px solid var(--border)',
      borderRadius: 'var(--radius-lg)', overflow: 'hidden', minWidth: 0, width: '100%',
    }}>

      {/* ── Header ──────────────────────────────────────────────── */}
      <div style={{ padding: '14px 16px 0', borderBottom: '1px solid var(--border)' }}>

        {/* Title + active badge */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
          <h2 style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-primary)', margin: 0 }}>
            My Issues
          </h2>
          {!loading && activeCount > 0 && (
            <span style={{
              fontSize: '11px', fontWeight: '600', padding: '2px 7px',
              borderRadius: 'var(--radius-full)', background: 'var(--accent-muted)',
              color: 'var(--accent-text)', border: '1px solid rgba(59,130,246,0.2)',
            }}>
              {activeCount} active
            </span>
          )}
        </div>

        {/* Pill tabs + scroll arrows */}
        {!loading && tasks.length > 0 && (
          <div style={{ position: 'relative', width: '100%' }}>
            <FadeArrow side="left"  visible={canL} onScroll={() => nudge(-1)} />
            <FadeArrow side="right" visible={canR} onScroll={() => nudge(1)} />

            <div
              ref={pillsRef}
              style={{
                display: 'flex', gap: '4px',
                overflowX: 'auto', paddingBottom: '12px',
                scrollbarWidth: 'none', msOverflowStyle: 'none',
                width: '100%', boxSizing: 'border-box',
                paddingLeft: canL ? '28px' : '0',
                paddingRight: canR ? '28px' : '0',
              }}
            >
              <Pill label="All" count={tasks.length} active={tab === '__all__'} onClick={() => setTab('__all__')} />

              {uniqueStatuses.map(status => (
                <Pill
                  key={status}
                  label={status}
                  count={tasks.filter(t => t.status === status).length}
                  active={tab === status}
                  onClick={() => setTab(status)}
                />
              ))}

              {overdueCount > 0 && (
                <Pill label="⚠ Overdue" count={overdueCount} active={tab === '__overdue__'} danger onClick={() => setTab('__overdue__')} />
              )}
            </div>
          </div>
        )}
      </div>

      {/* ── Body ────────────────────────────────────────────────── */}
      {loading ? (
        <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {[1, 2, 3].map(i => <Skeleton key={i} height="2.5rem" />)}
        </div>
      ) : tasks.length === 0 ? (
        <EmptyState
          icon={<CheckCheck size={24} />}
          title="You're all caught up"
          body="No tasks assigned to you yet. Ask your team lead or check project boards."
        />
      ) : visible.length === 0 ? (
        <div style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center',
          justifyContent: 'center', padding: '40px 16px', gap: '8px',
        }}>
          <CheckCheck size={20} style={{ color: 'var(--text-muted)' }} />
          <p style={{ fontSize: '13px', color: 'var(--text-muted)', margin: 0 }}>
            No tasks in this category
          </p>
        </div>
      ) : (
        <div>
          {visible.map(t => <TaskRow key={t.id} task={t} />)}
        </div>
      )}
    </div>
  );
};

export default MyTasksWidget;
