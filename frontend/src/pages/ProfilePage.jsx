import { useState, useEffect, useContext } from 'react';
import { ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import API from '../api/axios';
import DashboardLayout from '../layouts/DashboardLayout';
import { AuthContext } from '../context/AuthContext';
import { ProfileHero } from '../features/profile/components/ProfileHero';
import { PasswordForm } from '../features/profile/components/PasswordForm';

const ProfilePage = () => {
  const { user: authUser } = useContext(AuthContext);

  // Seed immediately from cached user, enrich from API for createdAt
  const [profile, setProfile] = useState(
    authUser ? { name: authUser.name, email: authUser.email, id: authUser.id } : null
  );
  const [loading, setLoading] = useState(!authUser);

  // Password form state
  const [pwLoading, setPwLoading] = useState(false);
  const [pwError,   setPwError]   = useState('');
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

  // Preserved password-change behavior — same API call, same validation
  const handlePasswordChange = async (form, resetForm) => {
    setPwError('');
    setPwSuccess(false);
    if (form.newPassword !== form.confirm) {
      setPwError('New passwords do not match');
      return;
    }
    if (form.newPassword.length < 6) {
      setPwError('Password must be at least 6 characters');
      return;
    }
    setPwLoading(true);
    try {
      await API.patch('/auth/me/password', {
        currentPassword: form.currentPassword,
        newPassword:     form.newPassword,
      });
      setPwSuccess(true);
      resetForm();
      setTimeout(() => setPwSuccess(false), 5000);
    } catch (err) {
      setPwError(err.response?.data?.error || 'Failed to update password');
    } finally {
      setPwLoading(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="max-w-[560px] mx-auto">

        {/* Back link */}
        <Link
          to="/dashboard"
          className="inline-flex items-center gap-1.5 text-xs font-medium mb-6 transition-colors"
          style={{ color: 'var(--text-muted)' }}
          onMouseEnter={e => e.currentTarget.style.color = 'var(--accent-text)'}
          onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'}
        >
          <ArrowLeft size={13} /> Back to Dashboard
        </Link>

        {/* Page title */}
        <div className="mb-5">
          <h1 className="text-xl font-bold tracking-tight" style={{ color: 'var(--text-primary)' }}>
            Account Settings
          </h1>
          <p className="text-sm mt-0.5" style={{ color: 'var(--text-muted)' }}>
            Manage your identity and account security
          </p>
        </div>

        {/* Sections */}
        <div className="space-y-4">
          {/* Identity */}
          <ProfileHero profile={profile} loading={loading} />

          {/* Security */}
          <PasswordForm
            onSubmit={handlePasswordChange}
            loading={pwLoading}
            error={pwError}
            success={pwSuccess}
          />
        </div>

      </div>
    </DashboardLayout>
  );
};

export default ProfilePage;
