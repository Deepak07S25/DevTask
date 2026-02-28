import { useState, useEffect } from 'react';
import API from '../api/axios';
import { History, Target, AlertCircle, FileText, Calendar, User, LayoutList } from 'lucide-react';

const formatRelativeTime = (dateStr) => {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
};

const getActionIcon = (action) => {
  if (action.includes('status')) return <Target size={14} className="text-sky-400" />;
  if (action.includes('priority')) return <AlertCircle size={14} className="text-amber-400" />;
  if (action.includes('description')) return <FileText size={14} className="text-zinc-400" />;
  if (action.includes('due date')) return <Calendar size={14} className="text-rose-400" />;
  if (action.includes('assign')) return <User size={14} className="text-emerald-400" />;
  if (action.includes('title')) return <LayoutList size={14} className="text-violet-400" />;
  return <History size={14} className="text-zinc-400" />;
};

const ActivityTimeline = ({ taskId }) => {
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchActivities = async () => {
      try {
        const res = await API.get(`/tasks/${taskId}/activities`);
        setActivities(res.data);
      } catch (err) {
        console.error("Failed to load activities", err);
      } finally {
        setLoading(false);
      }
    };
    fetchActivities();
  }, [taskId]);

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <div className="w-5 h-5 border-2 border-sky-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (activities.length === 0) {
    return (
      <div className="text-center py-8">
        <History size={24} className="text-zinc-600 mx-auto mb-2" />
        <p className="text-zinc-500 text-sm">No activity recorded yet.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4 px-2">
      <div className="relative border-l border-zinc-700/50 pl-6 ml-3 space-y-6">
        {activities.map((activity, index) => (
          <div key={activity.id} className="relative group">
            <div className="absolute -left-[31px] top-1 w-6 h-6 rounded-full bg-zinc-800 border-2 border-zinc-900 flex items-center justify-center">
              {getActionIcon(activity.action)}
            </div>

            <div className="flex flex-col gap-1 text-sm">
              <div className="text-zinc-300 leading-snug">
                <span className="font-bold text-white">{activity.user.name}</span>{' '}
                <span className="text-zinc-400">{activity.action}</span>
              </div>
              
              {activity.details && (
                <div className="bg-zinc-800/80 rounded-md px-3 py-2 text-zinc-400 text-xs mt-1 border border-zinc-700/50 break-words">
                  {activity.details}
                </div>
              )}
              
              <div className="text-[11px] text-zinc-600 font-medium">
                {formatRelativeTime(activity.createdAt)}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ActivityTimeline;
