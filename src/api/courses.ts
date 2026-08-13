import { apiClient } from './client';
import { ApiResponse, Course, PaginatedResponse, Department } from '@/types/api';
import { normalizePaginatedResponse } from '@/utils/pagination';

export interface GetCoursesQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  department?: Department;
}

export interface CreateCourseParams {
  code: string;
  title_ar: string;
  title_en?: string;
  department: Department;
  credit_hours: number;
  academic_year: number;
  semester: number;
  description?: string;
  is_active?: boolean;
}

export interface UpdateCourseParams {
  code?: string;
  title_ar?: string;
  title_en?: string;
  department?: Department;
  credit_hours?: number;
  academic_year?: number;
  semester?: number;
  description?: string;
  is_active?: boolean;
}

export const coursesApi = {
  getCourses: async (params?: GetCoursesQueryParams): Promise<PaginatedResponse<Course>> => {
    const res = await apiClient.get<ApiResponse<any>>('/courses', { params });
    return normalizePaginatedResponse<Course>(res.data.data, res.data.meta);
  },

  getCourseById: async (id: number): Promise<Course> => {
    const res = await apiClient.get<ApiResponse<Course>>(`/courses/${id}`);
    return res.data.data;
  },

  createCourse: async (params: CreateCourseParams): Promise<Course> => {
    const res = await apiClient.post<ApiResponse<Course>>('/courses', params);
    return res.data.data;
  },

  updateCourse: async (id: number, params: UpdateCourseParams): Promise<Course> => {
    const res = await apiClient.patch<ApiResponse<Course>>(`/courses/${id}`, params);
    return res.data.data;
  },

  deleteCourse: async (id: number): Promise<void> => {
    await apiClient.delete(`/courses/${id}`);
  },
};
