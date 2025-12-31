import api from '../utils/api';

export interface Notification {
  id: number;
  user_id: string;
  sender_id: string;
  type: string;
  target_id: string;
  is_read: boolean;
  created_at: string;
  content_preview?: string;
  content?: string;
  title?: string;
}

export const getNotifications = async () => {
  const response = await api.get<Notification[]>('/api/notification/');
  return response.data;
};

export const markAsRead = async (id: number) => {
  const response = await api.post(`/api/notification/read/${id}`);
  return response.data;
};

export const markAllAsRead = async () => {
  const response = await api.post('/api/notification/read_all');
  return response.data;
};
