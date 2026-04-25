import { useState, useEffect } from 'react';
import { UserPlus, Trash2, Shield, User } from 'lucide-react';
import API from '../api/axios';
import { Modal } from '../design-system/Modal';
import { Button } from '../design-system/Button';
import { IconButton } from '../design-system/IconButton';
import { Badge } from '../design-system/Badge';
import { useConfirm } from '../design-system/Confirm';

const Avatar = ({ name }) => {
  const initials = name ? name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2) : '?';
  const colors = ['#3b82f6', '#8b5cf6', '#10b981', '#f43f5e', '#f59e0b'];
  const bg = colors[initials.charCodeAt(0) % colors.length];
  return (
    <div 
      className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold text-white shrink-0"
      style={{ background: bg }}
    >
      {initials}
    </div>
  );
};

const MembersModal = ({ isOpen, onClose, projectId }) => {
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [inviting, setInviting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const confirm = useConfirm();

  useEffect(() => {
    const fetchMembers = async () => {
      setLoading(true);
      try {
        const res = await API.get(`/projects/${projectId}/members`);
        setMembers(res.data);
      } catch {
        setError('Failed to load members');
      } finally {
        setLoading(false);
      }
    };

    if (isOpen && projectId) {
      setError('');
      setSuccess('');
      fetchMembers();
    }
  }, [isOpen, projectId]);

  if (!isOpen) return null;

  const handleInvite = async (e) => {
    e.preventDefault();
    if (!email.trim()) return;
    setInviting(true);
    setError('');
    setSuccess('');
    try {
      const res = await API.post(`/projects/${projectId}/members`, { email: email.trim() });
      setMembers((prev) => [...prev, res.data]);
      setEmail('');
      setSuccess(`${res.data.user.name} added to project!`);
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to invite member');
    } finally {
      setInviting(false);
    }
  };

  const handleRemove = async (userId, userName) => {
    const isConfirmed = await confirm({
      title: 'Remove Member',
      message: `Remove ${userName} from this project?`,
      confirmText: 'Remove',
      danger: true
    });
    if (!isConfirmed) return;
    
    try {
      await API.delete(`/projects/${projectId}/members/${userId}`);
      setMembers((prev) => prev.filter((m) => m.user.id !== userId));
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to remove member');
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Team Members">
      <div className="space-y-6">
        {/* Invite Form */}
        <form onSubmit={handleInvite} className="flex gap-2">
          <input
            type="email"
            value={email}
            onChange={(e) => { setEmail(e.target.value); setError(''); }}
            placeholder="Invite by email address..."
            className="flex-1 px-3.5 py-2.5 bg-[var(--surface-overlay)] border border-[var(--border)] rounded-[var(--radius-md)] text-sm text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 outline-none transition-all duration-[var(--ease-base)]"
          />
          <Button
            type="submit"
            variant="primary"
            size="md"
            icon={<UserPlus size={15} />}
            loading={inviting}
            disabled={!email.trim() || inviting}
          >
            {inviting ? 'Inviting...' : 'Invite'}
          </Button>
        </form>

        {/* Feedback Messages */}
        {error && (
          <div className="text-xs px-3 py-2.5 rounded-[var(--radius-md)] bg-[var(--danger-bg)] text-[var(--danger)] border border-[var(--danger-border)]">
            {error}
          </div>
        )}
        {success && (
          <div className="text-xs px-3 py-2.5 rounded-[var(--radius-md)] bg-[var(--success-bg)] text-[var(--success)] border border-[var(--success-border)]">
            {success}
          </div>
        )}

        {/* Members List */}
        <div>
          <p className="text-[11px] font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-3">
            {members.length} {members.length === 1 ? 'member' : 'members'}
          </p>
          
          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map(i => (
                <div key={i} className="flex items-center gap-3 p-3 bg-[var(--surface-overlay)] rounded-[var(--radius-lg)] border border-[var(--border)]">
                  <div className="w-9 h-9 rounded-full bg-[var(--surface-subtle)] animate-pulse" />
                  <div className="flex-1 space-y-1.5">
                    <div className="w-24 h-3 bg-[var(--surface-subtle)] rounded animate-pulse" />
                    <div className="w-32 h-2.5 bg-[var(--surface-subtle)] rounded animate-pulse" />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-2">
              {members.map((member) => (
                <div key={member.id} className="flex items-center gap-3 p-3 bg-[var(--surface-overlay)] rounded-[var(--radius-lg)] border border-[var(--border)]">
                  <Avatar name={member.user.name} />
                  
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-[var(--text-primary)] truncate">
                      {member.user.name}
                    </p>
                    <p className="text-xs text-[var(--text-muted)] truncate">
                      {member.user.email}
                    </p>
                  </div>
                  
                  {/* Role Badge */}
                  <Badge variant={member.role === 'ADMIN' ? 'warning' : 'default'} className="shrink-0 gap-1.5">
                    {member.role === 'ADMIN' ? <Shield size={10} /> : <User size={10} />}
                    {member.role}
                  </Badge>

                  {/* Remove Action */}
                  {member.role !== 'ADMIN' && (
                    <IconButton
                      icon={<Trash2 size={14} />}
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemove(member.user.id, member.user.name)}
                      className="text-[var(--text-muted)] hover:text-red-400 hover:bg-red-400/10 ml-1"
                      label="Remove member"
                    />
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
};

export default MembersModal;
