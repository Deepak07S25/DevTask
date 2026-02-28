import { useState, useEffect, useContext } from 'react';
import { User, Mail, Calendar, Lock, Save, CheckCircle, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import API from '../api/axios';
import DashboardLayout from '../layouts/DashboardLayout';
import { AuthContext } from '../context/AuthContext';

const ProfilePage = () => {
  const { user: authUser } = useContext(AuthContext);
  // Seed immediately from localStorage-persisted user info
  const [profile, setProfile] = useState(
    authUser ? { name: authUser.name, email: authUser.email, id: authUser.id } : null
  );
  const [loading, setLoading] = useState(!authUser); // skip skeleton if we have data

  // Password change form
  const [pwForm, setPwForm] = useState({ currentPassword: '', newPassword: '', confirm: '' });
  const [pwLoading, setPwLoading] = useState(false);
  const [pwError, setPwError] = useState('');
  const [pwSuccess, setPwSuccess] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await API.get('/auth/me');
        setProfile(res.data); // enriches with createdAt
      } catch {
        // silently fall back to authUser data already seeded
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, []);

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    setPwError('');
    if (pwForm.newPassword !== pwForm.confirm) {
      setPwError('New passwords do not match');
      return;
    }
    if (pwForm.newPassword.length < 6) {
      setPwError('Password must be at least 6 characters');
      return;
    }
    setPwLoading(true);
    try {
      await API.patch('/auth/me/password', {
        currentPassword: pwForm.currentPassword,
        newPassword: pwForm.newPassword,
      });
      setPwSuccess(true);
      setPwForm({ currentPassword: '', newPassword: '', confirm: '' });
      setTimeout(() => setPwSuccess(false), 4000);
    } catch (err) {
      setPwError(err.response?.data?.error || 'Failed to update password');
    } finally {
      setPwLoading(false);
    }
  };

  // Avatar initials
  const name = profile?.name || '';
  const initials = name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2) || '?';
  const avatarColors = ['bg-sky-600', 'bg-violet-600', 'bg-emerald-600', 'bg-rose-600', 'bg-amber-600'];
  const avatarColor = initials ? avatarColors[initials.charCodeAt(0) % avatarColors.length] : 'bg-zinc-600';

  return (
    <DashboardLayout>
      <div className="max-w-2xl mx-auto">
        {/* Back */}
        <Link to="/dashboard" className="inline-flex items-center gap-2 text-zinc-500 hover:text-white text-sm mb-6 transition">
          <ArrowLeft size={16} /> Back to Dashboard
        </Link>

        {/* Profile Card */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden mb-6">
          {/* Header banner */}
          <div className="h-24 bg-gradient-to-r from-sky-900/60 via-violet-900/40 to-zinc-900" />

          <div className="px-6 pb-6">
            {/* Avatar */}
            <div className="-mt-10 mb-4">
              {loading ? (
                <div className="w-20 h-20 rounded-2xl bg-zinc-800 animate-pulse" />
              ) : (
                <div className={`w-20 h-20 rounded-2xl ${avatarColor} flex items-center justify-center text-2xl font-black text-white border-4 border-zinc-900 shadow-xl`}>
                  {initials}
                </div>
              )}
            </div>

            {loading ? (
              <div className="space-y-3">
                <div className="h-7 bg-zinc-800 rounded w-40 animate-pulse" />
                <div className="h-4 bg-zinc-800 rounded w-56 animate-pulse" />
              </div>
            ) : (
              <>
                <h1 className="text-2xl font-black text-white mb-1">{profile?.name}</h1>
                <div className="flex flex-col gap-2 text-sm text-zinc-500">
                  <span className="flex items-center gap-2">
                    <Mail size={14} /> {profile?.email}
                  </span>
                  <span className="flex items-center gap-2">
                    <Calendar size={14} /> Member since{' '}
                    {profile?.createdAt
                      ? new Date(profile.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long' })
                      : '—'}
                  </span>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Change Password Card */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
          <h2 className="flex items-center gap-2 text-lg font-bold text-white mb-5">
            <Lock size={18} className="text-sky-400" /> Change Password
          </h2>

          <form onSubmit={handlePasswordChange} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1.5">Current Password</label>
              <input
                type="password" required
                className="w-full p-3 bg-zinc-800 border border-zinc-700 rounded-lg text-white focus:border-sky-500 outline-none"
                value={pwForm.currentPassword}
                onChange={(e) => setPwForm({ ...pwForm, currentPassword: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1.5">New Password</label>
              <input
                type="password" required
                className="w-full p-3 bg-zinc-800 border border-zinc-700 rounded-lg text-white focus:border-sky-500 outline-none"
                value={pwForm.newPassword}
                onChange={(e) => setPwForm({ ...pwForm, newPassword: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1.5">Confirm New Password</label>
              <input
                type="password" required
                className="w-full p-3 bg-zinc-800 border border-zinc-700 rounded-lg text-white focus:border-sky-500 outline-none"
                value={pwForm.confirm}
                onChange={(e) => setPwForm({ ...pwForm, confirm: e.target.value })}
              />
            </div>

            {pwError && <p className="text-red-400 text-sm bg-red-900/20 border border-red-900/40 rounded-lg px-3 py-2">{pwError}</p>}
            {pwSuccess && (
              <p className="text-green-400 text-sm bg-green-900/20 border border-green-900/40 rounded-lg px-3 py-2 flex items-center gap-2">
                <CheckCircle size={14} /> Password updated successfully!
              </p>
            )}

            <button
              type="submit"
              disabled={pwLoading}
              className="flex items-center gap-2 px-5 py-2.5 bg-sky-600 hover:bg-sky-500 text-white font-bold rounded-lg transition disabled:opacity-50"
            >
              <Save size={16} />
              {pwLoading ? 'Saving...' : 'Update Password'}
            </button>
          </form>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default ProfilePage;
