import { apiClient } from './client';
import { ApiResponse, CourseInstructor, InstructorRole } from '@/types/api';

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
      const data = res.data?.data;
      if (Array.isArray(data)) return data;
      if (data && typeof data === 'object' && Array.isArray((data as any).instructors)) {
        return (data as any).instructors;
      }
      return [];
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
