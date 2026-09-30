import { apiRequest } from "../api/client";

export interface Notification {
  id: string;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
}

const BASE = "/api/admin/notifications";

export const getNotifications = () => apiRequest<Notification[]>(BASE, { authenticated: true });
export const markNotificationRead = (id: string) => apiRequest<{ id: string; isRead: boolean }>(`${BASE}/${id}/read`, { method: "PATCH", authenticated: true });
export const markAllNotificationsRead = () => apiRequest<{ updated: number }>(`${BASE}/read-all`, { method: "PATCH", authenticated: true });
