import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/auth/AuthContext';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { ShieldCheck, Mail, Lock, AlertCircle } from 'lucide-react';
import './LoginPage.css';

export const LoginPage: React.FC = () => {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email || !password) {
      setError('Please enter both email address and password.');
      return;
    }

    setIsSubmitting(true);
    try {
      await login({ email, password });
      navigate('/dashboard');
    } catch (err: any) {
      setError(typeof err === 'string' ? err : 'Invalid login credentials.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-card glass-panel">
        <div className="login-brand">
          <div className="brand-badge">
            <ShieldCheck size={28} />
          </div>
          <h2 className="login-title">Shoky LMS Staff Portal</h2>
          <p className="login-subtitle">Higher Technological Institute Management Dashboard</p>
        </div>

        {error && (
          <div className="login-error-alert">
            <AlertCircle size={18} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="login-form">
          <Input
            label="Staff Email Address"
            type="email"
            placeholder="name@hti.edu.eg"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            leftIcon={<Mail size={18} />}
            required
          />

          <Input
            label="Password"
            type="password"
            placeholder="••••••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            leftIcon={<Lock size={18} />}
            required
          />

          <div className="login-options">
            <Link to="/forgot-password" className="forgot-password-link">
              Forgot password?
            </Link>
          </div>

          <Button
            type="submit"
            variant="primary"
            size="lg"
            isLoading={isSubmitting}
            className="login-submit-btn"
          >
            Sign In to Dashboard
          </Button>
        </form>

        <div className="login-footer">
          <p>Protected System — Staff Credentials Only</p>
        </div>
      </div>
    </div>
  );
};
