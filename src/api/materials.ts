import { apiClient } from './client';
import { ApiResponse, Material, MaterialType } from '@/types/api';
import { normalizeArrayResponse } from '@/utils/pagination';

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
      return normalizeArrayResponse<Material>(res.data?.data || res.data);
    } catch (e) {
      return [];
    }
  },

  getMaterialById: async (courseId: number, chapterId: number, id: number): Promise<Material> => {
    const res = await apiClient.get<ApiResponse<Material>>(
      `/courses/${courseId}/chapters/${chapterId}/materials/${id}`
    );
    return res.data?.data || (res.data as any);
  },

  createMaterial: async (
    courseId: number,
    chapterId: number,
    params: CreateMaterialParams
  ): Promise<Material> => {
    const formData = new FormData();
    formData.append('title', params.title);
    formData.append('material_type', params.type); // Backend DTO requires material_type
    formData.append('type', params.type);

    if (params.description) {
      formData.append('description', params.description);
      formData.append('reference_title', params.description);
    }
    if (params.external_link) {
      formData.append('external_link', params.external_link);
      formData.append('reference_link', params.external_link);
    }
    formData.append('is_visible', 'true');

    if (params.file) {
      formData.append('file', params.file);
    }

    const res = await apiClient.post<ApiResponse<any>>(
      `/courses/${courseId}/chapters/${chapterId}/materials`,
      formData,
      {
        headers: { 'Content-Type': 'multipart/form-data' },
      }
    );
    return res.data?.data || (res.data as any);
  },

  updateMaterial: async (
    courseId: number,
    chapterId: number,
    id: number,
    params: UpdateMaterialParams
  ): Promise<Material> => {
    const payload: any = {};
    if (params.title) payload.title = params.title;
    if (params.type) {
      payload.material_type = params.type;
      payload.type = params.type;
    }
    if (params.description) {
      payload.description = params.description;
      payload.reference_title = params.description;
    }
    if (params.external_link) {
      payload.external_link = params.external_link;
      payload.reference_link = params.external_link;
    }

    const res = await apiClient.patch<ApiResponse<any>>(
      `/courses/${courseId}/chapters/${chapterId}/materials/${id}`,
      payload
    );
    return res.data?.data || (res.data as any);
  },

  deleteMaterial: async (courseId: number, chapterId: number, id: number): Promise<void> => {
    await apiClient.delete(`/courses/${courseId}/chapters/${chapterId}/materials/${id}`);
  },
};
