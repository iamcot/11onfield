import { apiClient } from '@/lib/api-client';
import { storage } from '@/lib/storage';

export interface PlayerProfile {
  id: number;
  positions: string[];
  height: number;
  weight: number;
  preferredFoot: string;
  createdAt: string;
  updatedAt: string;
}

export interface UserProfile {
  id: number;
  phone: string;
  userid: string;
  fullName: string;
  email?: string;
  role: string;
  avatar?: string;
  dob?: string;
  gender?: 'MALE' | 'FEMALE' | 'OTHER';
  createdAt: string;
  address?: {
    id: number;
    province: {
      id: number;
      name: string;
    };
    address?: string;
    ward?: string;
  };
  // Player-specific fields (only present if role is PLAYER)
  positions?: string[];
  height?: number;
  weight?: number;
  preferredFoot?: string;
  level?: string;
  bio?: string;
  followersCount?: number;
  followingCount?: number;
}

export const userService = {
  async getPlayerProfile(): Promise<PlayerProfile> {
    const token = storage.getToken();

    if (!token) {
      throw new Error('No access token available');
    }

    return apiClient.get<PlayerProfile>('/users/me/player', {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
  },

  async getUserByUserid(userid: string): Promise<UserProfile> {
    const token = storage.getToken();

    // Include Authorization header only if token exists
    const headers: Record<string, string> = {};
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    return apiClient.get<UserProfile>(`/users/${userid}`, {
      headers,
    });
  },

  async updateProfile(data: any): Promise<void> {
    const token = storage.getToken();

    if (!token) {
      throw new Error('No access token available');
    }

    return apiClient.put<void>('/users/me', data, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
  },

  async uploadAvatar(file: File): Promise<{ avatarUrl: string }> {
    const token = storage.getToken();

    if (!token) {
      throw new Error('No access token available');
    }

    // Create FormData
    const formData = new FormData();
    formData.append('file', file);

    return apiClient.postMultipart<{ avatarUrl: string }>('/users/me/avatar', formData, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
  },
};
