import { apiClient } from './client';
import { ApiResponse, NotificationType, NotificationTargetType } from '@/types/api';

export interface SendNotificationParams {
  title: string;
  message: string;
  type: NotificationType;
  target_type: NotificationTargetType;
  course_id?: number;
  studentNumbers?: string[]; // mapped to user_ids for backend
}

export const notificationsApi = {
  sendNotification: async (params: SendNotificationParams): Promise<void> => {
    const payload = {
      title: params.title,
      message: params.message,
      type: params.type,
      target_type: params.target_type,
      course_id: params.course_id,
      user_ids: params.studentNumbers, // maps student numbers array
    };
    await apiClient.post('/notifications', payload);
  },

  markRead: async (id: number): Promise<void> => {
    await apiClient.patch(`/notifications/${id}/read`);
  },

  markAllRead: async (): Promise<void> => {
    await apiClient.patch('/notifications/read-all');
  },
};
