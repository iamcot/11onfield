import { EventListItem, getStatusBadgeColor, getStatusDisplayName } from "@/types/event";
import Image from "next/image";
import Link from "next/link";
import { format } from "date-fns";
import { vi } from "date-fns/locale";

interface EventCardProps {
  event: EventListItem;
  userName: string;
  showJoinButton?: boolean;
  onJoinClick?: () => void;
  isJoining?: boolean;
}

export default function EventCard({
  event,
  userName,
  showJoinButton = false,
  onJoinClick,
  isJoining = false,
}: EventCardProps) {
  const formatEventDate = () => {
    try {
      const startDate = new Date(event.startDate);
      const dateStr = format(startDate, "dd/MM/yyyy", { locale: vi });

      if (event.startTime) {
        return `${dateStr} lúc ${event.startTime}`;
      }
      return dateStr;
    } catch {
      return event.startDate;
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
      {/* Card Header */}
      <div className="px-4 py-3 bg-gray-50 border-b">
        <p className="text-sm text-gray-700">
          <span className="font-semibold">{userName}</span> đã tham gia sự kiện
        </p>
      </div>

      {/* Card Body */}
      <div className="p-4">
        <Link href={`/events/${event.id}`} className="block">
          <div className="flex gap-4">
            {/* Event Image */}
            {event.picture && (
              <div className="flex-shrink-0 w-32 h-24 relative rounded-lg overflow-hidden bg-gray-100">
                <Image
                  src={event.picture}
                  alt={event.title}
                  fill
                  className="object-cover"
                  sizes="128px"
                />
              </div>
            )}

            {/* Event Info */}
            <div className="flex-1 min-w-0">
              {/* Title and Status */}
              <div className="flex items-start justify-between gap-2 mb-2">
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
              <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                <svg
                  className="w-4 h-4"
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
                <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                  <svg
                    className="w-4 h-4"
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
                  <span className="truncate">
                    {event.location}
                    {event.provinceName && `, ${event.provinceName}`}
                  </span>
                </div>
              )}

              {/* Short Content */}
              {event.shortContent && (
                <p className="text-sm text-gray-600 line-clamp-2 mb-2">
                  {event.shortContent}
                </p>
              )}

              {/* Participants Count */}
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                  />
                </svg>
                <span>{event.participantCount} người tham gia</span>
              </div>
            </div>
          </div>
        </Link>

        {/* Join Button for Visitors */}
        {showJoinButton && event.status === "OPEN_REGISTER" && (
          <div className="mt-4 pt-4 border-t">
            <button
              onClick={(e) => {
                e.preventDefault();
                onJoinClick?.();
              }}
              disabled={isJoining}
              className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white font-medium py-2 px-4 rounded-lg transition-colors"
            >
              {isJoining ? "Đang tham gia..." : "Tham gia cùng"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
