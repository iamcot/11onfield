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
  const isPending = achievement.approvalStatus === 'PENDING';

  const verb = achievement.achievementType === "PARTICIPANT" ? "đã tham dự" : "đã đạt được";
  const getStatusBadge = () => {
    if (!isOwnProfile) return null; // Visitors don't see status

    if (achievement.approvalStatus === 'PENDING') {
      return (
        <span className="ml-2 text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
          Chờ duyệt
        </span>
      );
    }
    return null;
  };

  return (
    <div className={`bg-white rounded-lg shadow p-4 ${isPending && isOwnProfile ? 'opacity-50' : ''}`}>
      <div className="flex items-center gap-3">
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
              d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z"
            />
          </svg>
        </div>
        <div className="flex-1">
          <h4 className="text-sm font-medium text-gray-900">
            <span className="font-semibold">{displayName}</span> {verb}{" "}
            <span className="font-semibold">{achievement.title}</span> vào ngày{" "}
            <span className="font-semibold">{formattedDate}</span>
            {getStatusBadge()}
          </h4>
        </div>
      </div>
    </div>
  );
}
