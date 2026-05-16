import { FeedItem } from "@/types/feed";
import { apiClient } from "@/lib/api-client";
import { storage } from "@/lib/storage";

export const feedService = {
  async getUserFeeds(userid: string): Promise<FeedItem[]> {
    const token = storage.getToken();

    // Include Authorization header if token exists (for owner detection)
    const headers: Record<string, string> = {};
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    return await apiClient.get<FeedItem[]>(`/users/${userid}/feeds`, { headers });
  },
};
