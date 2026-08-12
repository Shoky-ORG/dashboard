import React from 'react';
import './States.css';

export const LoadingState: React.FC<{ message?: string }> = ({ message = 'Loading content...' }) => {
  return (
    <div className="state-container loading-state">
      <div className="shoky-spinner" />
      <span className="state-message">{message}</span>
    </div>
  );
};
