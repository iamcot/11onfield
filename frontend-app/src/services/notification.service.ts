import { apiClient } from "@/lib/api-client";
import { storage } from "@/lib/storage";

export interface Notification {
  id: number;
  scenarioKey: string;
  channel: string;
  title: string;
  message: string;
  data?: string;
  isRead: boolean;
  createdAt: string;
  readAt?: string;
}

export interface NotificationPage {
  content: Notification[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
}

export const notificationService = {
  async getNotifications(page: number = 0, size: number = 20): Promise<NotificationPage> {
    const token = storage.getToken();
    if (!token) throw new Error("No access token available");

    return apiClient.get(`/users/me/notifications?page=${page}&size=${size}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
  },

  async getRecentUnread(): Promise<Notification[]> {
    const token = storage.getToken();
    if (!token) throw new Error("No access token available");

    return apiClient.get("/users/me/notifications/recent-unread", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
  },

  async getUnreadCount(): Promise<{ count: number }> {
    const token = storage.getToken();
    if (!token) throw new Error("No access token available");

    return apiClient.get("/users/me/notifications/unread-count", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
  },

  async markAsRead(id: number): Promise<void> {
    const token = storage.getToken();
    if (!token) throw new Error("No access token available");

    return apiClient.put(`/users/me/notifications/${id}/read`, undefined, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
  },

  async markAllAsRead(): Promise<void> {
    const token = storage.getToken();
    if (!token) throw new Error("No access token available");

    return apiClient.put("/users/me/notifications/read-all", undefined, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
  },
};
