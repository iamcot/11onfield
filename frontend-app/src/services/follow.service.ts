import { apiClient } from "@/lib/api-client";
import { storage } from "@/lib/storage";
import { UserListItem } from "@/types/user";

export const followService = {
  async followUser(userid: string): Promise<void> {
    const token = storage.getToken();
    if (!token) {
      throw new Error("No access token available");
    }

    await apiClient.post(`/users/${userid}/follow`, null, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
  },

  async unfollowUser(userid: string): Promise<void> {
    const token = storage.getToken();
    if (!token) {
      throw new Error("No access token available");
    }

    await apiClient.delete(`/users/${userid}/follow`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
  },

  async isFollowing(userid: string): Promise<boolean> {
    const token = storage.getToken();
    if (!token) {
      throw new Error("No access token available");
    }

    const response = await apiClient.get<{ isFollowing: boolean }>(
      `/users/${userid}/is-following`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    return response.isFollowing;
  },

  async getFollowingPlayers(userid: string): Promise<UserListItem[]> {
    const token = storage.getToken();
    if (!token) {
      throw new Error("No access token available");
    }

    const response = await apiClient.get<UserListItem[]>(
      `/users/${userid}/following`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    return response;
  },

  async getFollowers(userid: string): Promise<UserListItem[]> {
    const token = storage.getToken();
    if (!token) {
      throw new Error("No access token available");
    }

    const response = await apiClient.get<UserListItem[]>(
      `/users/${userid}/followers`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    return response;
  },
};
