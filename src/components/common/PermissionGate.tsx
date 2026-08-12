import React from 'react';
import { useAuth } from '@/auth/AuthContext';
import { can, PermissionAction, PermissionContext } from '@/auth/permissions';
import { RoleEnum } from '@/types/api';

interface PermissionGateProps {
  children: React.ReactNode;
  action?: PermissionAction;
  allowedRoles?: RoleEnum[];
  context?: Omit<PermissionContext, 'user'>;
  fallback?: React.ReactNode;
}

export const PermissionGate: React.FC<PermissionGateProps> = ({
  children,
  action,
  allowedRoles,
  context,
  fallback = null,
}) => {
  const { user } = useAuth();

  if (!user) return <>{fallback}</>;

  if (allowedRoles && !allowedRoles.includes(user.role.name)) {
    return <>{fallback}</>;
  }

  if (action && !can(action, { user, ...context })) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
};
