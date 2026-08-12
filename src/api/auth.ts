import { apiClient } from './client';
import { ApiResponse, User, Department } from '@/types/api';

export interface LoginParams {
  email: string;
  password: string;
}

export interface LoginResponseData {
  accessToken: string;
  refreshToken: string;
  user?: User;
}

export interface CreateStaffParams {
  fullName: string;
  email: string;
  department: Department;
}

export const authApi = {
  login: async (params: LoginParams): Promise<LoginResponseData> => {
    const res = await apiClient.post<ApiResponse<LoginResponseData>>('/auth/login', params);
    return res.data.data;
  },

  logout: async (refreshToken: string): Promise<void> => {
    await apiClient.post('/auth/logout', { refreshToken });
  },

  verifyEmailStaff: async (email: string): Promise<void> => {
    await apiClient.post('/auth/verify-email-staff', { email });
  },

  setPasswordStaff: async (sessionId: string, password: string, confirmPassword: string): Promise<void> => {
    await apiClient.post(`/auth/set-password-staff/${sessionId}`, { password, confirmPassword });
  },

  forgotPassword: async (email: string): Promise<void> => {
    await apiClient.post('/auth/forgot-password', { email });
  },

  resetPassword: async (sessionId: string, password: string, confirmPassword: string): Promise<void> => {
    await apiClient.post(`/auth/reset-password/${sessionId}`, { password, confirmPassword });
  },

  createAdmin: async (params: CreateStaffParams): Promise<User> => {
    const res = await apiClient.post<ApiResponse<User>>('/auth/create-admin', params);
    return res.data.data;
  },

  createDoctor: async (params: CreateStaffParams): Promise<User> => {
    const res = await apiClient.post<ApiResponse<User>>('/auth/create-doctor', params);
    return res.data.data;
  },

  createTa: async (params: CreateStaffParams): Promise<User> => {
    const res = await apiClient.post<ApiResponse<User>>('/auth/create-ta', params);
    return res.data.data;
  },
};
