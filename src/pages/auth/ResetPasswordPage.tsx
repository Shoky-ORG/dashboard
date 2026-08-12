import React, { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { authApi } from '@/api/auth';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Lock, AlertCircle, CheckCircle2 } from 'lucide-react';
import './LoginPage.css';

export const ResetPasswordPage: React.FC = () => {
  const { sessionId } = useParams<{ sessionId: string }>();
  const navigate = useNavigate();

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!sessionId) {
      setError('Invalid or missing password reset token.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setIsSubmitting(true);
    try {
      await authApi.resetPassword(sessionId, password, confirmPassword);
      setSuccess(true);
    } catch (err: any) {
      setError(typeof err === 'string' ? err : 'Failed to reset password. Link may have expired.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-card glass-panel">
        <div className="login-brand">
          <h2 className="login-title">Set New Password</h2>
          <p className="login-subtitle">Enter your new secure password</p>
        </div>

        {error && (
          <div className="login-error-alert">
            <AlertCircle size={18} />
            <span>{error}</span>
          </div>
        )}

        {success ? (
          <div style={{ textAlign: 'center', padding: '16px 0' }}>
            <CheckCircle2 size={48} style={{ color: '#9BE046', marginBottom: '12px' }} />
            <h3 style={{ fontSize: '18px', color: '#EAF0FF', marginBottom: '8px' }}>Password Changed</h3>
            <p style={{ fontSize: '13px', color: '#9AA6C3', marginBottom: '20px' }}>
              Your password has been successfully updated. You can now log in.
            </p>
            <Button variant="primary" size="lg" onClick={() => navigate('/login')}>
              Go to Sign In
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="login-form">
            <Input
              label="New Password"
              type="password"
              placeholder="••••••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
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

            <Button type="submit" variant="primary" size="lg" isLoading={isSubmitting}>
              Update Password
            </Button>
          </form>
        )}
      </div>
    </div>
  );
};
