import React from 'react';
import { FolderOpen } from 'lucide-react';
import { Button } from './Button';
import './States.css';

export interface EmptyStateProps {
  title?: string;
  message?: string;
  icon?: React.ReactNode;
  actionLabel?: string;
  onAction?: () => void;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title = 'No Data Found',
  message = 'There are no records to display at this time.',
  icon = <FolderOpen size={40} />,
  actionLabel,
  onAction,
}) => {
  return (
    <div className="state-container empty-state">
      <div className="state-icon">{icon}</div>
      <h4 className="state-title">{title}</h4>
      <p className="state-desc">{message}</p>
      {actionLabel && onAction && (
        <Button variant="primary" size="sm" onClick={onAction} className="state-action">
          {actionLabel}
        </Button>
      )}
    </div>
  );
};
