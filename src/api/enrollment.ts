import { apiClient } from './client';
import { ApiResponse, StudentProfile, PaginatedResponse } from '@/types/api';
import { normalizePaginatedResponse } from '@/utils/pagination';

export interface GetCourseStudentsQueryParams {
  page?: number;
  limit?: number;
}

export const enrollmentApi = {
  getCourseStudents: async (courseId: number, params?: GetCourseStudentsQueryParams): Promise<PaginatedResponse<StudentProfile>> => {
    // Note singular path /course/:id/students as documented in API audit report
    const res = await apiClient.get<ApiResponse<any>>(`/course/${courseId}/students`, { params });
    return normalizePaginatedResponse<StudentProfile>(res.data.data, res.data.meta);
  },
};
