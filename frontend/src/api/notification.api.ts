import api from './axios';
import { ApiResponse } from '../types';

interface NotificationItem {
  id: string;
  title: string;
  message: string;
  type: string;
  isRead: boolean;
  link?: string;
  createdAt: string;
}

interface NotificationResponse {
  data: NotificationItem[];
  total: number;
  unreadCount: number;
  page: number;
  limit: number;
  totalPages: number;
}

export const getNotifications = async (
  page = 1,
  limit = 20
): Promise<ApiResponse<NotificationResponse>> => {
  const response = await api.get<ApiResponse<NotificationResponse>>(
    `/notifications?page=${page}&limit=${limit}`
  );
  return response.data;
};

export const markAsRead = async (
  id: string
): Promise<ApiResponse<null>> => {
  const response = await api.put<ApiResponse<null>>(`/notifications/${id}/read`);
  return response.data;
};

export const markAllAsRead = async (): Promise<ApiResponse<null>> => {
  const response = await api.put<ApiResponse<null>>('/notifications/read-all');
  return response.data;
};
