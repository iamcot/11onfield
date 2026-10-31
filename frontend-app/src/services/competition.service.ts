import { apiClient } from "@/lib/api-client";
import { storage } from "@/lib/storage";

export interface CompetitionDetail {
  id: number;
  season: number;
  title: string;
  description: string;
  picture: string;
  status: string;
  currentPhase: string;
  registrationStartDate: string;
  registrationEndDate: string;
  competitionStartDate: string;
  competitionEndDate: string;
  participantCount: number;
  stages: Stage[];
}

export interface Stage {
  id: number;
  stageNumber: number;
  title: string;
  description: string;
  /** null while the date is not announced yet (UI shows "Đang cập nhật") */
  stageDate: string | null;
  stageTime: string;
  stageType: string;
  region: string | null;
  status: string;
  isPublicScoring: boolean;
}

/** Selected Top 30: sorted by position then name, no rank and no score on purpose. */
export interface Top30 {
  published: boolean;
  players: { userid: string; fullName: string; avatar: string | null; position: string | null }[];
}

export interface StageResult {
  id: number;
  stageId: number;
  stageTitle: string;
  stageNumber: number;
  userId: number;
  fullName: string;
  avatar: string;
  score: number;
  performanceNotes: string;
  videoUrl: string;
  isPublic: boolean;
}

export interface CompetitionNews {
  id: number;
  title: string;
  shortContent: string;
  content: string;
  thumbnail: string;
  authorName: string;
  authorByline: string;
  publishedAt: string;
  isFeatured: boolean;
}

export interface CompetitionSponsor {
  id: number;
  name: string;
  logoUrl: string;
  websiteUrl: string;
  displayOrder: number;
  adPosition: string;
  bannerImageUrl: string;
  isActive: boolean;
}

export interface ParticipantStatus {
  isRegistered: boolean;
  status?: string;
  selectedRegion?: string;
}

export const competitionService = {
  async getCurrentCompetition(): Promise<CompetitionDetail | null> {
    try {
      const response = await apiClient.get<CompetitionDetail>(
        "/competitions/current"
      );
      return response;
    } catch (error) {
      return null;
    }
  },

  async getCompetitionById(id: number): Promise<CompetitionDetail> {
    const response = await apiClient.get<CompetitionDetail>(
      `/competitions/${id}`
    );
    return response;
  },

  async checkRegistration(id: number): Promise<ParticipantStatus> {
    const token = storage.getToken();
    if (!token) {
      return { isRegistered: false };
    }

    try {
      const response = await apiClient.get<ParticipantStatus>(
        `/competitions/${id}/is-registered`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      return response;
    } catch (error) {
      return { isRegistered: false };
    }
  },

  async register(id: number): Promise<void> {
    const token = storage.getToken();
    if (!token) {
      throw new Error("Vui lòng đăng nhập để đăng ký");
    }

    await apiClient.post(`/competitions/${id}/register`, null, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
  },

  async withdraw(id: number): Promise<void> {
    const token = storage.getToken();
    if (!token) {
      throw new Error("No access token available");
    }

    await apiClient.delete(`/competitions/${id}/register`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
  },

  async getTop30(id: number): Promise<Top30> {
    return apiClient.get<Top30>(`/competitions/${id}/top30`);
  },

  async getMyResults(id: number): Promise<StageResult[]> {
    const token = storage.getToken();
    if (!token) {
      throw new Error("Vui lòng đăng nhập");
    }

    const response = await apiClient.get<StageResult[]>(
      `/competitions/${id}/my-results`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
    return response;
  },

  async getNews(id: number): Promise<CompetitionNews[]> {
    const response = await apiClient.get<CompetitionNews[]>(
      `/competitions/${id}/news`
    );
    return response;
  },

  async getSponsors(id: number): Promise<CompetitionSponsor[]> {
    const response = await apiClient.get<CompetitionSponsor[]>(
      `/competitions/${id}/sponsors`
    );
    return response;
  },
};
