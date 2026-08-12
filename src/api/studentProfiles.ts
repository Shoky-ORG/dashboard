import { apiClient } from './client';
import { ApiResponse, StudentProfile, PaginatedResponse, Department, Track } from '@/types/api';
import { normalizePaginatedResponse } from '@/utils/pagination';

export interface GetStudentProfilesQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  department?: Department;
  track?: Track;
}

export const studentProfilesApi = {
  findAllStudentProfiles: async (params?: GetStudentProfilesQueryParams): Promise<PaginatedResponse<StudentProfile>> => {
    // Exact route path: /student-profiles/findAllStudentProfiles
    const res = await apiClient.get<ApiResponse<any>>('/student-profiles/findAllStudentProfiles', { params });
    return normalizePaginatedResponse<StudentProfile>(res.data.data, res.data.meta);
  },
};
