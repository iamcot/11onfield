"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { eventService } from "@/services/event.service";
import { EventDetail, getStatusDisplayName, getStatusBadgeColor } from "@/types/event";
import Sidebar from "@/components/layout/Sidebar";
import MobileNav from "@/components/layout/MobileNav";

export default function EventDetailPage() {
  const { isAuthenticated, isLoading: authLoading, logout } = useAuth();
  const router = useRouter();
  const params = useParams();
  const eventId = parseInt(params.eventid as string);

  const [event, setEvent] = useState<EventDetail | null>(null);
  const [isJoined, setIsJoined] = useState(false);
  const [joinLoading, setJoinLoading] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const handleLogout = () => {
    logout();
    router.push("/auth/login");
  };

  // Fetch event detail
  useEffect(() => {
    const fetchEvent = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const eventData = await eventService.getEventById(eventId);
        setEvent(eventData);

        // Check if user joined (only if authenticated)
        if (isAuthenticated) {
          const joined = await eventService.isUserJoined(eventId);
          setIsJoined(joined);
        }
      } catch (err: any) {
        console.error("Error fetching event:", err);
        setError(err.message || "Không thể tải thông tin sự kiện");
      } finally {
        setIsLoading(false);
      }
    };

    if (!authLoading) {
      fetchEvent();
    }
  }, [eventId, isAuthenticated, authLoading]);

  const handleJoinToggle = async () => {
    if (!isAuthenticated) {
      router.push("/auth/login");
      return;
    }

    if (joinLoading) return;

    // Confirmation for leaving
    if (isJoined) {
      if (!confirm("Bạn có chắc chắn muốn rời khỏi sự kiện này?")) {
        return;
      }
    }

    setJoinLoading(true);
    try {
      if (isJoined) {
        await eventService.leaveEvent(eventId);
        setIsJoined(false);
        // Update participant count
        if (event) {
          setEvent({
            ...event,
            participantCount: Math.max(0, event.participantCount - 1),
          });
        }
      } else {
        await eventService.joinEvent(eventId);
        setIsJoined(true);
        // Update participant count
        if (event) {
          setEvent({
            ...event,
            participantCount: event.participantCount + 1,
          });
        }
      }
    } catch (err: any) {
      console.error("Failed to toggle join:", err);
      alert(err.message || "Có lỗi xảy ra. Vui lòng thử lại.");
    } finally {
      setJoinLoading(false);
    }
  };

  const formatDate = (dateStr: string, timeStr: string | null) => {
    const date = new Date(dateStr);
    const dateFormatted = date.toLocaleDateString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
    if (timeStr) {
      return `${dateFormatted} lúc ${timeStr}`;
    }
    return dateFormatted;
  };

  const formatEventTime = () => {
    if (!event) return "";

    const startDate = new Date(event.startDate);
    const endDate = new Date(event.endDate);

    const startDateStr = startDate.toLocaleDateString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
    const endDateStr = endDate.toLocaleDateString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });

    // Same date
    if (startDateStr === endDateStr) {
      if (event.startTime && event.endTime) {
        // Same day with time
        return `${startDateStr}, ${event.startTime} - ${event.endTime}`;
      } else {
        // Same day without time
        return startDateStr;
      }
    } else {
      // Different dates
      if (event.startTime && event.endTime) {
        return `${startDateStr} ${event.startTime} - ${endDateStr} ${event.endTime}`;
      } else {
        return `${startDateStr} - ${endDateStr}`;
      }
    }
  };

  const getRegistrationDeadlineText = () => {
    if (!event) return "";

    if (event.status === "OPEN_REGISTER") {
      const today = new Date();
      const endDate = new Date(event.endDate);
      const daysLeft = Math.ceil(
        (endDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
      );

      if (daysLeft > 0) {
        return `Còn ${daysLeft} ngày để đăng ký`;
      } else {
        return "Hết hạn đăng ký";
      }
    } else if (event.status === "CLOSE_REGISTER") {
      return "Đã đóng đăng ký";
    } else if (event.status === "COMPLETE") {
      return "Sự kiện đã kết thúc";
    } else if (event.status === "CANCELLED") {
      return "Sự kiện đã hủy";
    } else {
      return "Đang lên kế hoạch";
    }
  };

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Đang tải...</p>
      </div>
    );
  }

  if (error || !event) {
    return (
      <div className="min-h-screen bg-gray-50 flex">
        <Sidebar onLogout={handleLogout} />
        <main className="flex-1 p-4 md:p-8 mb-16 md:mb-0">
          <div className="max-w-4xl mx-auto">
            <div className="bg-white rounded-lg shadow p-8 text-center">
              <p className="text-red-600">{error || "Không tìm thấy sự kiện"}</p>
              <button
                onClick={() => router.push("/events")}
                className="mt-4 px-4 py-2 btn-primary text-white rounded-md transition"
              >
                Quay lại danh sách
              </button>
            </div>
          </div>
        </main>
        <MobileNav backgroundImage="/images/ground.jpg" />
      </div>
    );
  }

  const canJoin = event.status === "OPEN_REGISTER" && isAuthenticated;

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <Sidebar onLogout={handleLogout} />

      <main className="flex-1 p-4 md:p-8 mb-16 md:mb-0">
        <div className="max-w-4xl mx-auto">
          {/* Back Button */}
          <button
            onClick={() => router.push("/events")}
            className="mb-4 text-green-600 hover:text-green-700 flex items-center gap-2"
          >
            ← Quay lại danh sách
          </button>

          {/* Event Image */}
          {event.picture && (
            <div className="mb-6 rounded-lg overflow-hidden shadow-lg">
              <img
                src={event.picture}
                alt={event.title}
                className="w-full h-64 md:h-96 object-cover"
              />
            </div>
          )}

          {/* Event Info Card */}
          <div className="bg-white rounded-lg shadow-lg p-6 md:p-8">
            {/* Title and Status */}
            <div className="flex flex-col md:flex-row md:flex-wrap md:items-start md:justify-between gap-4 mb-4">
              <h1 className="text-xl md:text-3xl font-bold text-gray-800 md:flex-1">{event.title}</h1>
              <span
                className={`px-3 py-1 text-sm font-semibold rounded-full text-white self-start ${getStatusBadgeColor(
                  event.status
                )}`}
              >
                {getStatusDisplayName(event.status)}
              </span>
            </div>

            {/* Short Description */}
            {event.shortContent && (
              <p className="text-lg text-gray-600 mb-6">{event.shortContent}</p>
            )}

            {/* Event Details Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              {/* Event Time */}
              <div>
                <h3 className="text-sm font-semibold text-gray-500 mb-1">Thời gian</h3>
                <p className="text-gray-800">{formatEventTime()}</p>
              </div>

              {/* Location */}
              {event.location && (
                <div>
                  <h3 className="text-sm font-semibold text-gray-500 mb-1">Địa điểm</h3>
                  <p className="text-gray-800">{event.location}</p>
                  {event.provinceName && (
                    <p className="text-sm text-gray-500">{event.provinceName}</p>
                  )}
                </div>
              )}

              {/* Participants */}
              <div>
                <h3 className="text-sm font-semibold text-gray-500 mb-1">Người tham gia</h3>
                <p className="text-gray-800">{event.participantCount} người</p>
              </div>
            </div>

            {/* Registration Deadline */}
            <div className="bg-blue-50 border-l-4 border-blue-500 p-4 mb-6">
              <p className="text-blue-800 font-medium">{getRegistrationDeadlineText()}</p>
            </div>

            {/* Join/Leave Button */}
            {canJoin && (
              <div className="mb-6">
                {isJoined ? (
                  <button
                    onClick={handleJoinToggle}
                    disabled={joinLoading}
                    className={`w-full md:w-auto px-6 py-3 rounded-md transition ${
                      joinLoading
                        ? "bg-gray-300 cursor-not-allowed"
                        : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                    }`}
                  >
                    {joinLoading ? "..." : "Đã tham gia (Nhấn để rời)"}
                  </button>
                ) : (
                  <button
                    onClick={handleJoinToggle}
                    disabled={joinLoading}
                    className={`w-full md:w-auto px-6 py-3 rounded-md transition ${
                      joinLoading
                        ? "bg-gray-300 cursor-not-allowed"
                        : "bg-green-600 text-white hover:bg-green-700"
                    }`}
                  >
                    {joinLoading ? "..." : "Tham gia sự kiện"}
                  </button>
                )}
              </div>
            )}

            {!isAuthenticated && event.status === "OPEN_REGISTER" && (
              <div className="mb-6">
                <button
                  onClick={() => router.push("/auth/login")}
                  className="w-full md:w-auto px-6 py-3 btn-primary text-white rounded-md transition"
                >
                  Đăng nhập để tham gia
                </button>
              </div>
            )}

            {/* Full Content */}
            {event.content && (
              <div className="border-t pt-6">
                <h2 className="text-2xl font-bold text-gray-800 mb-4">Chi tiết</h2>
                <div
                  className="prose max-w-none text-gray-700 whitespace-pre-wrap"
                  dangerouslySetInnerHTML={{ __html: event.content }}
                />
              </div>
            )}
          </div>
        </div>
      </main>

      <MobileNav backgroundImage="/images/ground.jpg" />
    </div>
  );
}
