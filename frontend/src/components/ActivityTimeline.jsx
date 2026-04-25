import { useState, useEffect } from 'react';
import API from '../api/axios';
import { History, Target, AlertCircle, FileText, Calendar, User, LayoutList } from 'lucide-react';
import { Skeleton } from '../design-system/Skeleton';

const formatRelativeTime = (dateStr) => {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
};

const ACTION_ICON = {
  status:      <Target size={13} style={{ color: 'var(--accent-text)' }} />,
  priority:    <AlertCircle size={13} style={{ color: 'var(--warning)' }} />,
  description: <FileText size={13} style={{ color: 'var(--text-muted)' }} />,
  'due date':  <Calendar size={13} style={{ color: 'var(--danger)' }} />,
  assign:      <User size={13} style={{ color: 'var(--success)' }} />,
  title:       <LayoutList size={13} style={{ color: '#a78bfa' }} />,
};

const getIcon = (action) => {
  const key = Object.keys(ACTION_ICON).find(k => action?.includes(k));
  return key ? ACTION_ICON[key] : <History size={13} style={{ color: 'var(--text-muted)' }} />;
};

const ActivityTimeline = ({ taskId }) => {
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchActivities = async () => {
      try {
        const res = await API.get(`/tasks/${taskId}/activities`);
        setActivities(res.data);
      } catch {
        // silently fail
      } finally {
        setLoading(false);
      }
    };
    fetchActivities();
  }, [taskId]);

  if (loading) {
    return (
      <div className="space-y-4 px-1 py-2">
        {[1, 2, 3].map(i => (
          <div key={i} className="flex items-start gap-3">
            <Skeleton width="24px" height="24px" rounded="full" className="shrink-0 mt-0.5" />
            <div className="flex-1 space-y-1.5">
              <Skeleton width="60%" height="13px" />
              <Skeleton width="40%" height="11px" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (activities.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-10 text-center">
        <History size={20} className="mb-2 opacity-30" style={{ color: 'var(--text-muted)' }} />
        <p className="text-xs" style={{ color: 'var(--text-muted)' }}>No activity recorded yet.</p>
      </div>
    );
  }

  return (
    <div className="relative pl-5 ml-2 border-l space-y-5" style={{ borderColor: 'var(--border)' }}>
      {activities.map((activity) => (
        <div key={activity.id} className="relative">
          {/* Timeline dot */}
          <div
            className="absolute -left-[21px] top-1 w-5 h-5 rounded-full flex items-center justify-center shrink-0"
            style={{ background: 'var(--surface-overlay)', border: '1px solid var(--border)' }}
          >
            {getIcon(activity.action)}
          </div>

          <div className="flex flex-col gap-1">
            <p className="text-xs leading-snug" style={{ color: 'var(--text-secondary)' }}>
              <span className="font-semibold" style={{ color: 'var(--text-primary)' }}>{activity.user?.name}</span>
              {' '}{activity.action}
            </p>
            {activity.details && (
              <p
                className="text-[11px] px-2.5 py-1.5 rounded-[var(--radius-sm)] mt-0.5 break-words"
                style={{ background: 'var(--surface-subtle)', color: 'var(--text-muted)', border: '1px solid var(--border)' }}
              >
                {activity.details}
              </p>
            )}
            <span className="text-[10px] font-medium" style={{ color: 'var(--text-muted)' }}>
              {formatRelativeTime(activity.createdAt)}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
};

export default ActivityTimeline;
