import { useState, useEffect } from 'react';
import { Sparkles, Activity, AlertCircle } from 'lucide-react';
import API from '../../../api/axios';

export const AIHealthWidget = ({ projectId }) => {
  const [health, setHealth] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!projectId) return;

    let isMounted = true;
    const fetchHealth = async () => {
      setLoading(true);
      try {
        const r = await API.get(`/projects/${projectId}/ai/health`);
        if (isMounted) setHealth(r.data.data);
      } catch {
        // ignore
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchHealth();
    return () => { isMounted = false; };
  }, [projectId]);

  if (loading) {
    return (
      <div className="flex items-center gap-3 p-3 rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--surface-base)] opacity-70 animate-pulse">
        <Sparkles size={16} className="text-purple-400" />
        <span className="text-sm text-[var(--text-muted)]">Analyzing project health...</span>
      </div>
    );
  }

  if (!health) return null;

  const isHealthy = health.score >= 75;
  const isCritical = health.score < 50;

  return (
    <div className="flex flex-col gap-2 p-4 rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--surface-base)] shadow-[var(--shadow-sm)]">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles size={16} className="text-purple-400" />
          <h3 className="text-sm font-semibold text-[var(--text-primary)]">AI Project Health</h3>
        </div>
        <div className={`flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded-full ${
          isHealthy ? 'bg-emerald-500/10 text-emerald-400' :
          isCritical ? 'bg-red-500/10 text-red-400' : 'bg-amber-500/10 text-amber-400'
        }`}>
          {isHealthy ? <Activity size={12} /> : <AlertCircle size={12} />}
          {health.score}/100
        </div>
      </div>
      
      <p className="text-xs text-[var(--text-secondary)]">{health.summary}</p>
      
      {health.reasons && health.reasons.length > 0 && !isHealthy && (
        <ul className="mt-1 list-disc pl-4 space-y-0.5 text-[11px] text-[var(--text-muted)]">
          {health.reasons.map((reason, i) => (
            <li key={i}>{reason}</li>
          ))}
        </ul>
      )}
    </div>
  );
};
