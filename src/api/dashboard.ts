import { apiClient } from './client';
import { ApiResponse, DashboardSuperAdmin, DashboardAdmin, DashboardDoctor } from '@/types/api';

export const dashboardApi = {
  getSuperAdminDashboard: async (): Promise<DashboardSuperAdmin> => {
    const res = await apiClient.get<ApiResponse<DashboardSuperAdmin>>('/dashboard/super-admin');
    return res.data.data;
  },

  getAdminDashboard: async (): Promise<DashboardAdmin> => {
    const res = await apiClient.get<ApiResponse<DashboardAdmin>>('/dashboard/admin');
    return res.data.data;
  },

  getDoctorDashboard: async (): Promise<DashboardDoctor> => {
    const res = await apiClient.get<ApiResponse<DashboardDoctor>>('/dashboard/doctor');
    return res.data.data;
  },
};
