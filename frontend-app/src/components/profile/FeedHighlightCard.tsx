"use client";

import { FeedItem } from "@/types/feed";

interface FeedHighlightCardProps {
  feed: FeedItem;
  isOwnProfile: boolean;
}

// Helper function to extract YouTube video ID
function getYouTubeVideoId(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/,
    /youtube\.com\/embed\/([^&\n?#]+)/,
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match && match[1]) {
      return match[1];
    }
  }
  return null;
}

// Helper function to extract Facebook video ID
function getFacebookVideoId(url: string): string | null {
  const match = url.match(/facebook\.com.*\/videos\/(\d+)/);
  return match ? match[1] : null;
}

export default function FeedHighlightCard({ feed, isOwnProfile }: FeedHighlightCardProps) {
  if (!feed.highlight) return null;

  const { highlight, fullName, date } = feed;
  const platform = highlight.platform?.toLowerCase();

  const formattedDate = new Date(date).toLocaleDateString("vi-VN", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const displayName = isOwnProfile ? "Bạn" : fullName;
  const isPending = highlight.approvalStatus === 'PENDING';

  // Get status badge based on approval status
  const getStatusBadge = () => {
    if (!isOwnProfile) return null; // Visitors don't see status

    if (highlight.approvalStatus === 'PENDING') {
      return (
        <span className="ml-2 text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
          Chờ duyệt
        </span>
      );
    }
    return null;
  };

  const renderContent = () => {
    // YouTube embed
    if (platform === "youtube") {
      const videoId = getYouTubeVideoId(highlight.url);
      if (videoId) {
        return (
          <div className="relative w-full" style={{ paddingBottom: "56.25%" }}>
            <iframe
              className="absolute top-0 left-0 w-full h-full rounded-md"
              src={`https://www.youtube.com/embed/${videoId}`}
              title={highlight.title || "YouTube video"}
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
        );
      }
    }

    // Facebook embed
    if (platform === "facebook") {
      const videoId = getFacebookVideoId(highlight.url);
      if (videoId) {
        return (
          <div className="relative w-full" style={{ paddingBottom: "56.25%" }}>
            <iframe
              className="absolute top-0 left-0 w-full h-full rounded-md"
              src={`https://www.facebook.com/plugins/video.php?href=${encodeURIComponent(highlight.url)}&show_text=false`}
              title={highlight.title || "Facebook video"}
              frameBorder="0"
              allowFullScreen
            />
          </div>
        );
      }
    }

    // Vimeo embed
    if (platform === "vimeo") {
      const match = highlight.url.match(/vimeo\.com\/(\d+)/);
      if (match && match[1]) {
        return (
          <div className="relative w-full" style={{ paddingBottom: "56.25%" }}>
            <iframe
              className="absolute top-0 left-0 w-full h-full rounded-md"
              src={`https://player.vimeo.com/video/${match[1]}`}
              title={highlight.title || "Vimeo video"}
              frameBorder="0"
              allow="autoplay; fullscreen; picture-in-picture"
              allowFullScreen
            />
          </div>
        );
      }
    }

    // Default: Show play button that opens in new tab
    return (
      <div className="bg-gray-100 rounded-md p-6 text-center">
        <a
          href={highlight.url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition"
        >
          <svg
            className="w-5 h-5"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z" />
          </svg>
          <span>Xem video</span>
        </a>
        {highlight.title && (
          <p className="mt-2 text-sm text-gray-600">{highlight.title}</p>
        )}
      </div>
    );
  };

  return (
    <div className={`bg-white rounded-lg shadow p-4 ${isPending && isOwnProfile ? 'opacity-50' : ''}`}>
      <div className="flex items-center gap-3 mb-3">
        <div className="flex-shrink-0 w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
          <svg
            className="w-6 h-6 text-red-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
            />
          </svg>
        </div>
        <div className="flex-1">
          <h4 className="text-sm font-medium text-gray-900">
            <span className="font-semibold">{displayName}</span> có một{" "}
            <span className="font-semibold">siêu phẩm</span> vào ngày{" "}
            <span className="font-semibold">{formattedDate}</span>
            {getStatusBadge()}
          </h4>
        </div>
      </div>
      <div className="mt-2">
        {renderContent()}
      </div>
    </div>
  );
}
