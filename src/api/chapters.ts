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
      if (!res || !res.data) return [];
      if (Array.isArray(res.data)) return res.data;

      const data = res.data.data;
      if (Array.isArray(data)) return data;
      if (data && typeof data === 'object') {
        if (Array.isArray(data.chapters)) return data.chapters;
        if (Array.isArray(data.items)) return data.items;
        if (Array.isArray(data.data)) return data.data;
      }
      if (Array.isArray((res.data as any).chapters)) return (res.data as any).chapters;
      if (Array.isArray((res.data as any).items)) return (res.data as any).items;
      return [];
    } catch (e) {
      console.warn(`Failed to fetch chapters for course ${courseId}:`, e);
      return [];
    }
  },

  getChapterById: async (courseId: number, id: number): Promise<Chapter> => {
    const res = await apiClient.get<ApiResponse<Chapter>>(`/courses/${courseId}/chapters/${id}`);
    return res.data?.data || (res.data as any);
  },

  createChapter: async (courseId: number, params: CreateChapterParams): Promise<Chapter> => {
    const payload = {
      chapter_number: Number(params.chapter_number) || 1,
      title_ar: params.title_ar || params.title_en || 'الفصل الدراسي',
      title_en: params.title_en || undefined,
      order_index: params.order_index !== undefined ? Number(params.order_index) : (Number(params.chapter_number) || 1) - 1,
    };
    const res = await apiClient.post<ApiResponse<any>>(`/courses/${courseId}/chapters`, payload);
    return res.data?.data || (res.data as any);
  },

  updateChapter: async (courseId: number, id: number, params: UpdateChapterParams): Promise<Chapter> => {
    const payload: any = {};
    if (params.chapter_number !== undefined) payload.chapter_number = Number(params.chapter_number);
    if (params.title_ar) payload.title_ar = params.title_ar;
    if (params.title_en) payload.title_en = params.title_en;
    if (params.order_index !== undefined) payload.order_index = Number(params.order_index);

    const res = await apiClient.patch<ApiResponse<any>>(`/courses/${courseId}/chapters/${id}`, payload);
    return res.data?.data || (res.data as any);
  },

  deleteChapter: async (courseId: number, id: number): Promise<void> => {
    await apiClient.delete(`/courses/${courseId}/chapters/${id}`);
  },
};
