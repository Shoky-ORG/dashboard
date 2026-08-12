import React from 'react';
import { useAuth } from '@/auth/AuthContext';
import { SuperAdminDashboard } from './SuperAdminDashboard';
import { AdminDashboard } from './AdminDashboard';
import { DoctorDashboard } from './DoctorDashboard';
import { TADashboard } from './TADashboard';

export const DashboardPage: React.FC = () => {
  const { user } = useAuth();

  if (!user) return null;

  switch (user.role.name) {
    case 'super_admin':
      return <SuperAdminDashboard />;
    case 'admin':
      return <AdminDashboard />;
    case 'doctor':
      return <DoctorDashboard />;
    case 'ta':
      return <TADashboard />;
    default:
      return (
        <div style={{ padding: '24px', color: '#9AA6C3' }}>
          Unrecognized staff role. Please contact system administrator.
        </div>
      );
  }
};
