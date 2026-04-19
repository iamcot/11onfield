import { apiClient } from "@/lib/api-client";
import { storage } from "@/lib/storage";
import { EventDetail, EventListItem } from "@/types/event";
import { UserListItem } from "@/types/user";
import { PaginatedResponse } from "@/types/api";

export const eventService = {
  async getEvents(
    page: number,
    size: number,
    filters?: {
      search?: string;
      status?: string;
      provinceId?: string;
      sortBy?: string;
      sortOrder?: string;
    }
  ): Promise<PaginatedResponse<EventListItem>> {
    const params = new URLSearchParams();
    params.append("page", page.toString());
    params.append("size", size.toString());

    if (filters?.search) params.append("search", filters.search);
    if (filters?.status) params.append("status", filters.status);
    if (filters?.provinceId) params.append("provinceId", filters.provinceId);
    if (filters?.sortBy) params.append("sortBy", filters.sortBy);
    if (filters?.sortOrder) params.append("sortOrder", filters.sortOrder);

    const token = storage.getToken();
    const headers: Record<string, string> = {};
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    const response = await apiClient.get<any>(`/events?${params.toString()}`, {
      headers,
    });

    // Transform Spring Boot Page response
    return {
      data: response.content || [],
      total: response.totalElements || 0,
      page: response.number || 0,
      pageSize: response.size || size,
      totalPages: response.totalPages || 0,
    };
  },

  async getEventById(id: number): Promise<EventDetail> {
    const token = storage.getToken();
    const headers: Record<string, string> = {};
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    const response = await apiClient.get<EventDetail>(`/events/${id}`, {
      headers,
    });

    return response;
  },

  async joinEvent(eventId: number): Promise<void> {
    const token = storage.getToken();
    if (!token) {
      throw new Error("Vui lòng đăng nhập để tham gia sự kiện");
    }

    await apiClient.post(`/events/${eventId}/join`, null, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
  },

  async leaveEvent(eventId: number): Promise<void> {
    const token = storage.getToken();
    if (!token) {
      throw new Error("No access token available");
    }

    await apiClient.delete(`/events/${eventId}/join`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
  },

  async isUserJoined(eventId: number): Promise<boolean> {
    const token = storage.getToken();
    if (!token) {
      return false;
    }

    try {
      const response = await apiClient.get<{ isJoined: boolean }>(
        `/events/${eventId}/is-joined`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      return response.isJoined;
    } catch (error) {
      return false;
    }
  },

  async getParticipants(eventId: number): Promise<UserListItem[]> {
    const token = storage.getToken();
    const headers: Record<string, string> = {};
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    const response = await apiClient.get<UserListItem[]>(
      `/events/${eventId}/participants`,
      {
        headers,
      }
    );

    return response;
  },

  async getUserJoinedEvents(
    userid: string,
    page: number,
    size: number
  ): Promise<PaginatedResponse<EventListItem>> {
    const params = new URLSearchParams();
    params.append("page", page.toString());
    params.append("size", size.toString());

    const token = storage.getToken();
    const headers: Record<string, string> = {};
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    const response = await apiClient.get<any>(
      `/events/user/${userid}/joined?${params.toString()}`,
      { headers }
    );

    // Transform Spring Boot Page response
    return {
      data: response.content || [],
      total: response.totalElements || 0,
      page: response.number || 0,
      pageSize: response.size || size,
      totalPages: response.totalPages || 0,
    };
  },
};
