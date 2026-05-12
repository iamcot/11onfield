"use client";

import { FeedItem } from "@/types/feed";
import Link from "next/link";

interface FeedEventCardProps {
  feed: FeedItem;
  isOwnProfile: boolean;
}

export default function FeedEventCard({ feed, isOwnProfile }: FeedEventCardProps) {
  if (!feed.event) return null;

  const { event, fullName } = feed;

  const formatEventDate = () => {
    try {
      const startDate = new Date(event.startDate);
      const dateStr = startDate.toLocaleDateString("vi-VN", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });

      if (event.startTime) {
        return `${dateStr} lúc ${event.startTime}`;
      }
      return dateStr;
    } catch {
      return event.startDate;
    }
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case "UPCOMING":
        return "bg-blue-500";
      case "ONGOING":
        return "bg-green-500";
      case "COMPLETED":
        return "bg-gray-500";
      case "CANCELLED":
        return "bg-red-500";
      default:
        return "bg-gray-500";
    }
  };

  const getStatusDisplayName = (status: string) => {
    switch (status) {
      case "UPCOMING":
        return "Sắp diễn ra";
      case "ONGOING":
        return "Đang diễn ra";
      case "COMPLETED":
        return "Đã kết thúc";
      case "CANCELLED":
        return "Đã hủy";
      default:
        return status;
    }
  };

  const displayName = isOwnProfile ? "Bạn" : fullName;

  return (
    <div className="bg-white rounded-lg shadow p-4">
      {/* Card Header */}
      <div className="flex items-center gap-3 mb-3">
        <div className="flex-shrink-0 w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
          <svg
            className="w-6 h-6 text-blue-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
            />
          </svg>
        </div>
        <div className="flex-1">
          <h4 className="text-sm font-medium text-gray-900">
            <span className="font-semibold">{displayName}</span> đã tham gia{" "}
            <span className="font-semibold">sự kiện</span>
          </h4>
        </div>
      </div>

      {/* Card Body */}
      <div>
        <Link href={`/events/${event.eventId}`} className="block hover:opacity-80 transition">
          <div className="flex flex-col gap-3">
            {/* Event Image */}
            {event.imageUrl && (
              <div className="w-full h-48 bg-gray-200 rounded-md overflow-hidden">
                <img
                  src={event.imageUrl}
                  alt={event.title}
                  className="w-full h-full object-cover"
                />
              </div>
            )}

            {/* Title and Status */}
            <div className="flex items-start justify-between gap-2">
              <h3 className="text-lg font-semibold text-gray-900 hover:text-blue-600 transition-colors line-clamp-2">
                {event.title}
              </h3>
              <span
                className={`flex-shrink-0 px-2 py-1 text-xs font-medium text-white rounded ${getStatusBadgeColor(event.status)}`}
              >
                {getStatusDisplayName(event.status)}
              </span>
            </div>

            {/* Date */}
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <svg
                className="w-4 h-4 flex-shrink-0"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
              <span>{formatEventDate()}</span>
            </div>

            {/* Location */}
            {event.location && (
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <svg
                  className="w-4 h-4 flex-shrink-0"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                </svg>
                <span className="line-clamp-1">{event.location}</span>
              </div>
            )}

            {/* Description */}
            {event.description && (
              <p className="text-sm text-gray-600 line-clamp-2">
                {event.description}
              </p>
            )}
          </div>
        </Link>
      </div>
    </div>
  );
}
