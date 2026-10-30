"use client";

import { FeedItem } from "@/types/feed";
import FeedAchievementCard from "./FeedAchievementCard";
import FeedHighlightCard from "./FeedHighlightCard";
import FeedEventCard from "./FeedEventCard";
import { useT } from "@/i18n/I18nProvider";

interface FeedListProps {
  feeds: FeedItem[];
  currentUserid?: string | null;
}

export default function FeedList({ feeds, currentUserid }: FeedListProps) {
  const t = useT();
  if (!feeds || feeds.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        {t("Chưa có hoạt động nào")}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {feeds.map((feed, index) => {
        const isOwnProfile = currentUserid === feed.userid;

        switch (feed.type) {
          case "achievement":
            return <FeedAchievementCard key={`achievement-${index}`} feed={feed} isOwnProfile={isOwnProfile} />;
          case "highlight":
            return <FeedHighlightCard key={`highlight-${index}`} feed={feed} isOwnProfile={isOwnProfile} />;
          case "event":
            return <FeedEventCard key={`event-${index}`} feed={feed} isOwnProfile={isOwnProfile} />;
          default:
            return null;
        }
      })}
    </div>
  );
}
