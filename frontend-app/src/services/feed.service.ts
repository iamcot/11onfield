import { FeedItem } from "@/types/feed";
import { apiClient } from "@/lib/api-client";

export const feedService = {
  async getUserFeeds(userid: string): Promise<FeedItem[]> {
    return await apiClient.get<FeedItem[]>(`/users/${userid}/feeds`);
  },
};
