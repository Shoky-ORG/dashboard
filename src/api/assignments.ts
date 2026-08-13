import { apiClient } from './client';
import { ApiResponse, Assignment, DeliveryMethod } from '@/types/api';
import { normalizeArrayResponse } from '@/utils/pagination';

export interface CreateAssignmentParams {
  title: string;
  description?: string;
  due_date: string;
  max_score: number;
  delivery_method: DeliveryMethod;
  external_link?: string;
  file?: File | null;
}

export interface UpdateAssignmentParams {
  title?: string;
  description?: string;
  due_date?: string;
  max_score?: number;
  delivery_method?: DeliveryMethod;
  external_link?: string;
  file?: File | null;
}

export const assignmentsApi = {
  getAssignments: async (courseId: number): Promise<Assignment[]> => {
    try {
      const res = await apiClient.get<ApiResponse<any>>(`/courses/${courseId}/assignments`);
      return normalizeArrayResponse<Assignment>(res.data?.data || res.data);
    } catch (e) {
      return [];
    }
  },

  getAssignmentById: async (courseId: number, id: number): Promise<Assignment> => {
    const res = await apiClient.get<ApiResponse<Assignment>>(`/courses/${courseId}/assignments/${id}`);
    return res.data.data;
  },

  createAssignment: async (courseId: number, params: CreateAssignmentParams): Promise<Assignment> => {
    const formData = new FormData();
    formData.append('title', params.title);
    if (params.description) formData.append('description', params.description);
    formData.append('due_date', params.due_date);
    formData.append('max_score', String(params.max_score));
    formData.append('delivery_method', params.delivery_method);
    if (params.external_link) formData.append('external_link', params.external_link);
    if (params.file) formData.append('file', params.file);

    const res = await apiClient.post<ApiResponse<Assignment>>(`/courses/${courseId}/assignments`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return res.data.data;
  },

  updateAssignment: async (courseId: number, id: number, params: UpdateAssignmentParams): Promise<Assignment> => {
    const formData = new FormData();
    if (params.title) formData.append('title', params.title);
    if (params.description !== undefined) formData.append('description', params.description);
    if (params.due_date) formData.append('due_date', params.due_date);
    if (params.max_score !== undefined) formData.append('max_score', String(params.max_score));
    if (params.delivery_method) formData.append('delivery_method', params.delivery_method);
    if (params.external_link !== undefined) formData.append('external_link', params.external_link);
    if (params.file) formData.append('file', params.file);

    const res = await apiClient.patch<ApiResponse<Assignment>>(`/courses/${courseId}/assignments/${id}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return res.data.data;
  },

  deleteAssignment: async (courseId: number, id: number): Promise<void> => {
    await apiClient.delete(`/courses/${courseId}/assignments/${id}`);
  },
};
