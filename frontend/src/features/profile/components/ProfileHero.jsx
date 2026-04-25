import { Mail, Calendar, ShieldCheck } from 'lucide-react';
import { Skeleton } from '../../../design-system/Skeleton';

const AVATAR_COLORS = ['#3b82f6', '#8b5cf6', '#10b981', '#f43f5e', '#f59e0b'];

const getAvatarColor = (name) => {
  const initials = name ? name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) : '?';
  return AVATAR_COLORS[initials.charCodeAt(0) % AVATAR_COLORS.length];
};

const MetaRow = ({ icon, children }) => (
  <span className="flex items-center gap-2 text-sm" style={{ color: 'var(--text-muted)' }}>
    <span className="opacity-60">{icon}</span>
    {children}
  </span>
);

export const ProfileHero = ({ profile, loading }) => {
  const name     = profile?.name || '';
  const initials = name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || '?';
  const color    = getAvatarColor(name);
  const memberSince = profile?.createdAt
    ? new Date(profile.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long' })
    : null;

  return (
    <div
      className="rounded-[var(--radius-xl)] overflow-hidden"
      style={{ border: '1px solid var(--border)', background: 'var(--surface-raised)' }}
    >
      {/* Banner */}
      <div
        className="h-20 w-full"
        style={{
          background: `linear-gradient(135deg, ${color}18 0%, var(--surface-overlay) 60%, var(--surface-base) 100%)`,
          borderBottom: '1px solid var(--border)',
        }}
      />

      {/* Identity */}
      <div className="px-6 pb-6">
        {/* Avatar — overlaps banner */}
        <div className="-mt-10 mb-4">
          {loading ? (
            <Skeleton width="72px" height="72px" rounded="lg" />
          ) : (
            <div
              className="w-[72px] h-[72px] rounded-[var(--radius-lg)] flex items-center justify-center text-2xl font-black text-white shadow-lg"
              style={{
                background: color,
                border: '3px solid var(--surface-raised)',
                boxShadow: `0 0 0 1px var(--border), 0 8px 24px ${color}33`,
              }}
            >
              {initials}
            </div>
          )}
        </div>

        {loading ? (
          <div className="space-y-3">
            <Skeleton width="180px" height="24px" rounded="md" />
            <Skeleton width="220px" height="16px" rounded="md" />
            <Skeleton width="150px" height="16px" rounded="md" />
          </div>
        ) : (
          <div>
            <div className="flex items-start justify-between flex-wrap gap-3">
              <div>
                <h1 className="text-xl font-bold tracking-tight mb-2" style={{ color: 'var(--text-primary)' }}>
                  {profile?.name || '—'}
                </h1>
                <div className="flex flex-col gap-1.5">
                  <MetaRow icon={<Mail size={13} />}>{profile?.email || '—'}</MetaRow>
                  {memberSince && (
                    <MetaRow icon={<Calendar size={13} />}>Member since {memberSince}</MetaRow>
                  )}
                </div>
              </div>

              {/* Trust badge */}
              <div
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-[var(--radius-md)] text-xs font-medium shrink-0"
                style={{
                  background: 'rgba(34,197,94,0.08)',
                  color: '#22c55e',
                  border: '1px solid rgba(34,197,94,0.2)',
                }}
              >
                <ShieldCheck size={13} />
                Verified account
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProfileHero;
