import { useState, useEffect } from 'react';
import { X, UserPlus, Trash2, Shield, User } from 'lucide-react';
import API from '../api/axios';

const Avatar = ({ name }) => {
  const initials = name ? name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2) : '?';
  const colors = ['bg-sky-600', 'bg-violet-600', 'bg-emerald-600', 'bg-rose-600', 'bg-amber-600'];
  const color = colors[initials.charCodeAt(0) % colors.length];
  return (
    <div className={`w-9 h-9 rounded-full ${color} flex items-center justify-center text-sm font-bold text-white flex-shrink-0`}>
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

  useEffect(() => {
    if (isOpen && projectId) fetchMembers();
  }, [isOpen, projectId]);

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
    if (!window.confirm(`Remove ${userName} from this project?`)) return;
    try {
      await API.delete(`/projects/${projectId}/members/${userId}`);
      setMembers((prev) => prev.filter((m) => m.user.id !== userId));
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to remove member');
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="bg-zinc-900 border border-zinc-800 w-full max-w-md rounded-2xl shadow-2xl flex flex-col max-h-[80vh] overflow-hidden">
        {/* Header */}
        <div className="flex justify-between items-center p-5 border-b border-zinc-800 flex-shrink-0">
          <h2 className="text-xl font-bold text-white">Team Members</h2>
          <button onClick={onClose} className="text-zinc-500 hover:text-white transition"><X size={24} /></button>
        </div>

        {/* Body */}
        <div className="overflow-y-auto flex-1 p-5 space-y-5">
          {/* Invite Form */}
          <form onSubmit={handleInvite} className="flex gap-2">
            <input
              type="email"
              value={email}
              onChange={(e) => { setEmail(e.target.value); setError(''); }}
              placeholder="Invite by email address..."
              className="flex-1 px-3 py-2.5 bg-zinc-800 border border-zinc-700 rounded-lg text-white text-sm focus:border-sky-500 outline-none placeholder-zinc-600"
            />
            <button type="submit" disabled={inviting || !email.trim()} className="px-4 py-2.5 bg-sky-600 hover:bg-sky-500 text-white rounded-lg transition disabled:opacity-40 flex items-center gap-1.5 text-sm font-bold">
              <UserPlus size={15} />
              {inviting ? '...' : 'Invite'}
            </button>
          </form>

          {/* Feedback messages */}
          {error && <p className="text-red-400 text-sm bg-red-900/20 border border-red-900/40 rounded-lg px-3 py-2">{error}</p>}
          {success && <p className="text-green-400 text-sm bg-green-900/20 border border-green-900/40 rounded-lg px-3 py-2">{success}</p>}

          {/* Members List */}
          <div>
            <p className="text-xs font-medium text-zinc-600 uppercase tracking-wider mb-3">
              {members.length} {members.length === 1 ? 'member' : 'members'}
            </p>
            {loading ? (
              <div className="flex justify-center py-6">
                <div className="w-6 h-6 border-2 border-sky-500 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : (
              <div className="space-y-3">
                {members.map((member) => (
                  <div key={member.id} className="flex items-center gap-3 p-3 bg-zinc-800/50 rounded-xl border border-zinc-800">
                    <Avatar name={member.user.name} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-white truncate">{member.user.name}</p>
                      <p className="text-xs text-zinc-500 truncate">{member.user.email}</p>
                    </div>
                    {/* Role badge */}
                    <span className={`flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-full border ${member.role === 'ADMIN' ? 'bg-amber-900/40 text-amber-400 border-amber-800' : 'bg-zinc-800 text-zinc-500 border-zinc-700'}`}>
                      {member.role === 'ADMIN' ? <Shield size={10} /> : <User size={10} />}
                      {member.role}
                    </span>
                    {/* Remove button — only for non-admins */}
                    {member.role !== 'ADMIN' && (
                      <button onClick={() => handleRemove(member.user.id, member.user.name)} className="p-1.5 text-zinc-600 hover:text-red-400 hover:bg-red-900/20 rounded-lg transition">
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MembersModal;
