import { apiClient } from './client';
import { ApiResponse, CourseInstructor, InstructorRole } from '@/types/api';
import { normalizeArrayResponse } from '@/utils/pagination';

export interface AssignInstructorParams {
  userId: number;
  role: InstructorRole;
}

export interface UpdateInstructorParams {
  role: InstructorRole;
}

export const instructorsApi = {
  getInstructors: async (courseId: number): Promise<CourseInstructor[]> => {
    try {
      const res = await apiClient.get<ApiResponse<any>>(`/courses/${courseId}/instructors`);
      return normalizeArrayResponse<CourseInstructor>(res.data?.data || res.data);
    } catch (e) {
      return [];
    }
  },

  assignInstructor: async (courseId: number, params: AssignInstructorParams): Promise<CourseInstructor> => {
    const res = await apiClient.post<ApiResponse<CourseInstructor>>(`/courses/${courseId}/instructors`, params);
    return res.data.data;
  },

  updateInstructor: async (courseId: number, userId: number, params: UpdateInstructorParams): Promise<CourseInstructor> => {
    const res = await apiClient.patch<ApiResponse<CourseInstructor>>(`/courses/${courseId}/instructors/${userId}`, params);
    return res.data.data;
  },

  removeInstructor: async (courseId: number, userId: number): Promise<void> => {
    await apiClient.delete(`/courses/${courseId}/instructors/${userId}`);
  },
};
