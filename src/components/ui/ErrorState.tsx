import React from 'react';
import { AlertTriangle } from 'lucide-react';
import { Button } from './Button';
import './States.css';

export interface ErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
}

export const ErrorState: React.FC<ErrorStateProps> = ({
  title = 'Something Went Wrong',
  message = 'Failed to load requested data. Please try again.',
  onRetry,
}) => {
  return (
    <div className="state-container error-state">
      <div className="state-icon error"><AlertTriangle size={40} /></div>
      <h4 className="state-title">{title}</h4>
      <p className="state-desc">{message}</p>
      {onRetry && (
        <Button variant="outline" size="sm" onClick={onRetry} className="state-action">
          Retry Action
        </Button>
      )}
    </div>
  );
};
