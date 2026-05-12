export type FeedType = 'event' | 'achievement' | 'highlight';

export interface FeedEvent {
  eventId: number;
  title: string;
  description?: string;
  location?: string;
  startDate: string;
  startTime?: string;
  endDate?: string;
  endTime?: string;
  status: string;
  imageUrl?: string;
}

export interface FeedAchievement {
  id: number;
  title: string;
  description?: string;
  achievementType: 'INDIVIDUAL' | 'TEAM';
  achievementDate: string;
}

export interface FeedHighlight {
  id: number;
  url: string;
  platform?: string;
  title?: string;
  highlightDate: string;
}

export interface FeedItem {
  type: FeedType;
  date: string;
  createdAt: string;
  fullName: string;
  userid: string;
  event?: FeedEvent;
  achievement?: FeedAchievement;
  highlight?: FeedHighlight;
}
