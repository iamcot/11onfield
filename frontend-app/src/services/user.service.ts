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

export interface PlayerAttribute {
  attributeKey: string;
  attributeName: string;
  attributeValue: number | null;
  attributeGroup?: string;
  isHexagon?: boolean;
  isGoalKeeper?: boolean;
}

export type ApprovalStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export interface Achievement {
  id: number;
  title: string;
  description?: string;
  date?: string;
  approvalStatus?: ApprovalStatus;
  /** Only sent to the owner. */
  hidden?: boolean | null;
}

export interface Highlight {
  id: number;
  url: string;
  platform?: string;
  title?: string;
  date?: string;
  approvalStatus?: ApprovalStatus;
  /** LINK = external link, VIDEO = uploaded to Bunny Stream. */
  kind?: 'LINK' | 'VIDEO';
  posterUrl?: string | null;
  embedUrl?: string | null;
  /** Only sent to the owner. */
  hidden?: boolean | null;
}

export interface Social {
  id: number;
  url: string;
  platform?: string;
}

export type VisibilityLevel = 'HIDDEN' | 'PRIVATE' | 'PUBLIC';

/** One block of the Scouting Combine card; a block the viewer may not see is not in the JSON. */
export interface CombineData {
  stageTitle?: string;
  source?: string;
  hex?: { key: string; value: number }[];
  total?: number;
  totalMax?: number;
  grade?: string;
  groups?: { key: string; label: string; score: number; max: number }[];
  tests?: { key: string; name: string; value: string; level: number; vsAverage?: number }[];
  /** data groups the viewer sees only because it is their own profile */
  ownerOnly?: string[];
}

export interface VisibilitySetting {
  dataGroup: string;
  adminMax: VisibilityLevel;
  ownerCanHide: boolean;
  mine: VisibilityLevel | null;
  level: VisibilityLevel;
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
  secondaryPosition?: string;
  yearsOfExperience?: number;
  height?: number;
  weight?: number;
  preferredFoot?: string;
  level?: string;
  bio?: string;
  attributes?: PlayerAttribute[];
  /** FIT EXP SKL PRF ACH HLT computed from the profile. */
  profileStats?: PlayerAttribute[];
  /** Full-body photo with the background removed. */
  fullBodyPhoto?: string | null;
  followersCount?: number;
  followingCount?: number;
  verified?: boolean;
  combine?: CombineData;
  /** only sent to the owner */
  visibility?: VisibilitySetting[];

  // New extended player fields
  personalId?: string;
  residentialAddress?: string;
  school?: string;
  academy?: string;
  club?: string;

  // New collections
  individualAchievements?: Achievement[];
  teamAchievements?: Achievement[];
  participantAchievements?: Achievement[];
  highlights?: Highlight[];
  socials?: Social[];
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

  async setVisibility(dataGroup: string, level: VisibilityLevel): Promise<void> {
    const token = storage.getToken();
    if (!token) throw new Error('No access token available');
    await apiClient.put('/users/me/visibility', { dataGroup, level }, { headers: { Authorization: `Bearer ${token}` } });
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

  async uploadAvatar(file: File, removeBackground: boolean = false): Promise<{ avatarUrl: string }> {
    const token = storage.getToken();

    if (!token) {
      throw new Error('No access token available');
    }

    // Create FormData
    const formData = new FormData();
    formData.append('file', file);
    formData.append('removeBackground', removeBackground.toString());

    return apiClient.postMultipart<{ avatarUrl: string }>('/users/me/avatar', formData, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
  },

  async updateAvatar(file: File): Promise<void> {
    const token = storage.getToken();

    if (!token) {
      throw new Error('No access token available');
    }

    // Create FormData
    const formData = new FormData();
    formData.append('file', file); // Backend expects 'file' not 'avatar'

    return apiClient.postMultipart<void>('/users/me/avatar', formData, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
  },

  async getProvinces(): Promise<Array<{ id: number; name: string }>> {
    // This can be called without authentication
    return apiClient.get<Array<{ id: number; name: string }>>('/provinces');
  },
};
