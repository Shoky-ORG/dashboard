import { apiClient } from './client';
import { ApiResponse, Material, MaterialType } from '@/types/api';

export interface CreateMaterialParams {
  title: string;
  description?: string;
  type: MaterialType;
  external_link?: string;
  file?: File | null;
}

export interface UpdateMaterialParams {
  title?: string;
  description?: string;
  type?: MaterialType;
  external_link?: string;
}

export const materialsApi = {
  getMaterials: async (courseId: number, chapterId: number): Promise<Material[]> => {
    try {
      const res = await apiClient.get<ApiResponse<any>>(
        `/courses/${courseId}/chapters/${chapterId}/materials`
      );
      const data = res.data?.data;
      if (Array.isArray(data)) return data;
      if (data && typeof data === 'object' && Array.isArray((data as any).materials)) {
        return (data as any).materials;
      }
      return [];
    } catch (e) {
      return [];
    }
  },

  getMaterialById: async (courseId: number, chapterId: number, id: number): Promise<Material> => {
    const res = await apiClient.get<ApiResponse<Material>>(
      `/courses/${courseId}/chapters/${chapterId}/materials/${id}`
    );
    return res.data.data;
  },

  createMaterial: async (
    courseId: number,
    chapterId: number,
    params: CreateMaterialParams
  ): Promise<Material> => {
    const formData = new FormData();
    formData.append('title', params.title);
    if (params.description) formData.append('description', params.description);
    formData.append('type', params.type);
    if (params.external_link) formData.append('external_link', params.external_link);
    if (params.file) formData.append('file', params.file);

    const res = await apiClient.post<ApiResponse<Material>>(
      `/courses/${courseId}/chapters/${chapterId}/materials`,
      formData,
      {
        headers: { 'Content-Type': 'multipart/form-data' },
      }
    );
    return res.data.data;
  },

  updateMaterial: async (
    courseId: number,
    chapterId: number,
    id: number,
    params: UpdateMaterialParams
  ): Promise<Material> => {
    const res = await apiClient.patch<ApiResponse<Material>>(
      `/courses/${courseId}/chapters/${chapterId}/materials/${id}`,
      params
    );
    return res.data.data;
  },

  deleteMaterial: async (courseId: number, chapterId: number, id: number): Promise<void> => {
    await apiClient.delete(`/courses/${courseId}/chapters/${chapterId}/materials/${id}`);
  },
};
