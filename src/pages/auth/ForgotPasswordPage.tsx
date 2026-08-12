import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { authApi } from '@/api/auth';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Mail, ArrowLeft, CheckCircle2, AlertCircle } from 'lucide-react';
import './LoginPage.css';

export const ForgotPasswordPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!email) return;

    setIsSubmitting(true);
    try {
      await authApi.forgotPassword(email);
      setSuccess(true);
    } catch (err: any) {
      setError(typeof err === 'string' ? err : 'Failed to request password reset.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-card glass-panel">
        <div className="login-brand">
          <h2 className="login-title">Reset Password</h2>
          <p className="login-subtitle">Enter your registered staff email address</p>
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
            <h3 style={{ fontSize: '18px', color: '#EAF0FF', marginBottom: '8px' }}>Reset Link Sent</h3>
            <p style={{ fontSize: '13px', color: '#9AA6C3', marginBottom: '20px' }}>
              If your email is registered in the system, you will receive password reset instructions shortly.
            </p>
            <Link to="/login">
              <Button variant="outline" size="md">Back to Login</Button>
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="login-form">
            <Input
              label="Staff Email"
              type="email"
              placeholder="name@hti.edu.eg"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              leftIcon={<Mail size={18} />}
              required
            />

            <Button type="submit" variant="primary" size="lg" isLoading={isSubmitting}>
              Send Reset Link
            </Button>

            <div style={{ textAlign: 'center', marginTop: '12px' }}>
              <Link to="/login" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: '#9AA6C3' }}>
                <ArrowLeft size={16} /> Back to Sign In
              </Link>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
