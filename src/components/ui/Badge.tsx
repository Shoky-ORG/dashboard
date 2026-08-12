import React from 'react';
import clsx from 'clsx';
import { RoleEnum, Department } from '@/types/api';
import './Badge.css';

export interface BadgeProps {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'success' | 'warning' | 'danger' | 'info' | 'neutral';
  size?: 'sm' | 'md';
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  className,
}) => {
  return (
    <span className={clsx('shoky-badge', `badge-${variant}`, `badge-${size}`, className)}>
      {children}
    </span>
  );
};

export const RoleBadge: React.FC<{ role: RoleEnum; size?: 'sm' | 'md' }> = ({ role, size = 'md' }) => {
  const roleConfig: Record<RoleEnum, { label: string; variant: BadgeProps['variant'] }> = {
    super_admin: { label: 'Super Admin', variant: 'primary' },
    admin: { label: 'Admin', variant: 'secondary' },
    doctor: { label: 'Doctor', variant: 'info' },
    ta: { label: 'TA', variant: 'warning' },
    student: { label: 'Student', variant: 'neutral' },
  };

  const config = roleConfig[role] || { label: role, variant: 'neutral' };

  return <Badge variant={config.variant} size={size}>{config.label}</Badge>;
};

export const DepartmentBadge: React.FC<{ department?: Department; size?: 'sm' | 'md' }> = ({ department, size = 'md' }) => {
  if (!department) return null;

  const departmentLabels: Record<Department, string> = {
    engineering: 'Engineering',
    computer_science: 'Computer Science',
    business_administration: 'Business Admin',
  };

  return <Badge variant="neutral" size={size}>{departmentLabels[department] || department}</Badge>;
};
