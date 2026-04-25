import { useState } from 'react';
import { Lock, CheckCircle, ShieldAlert } from 'lucide-react';
import { Input } from '../../../design-system/Input';
import { Button } from '../../../design-system/Button';

const StatusMessage = ({ type, children }) => {
  const s = type === 'success'
    ? { bg: 'var(--success-bg)', border: 'var(--success-border)', color: 'var(--success)', icon: <CheckCircle size={13} /> }
    : { bg: 'var(--danger-bg)',  border: 'var(--danger-border)',  color: 'var(--danger)',  icon: <ShieldAlert size={13} /> };

  return (
    <div
      className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-[var(--radius-md)] text-sm"
      style={{ background: s.bg, border: `1px solid ${s.border}`, color: s.color }}
    >
      {s.icon}
      {children}
    </div>
  );
};

export const PasswordForm = ({ onSubmit, loading, error, success }) => {
  const [form, setForm] = useState({ currentPassword: '', newPassword: '', confirm: '' });
  const set = (key) => (e) => setForm(p => ({ ...p, [key]: e.target.value }));

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(form, () => setForm({ currentPassword: '', newPassword: '', confirm: '' }));
  };

  return (
    <div
      className="rounded-[var(--radius-xl)] p-6"
      style={{ border: '1px solid var(--border)', background: 'var(--surface-raised)' }}
    >
      {/* Card header */}
      <div className="flex items-center gap-2.5 mb-5" style={{ borderBottom: '1px solid var(--border)', paddingBottom: '1rem' }}>
        <div
          className="w-8 h-8 rounded-[var(--radius-md)] flex items-center justify-center shrink-0"
          style={{ background: 'rgba(59,130,246,0.12)', color: 'var(--accent-text)' }}
        >
          <Lock size={15} />
        </div>
        <div>
          <h2 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Change Password</h2>
          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Use a strong password you don't use elsewhere</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Current Password"
          id="current-password"
          type="password"
          placeholder="Your current password"
          value={form.currentPassword}
          onChange={set('currentPassword')}
          required
          disabled={loading}
          autoComplete="current-password"
        />

        <div className="pt-1" style={{ borderTop: '1px dashed var(--border)' }}>
          <div className="space-y-4 pt-4">
            <Input
              label="New Password"
              id="new-password"
              type="password"
              placeholder="Min. 6 characters"
              value={form.newPassword}
              onChange={set('newPassword')}
              required
              disabled={loading}
              autoComplete="new-password"
            />
            <Input
              label="Confirm New Password"
              id="confirm-password"
              type="password"
              placeholder="Repeat new password"
              value={form.confirm}
              onChange={set('confirm')}
              required
              disabled={loading}
              autoComplete="new-password"
            />
          </div>
        </div>

        {error   && <StatusMessage type="error">{error}</StatusMessage>}
        {success && <StatusMessage type="success">Password updated successfully.</StatusMessage>}

        <div className="flex items-center justify-between pt-1">
          <p className="text-[11px]" style={{ color: 'var(--text-muted)' }}>
            Passwords are encrypted and never stored in plain text.
          </p>
          <Button type="submit" variant="primary" size="md" loading={loading}>
            {loading ? 'Saving…' : 'Update Password'}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default PasswordForm;
