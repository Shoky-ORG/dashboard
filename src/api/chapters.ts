import { apiClient } from './client';
import { ApiResponse, Chapter } from '@/types/api';

export interface CreateChapterParams {
  chapter_number: number;
  title_ar: string;
  title_en?: string;
  order_index?: number;
}

export interface UpdateChapterParams {
  chapter_number?: number;
  title_ar?: string;
  title_en?: string;
  order_index?: number;
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
    const payload = {
      chapter_number: Number(params.chapter_number) || 1,
      title_ar: params.title_ar || params.title_en || 'الفصل الدراسي',
      title_en: params.title_en || undefined,
      order_index: params.order_index !== undefined ? Number(params.order_index) : (Number(params.chapter_number) || 1) - 1,
    };
    const res = await apiClient.post<ApiResponse<Chapter>>(`/courses/${courseId}/chapters`, payload);
    return res.data.data;
  },

  updateChapter: async (courseId: number, id: number, params: UpdateChapterParams): Promise<Chapter> => {
    const payload: any = {};
    if (params.chapter_number !== undefined) payload.chapter_number = Number(params.chapter_number);
    if (params.title_ar) payload.title_ar = params.title_ar;
    if (params.title_en) payload.title_en = params.title_en;
    if (params.order_index !== undefined) payload.order_index = Number(params.order_index);

    const res = await apiClient.patch<ApiResponse<Chapter>>(`/courses/${courseId}/chapters/${id}`, payload);
    return res.data.data;
  },

  deleteChapter: async (courseId: number, id: number): Promise<void> => {
    await apiClient.delete(`/courses/${courseId}/chapters/${id}`);
  },
};
