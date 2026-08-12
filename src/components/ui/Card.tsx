import React from 'react';
import clsx from 'clsx';
import './Card.css';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  className?: string;
  hoverable?: boolean;
}

export const Card: React.FC<CardProps> = ({ children, className, hoverable = false, ...props }) => {
  return (
    <div className={clsx('shoky-card', hoverable && 'card-hoverable', className)} {...props}>
      {children}
    </div>
  );
};

export const CardHeader: React.FC<{ title: React.ReactNode; subtitle?: React.ReactNode; action?: React.ReactNode; className?: string }> = ({
  title,
  subtitle,
  action,
  className,
}) => (
  <div className={clsx('card-header', className)}>
    <div>
      <h3 className="card-title">{title}</h3>
      {subtitle && <p className="card-subtitle">{subtitle}</p>}
    </div>
    {action && <div className="card-action">{action}</div>}
  </div>
);

export const CardBody: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className }) => (
  <div className={clsx('card-body', className)}>{children}</div>
);

export const CardFooter: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className }) => (
  <div className={clsx('card-footer', className)}>{children}</div>
);
