import React, { useState } from 'react';
import { useAuth } from '@/auth/AuthContext';
import { usersApi } from '@/api/users';
import { Card, CardHeader, CardBody } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { RoleBadge, DepartmentBadge } from '@/components/ui/Badge';
import { Toast } from '@/components/ui/Toast';
import { User, Lock } from 'lucide-react';

export const ProfilePage: React.FC = () => {
  const { user, refreshProfile } = useAuth();

  const [fullName, setFullName] = useState(user?.fullName || '');
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName) return;

    setIsUpdatingProfile(true);
    try {
      await usersApi.updateProfile({ fullName });
      await refreshProfile();
      setToast({ message: 'Profile updated successfully', type: 'success' });
    } catch (err: any) {
      setToast({ message: typeof err === 'string' ? err : 'Failed to update profile', type: 'error' });
    } finally {
      setIsUpdatingProfile(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPassword || !newPassword || !confirmPassword) return;

    if (newPassword !== confirmPassword) {
      setToast({ message: 'New password and confirm password do not match.', type: 'error' });
      return;
    }

    setIsChangingPassword(true);
    try {
      await usersApi.changePassword({ currentPassword, newPassword, confirmPassword });
      setToast({ message: 'Password changed successfully', type: 'success' });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      setToast({ message: typeof err === 'string' ? err : 'Failed to change password', type: 'error' });
    } finally {
      setIsChangingPassword(false);
    }
  };

  if (!user) return null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', maxWidth: '800px', margin: '0 auto' }}>
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      <div>
        <h2 style={{ fontSize: '24px', fontWeight: 700, color: '#EAF0FF' }}>Staff Profile & Security</h2>
        <p style={{ fontSize: '13px', color: '#9AA6C3', marginTop: '2px' }}>
          Manage your personal information and account security credentials
        </p>
      </div>

      <Card>
        <CardHeader title="Account Details" />
        <CardBody>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '24px' }}>
            <div style={{
              width: '64px',
              height: '64px',
              borderRadius: '50%',
              backgroundColor: 'var(--primary-subtle)',
              color: 'var(--primary)',
              fontSize: '24px',
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: '2px solid var(--primary-border)',
            }}>
              {user.fullName.charAt(0).toUpperCase()}
            </div>
            <div>
              <h3 style={{ fontSize: '18px', fontWeight: 600 }}>{user.fullName}</h3>
              <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>{user.email}</p>
              <div style={{ display: 'flex', gap: '8px', marginTop: '6px' }}>
                <RoleBadge role={user.role.name} />
                {user.department && <DepartmentBadge department={user.department} />}
              </div>
            </div>
          </div>

          <form onSubmit={handleUpdateProfile} className="modal-form-stack">
            <Input
              label="Full Name"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              leftIcon={<User size={18} />}
              required
            />
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <Button type="submit" variant="primary" isLoading={isUpdatingProfile}>
                Save Profile
              </Button>
            </div>
          </form>
        </CardBody>
      </Card>

      <Card>
        <CardHeader title="Change Password" subtitle="Ensure your account is using a strong password" />
        <CardBody>
          <form onSubmit={handleChangePassword} className="modal-form-stack">
            <Input
              label="Current Password"
              type="password"
              placeholder="••••••••••••"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              leftIcon={<Lock size={18} />}
              required
            />

            <Input
              label="New Password"
              type="password"
              placeholder="••••••••••••"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              leftIcon={<Lock size={18} />}
              required
            />

            <Input
              label="Confirm New Password"
              type="password"
              placeholder="••••••••••••"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              leftIcon={<Lock size={18} />}
              required
            />

            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <Button type="submit" variant="secondary" isLoading={isChangingPassword}>
                Update Password
              </Button>
            </div>
          </form>
        </CardBody>
      </Card>
    </div>
  );
};
