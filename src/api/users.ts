import { apiClient } from './client';
import { ApiResponse, User, PaginatedResponse, Department, RoleEnum } from '@/types/api';
import { normalizePaginatedResponse } from '@/utils/pagination';

export interface GetUsersQueryParams {
  page?: number;
  limit?: number;
  role?: RoleEnum;
  department?: Department;
  search?: string;
}

export interface UpdateUserParams {
  fullName?: string;
  email?: string;
  department?: Department;
  roleId?: number;
  isActive?: boolean;
}

export interface UpdateProfileParams {
  fullName?: string;
  avatar_url?: string;
}

export interface ChangePasswordParams {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export const usersApi = {
  getUsers: async (params?: GetUsersQueryParams): Promise<PaginatedResponse<User>> => {
    const res = await apiClient.get<ApiResponse<any>>('/users', { params });
    return normalizePaginatedResponse<User>(res.data.data, res.data.meta);
  },

  getProfile: async (): Promise<User> => {
    const res = await apiClient.get<ApiResponse<User>>('/users/profile');
    return res.data.data;
  },

  updateProfile: async (params: UpdateProfileParams): Promise<User> => {
    const res = await apiClient.patch<ApiResponse<User>>('/users/profile', params);
    return res.data.data;
  },

  changePassword: async (params: ChangePasswordParams): Promise<void> => {
    await apiClient.patch('/users/change-password', params);
  },

  getUserById: async (id: number): Promise<User> => {
    const res = await apiClient.get<ApiResponse<User>>(`/users/${id}`);
    return res.data.data;
  },

  updateUser: async (id: number, params: UpdateUserParams): Promise<User> => {
    const res = await apiClient.patch<ApiResponse<User>>(`/users/${id}`, params);
    return res.data.data;
  },

  deleteUser: async (id: number): Promise<void> => {
    await apiClient.delete(`/users/${id}`);
  },
};
