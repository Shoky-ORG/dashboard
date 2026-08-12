import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from './AuthContext';
import { can, PermissionAction, PermissionContext } from './permissions';
import { RoleEnum } from '@/types/api';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: RoleEnum[];
  action?: PermissionAction;
  context?: PermissionContext;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  allowedRoles,
  action,
  context,
}) => {
  const { isAuthenticated, isLoading, user } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', backgroundColor: '#0B1020', color: '#9BE046' }}>
        <div style={{ fontSize: '18px', fontWeight: 600 }}>Loading Shoky LMS...</div>
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Check role restrictions if specified
  if (allowedRoles && !allowedRoles.includes(user.role.name)) {
    return <Navigate to="/dashboard" replace />;
  }

  // Check action permissions if specified
  if (action && !can(action, { user, ...context })) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
};
