import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Button } from '@/components/ui/Button';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error caught by ErrorBoundary:', error, errorInfo);
  }

  public handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '48px 24px',
          backgroundColor: 'var(--surface-card)',
          border: '1px solid var(--border-color)',
          borderRadius: 'var(--radius-card)',
          margin: '24px',
          textAlign: 'center',
        }}>
          <AlertTriangle size={48} style={{ color: 'var(--danger)', marginBottom: '16px' }} />
          <h3 style={{ fontSize: '18px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '8px' }}>
            Something went wrong in this section
          </h3>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)', maxWidth: '500px', marginBottom: '20px' }}>
            {this.state.error?.message || 'An unexpected rendering error occurred.'}
          </p>
          <Button variant="primary" size="sm" onClick={this.handleReset} leftIcon={<RefreshCw size={16} />}>
            Reload Section
          </Button>
        </div>
      );
    }

    return this.props.children;
  }
}
