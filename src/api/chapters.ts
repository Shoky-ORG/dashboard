import { apiClient } from './client';
import { ApiResponse, Chapter } from '@/types/api';

export interface CreateChapterParams {
  title: string;
  description?: string;
  order: number;
}

export interface UpdateChapterParams {
  title?: string;
  description?: string;
  order?: number;
}

export const chaptersApi = {
  getChapters: async (courseId: number): Promise<Chapter[]> => {
    try {
      const res = await apiClient.get<ApiResponse<any>>(`/courses/${courseId}/chapters`);
      const data = res.data?.data;
      if (Array.isArray(data)) return data;
      if (data && typeof data === 'object' && Array.isArray((data as any).chapters)) {
        return (data as any).chapters;
      }
      return [];
    } catch (e) {
      return [];
    }
  },

  getChapterById: async (courseId: number, id: number): Promise<Chapter> => {
    const res = await apiClient.get<ApiResponse<Chapter>>(`/courses/${courseId}/chapters/${id}`);
    return res.data.data;
  },

  createChapter: async (courseId: number, params: CreateChapterParams): Promise<Chapter> => {
    const res = await apiClient.post<ApiResponse<Chapter>>(`/courses/${courseId}/chapters`, params);
    return res.data.data;
  },

  updateChapter: async (courseId: number, id: number, params: UpdateChapterParams): Promise<Chapter> => {
    const res = await apiClient.patch<ApiResponse<Chapter>>(`/courses/${courseId}/chapters/${id}`, params);
    return res.data.data;
  },

  deleteChapter: async (courseId: number, id: number): Promise<void> => {
    await apiClient.delete(`/courses/${courseId}/chapters/${id}`);
  },
};
