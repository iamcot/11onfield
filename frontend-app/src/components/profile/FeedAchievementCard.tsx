"use client";

import { FeedItem } from "@/types/feed";

interface FeedAchievementCardProps {
  feed: FeedItem;
  isOwnProfile: boolean;
}

export default function FeedAchievementCard({ feed, isOwnProfile }: FeedAchievementCardProps) {
  if (!feed.achievement) return null;

  const { achievement, fullName, date } = feed;

  const formattedDate = new Date(date).toLocaleDateString("vi-VN", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const displayName = isOwnProfile ? "Bạn" : fullName;

  return (
    <div className="bg-white rounded-lg shadow p-4">
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 w-10 h-10 bg-yellow-100 rounded-full flex items-center justify-center">
          <svg
            className="w-6 h-6 text-yellow-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"
            />
          </svg>
        </div>
        <div className="flex-1">
          <h4 className="text-sm font-medium text-gray-900">
            <span className="font-semibold">{displayName}</span> đã đạt được{" "}
            <span className="font-semibold">{achievement.title}</span> vào ngày{" "}
            <span className="font-semibold">{formattedDate}</span>
          </h4>
        </div>
      </div>
    </div>
  );
}
