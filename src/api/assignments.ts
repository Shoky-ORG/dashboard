import { apiClient } from './client';
import { ApiResponse, Assignment, DeliveryMethod } from '@/types/api';
import { normalizeArrayResponse } from '@/utils/pagination';

export interface CreateAssignmentParams {
  title: string;
  description?: string;
  due_date?: string;
  max_score?: number;
  max_grade?: number;
  delivery_method: DeliveryMethod;
  external_link?: string;
  external_form_link?: string;
  file?: File | null;
}

export interface UpdateAssignmentParams {
  title?: string;
  description?: string;
  due_date?: string;
  max_score?: number;
  max_grade?: number;
  delivery_method?: DeliveryMethod;
  external_link?: string;
  external_form_link?: string;
  file?: File | null;
}

export const assignmentsApi = {
  getAssignments: async (courseId: number): Promise<Assignment[]> => {
    try {
      const res = await apiClient.get<ApiResponse<any>>(
        `/assignments/courses/${courseId}`,
        { params: { page: 1, limit: 50 } }
      );
      return normalizeArrayResponse<Assignment>(res.data?.data || res.data);
    } catch (e) {
      return [];
    }
  },

  getAssignmentById: async (courseId: number, id: number): Promise<Assignment> => {
    const res = await apiClient.get<ApiResponse<Assignment>>(
      `/assignments/courses/${courseId}/${id}`
    );
    return res.data?.data || (res.data as any);
  },

  createAssignment: async (
    courseId: number,
    params: CreateAssignmentParams
  ): Promise<Assignment> => {
    const formData = new FormData();
    formData.append('title', params.title);
    if (params.description) formData.append('description', params.description);
    if (params.due_date) formData.append('due_date', params.due_date);

    const maxGrade = params.max_grade ?? params.max_score ?? 100;
    formData.append('max_grade', String(maxGrade));

    formData.append('delivery_method', params.delivery_method);

    const link = params.external_form_link || params.external_link;
    if (link) {
      formData.append('external_form_link', link);
    }

    if (params.file) {
      formData.append('file', params.file);
    }

    const res = await apiClient.post<ApiResponse<Assignment>>(
      `/assignments/courses/${courseId}/`,
      formData,
      {
        headers: { 'Content-Type': 'multipart/form-data' },
      }
    );
    return res.data?.data || (res.data as any);
  },

  updateAssignment: async (
    courseId: number,
    id: number,
    params: UpdateAssignmentParams
  ): Promise<Assignment> => {
    const formData = new FormData();
    if (params.title) formData.append('title', params.title);
    if (params.description !== undefined) formData.append('description', params.description);
    if (params.due_date) formData.append('due_date', params.due_date);

    const maxGrade = params.max_grade ?? params.max_score;
    if (maxGrade !== undefined) {
      formData.append('max_grade', String(maxGrade));
    }

    if (params.delivery_method) formData.append('delivery_method', params.delivery_method);

    const link = params.external_form_link || params.external_link;
    if (link !== undefined) {
      formData.append('external_form_link', link);
    }

    if (params.file) {
      formData.append('file', params.file);
    }

    const res = await apiClient.patch<ApiResponse<Assignment>>(
      `/assignments/courses/${courseId}/${id}`,
      formData,
      {
        headers: { 'Content-Type': 'multipart/form-data' },
      }
    );
    return res.data?.data || (res.data as any);
  },

  deleteAssignment: async (courseId: number, id: number): Promise<void> => {
    await apiClient.delete(`/assignments/courses/${courseId}/${id}`);
  },
};
