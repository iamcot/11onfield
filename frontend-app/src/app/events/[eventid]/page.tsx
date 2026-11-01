"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { useAnalytics } from "@/hooks/useAnalytics";
import { eventService } from "@/services/event.service";
import { EventDetail, RegistrationForm, getStatusDisplayName, getStatusBadgeColor } from "@/types/event";
import Sidebar from "@/components/layout/Sidebar";
import MobileNav from "@/components/layout/MobileNav";
import TopBar from "@/components/layout/TopBar";
import TopUserCard from "@/components/layout/TopUserCard";
import RegistrationFormModal from "@/components/events/RegistrationFormModal";
import { formatDateOnly } from "@/utils/timezone";
import { useI18n } from "@/i18n/I18nProvider";

export default function EventDetailPage() {
  const { t, intlLocale } = useI18n();
  const { isAuthenticated, isLoading: authLoading, logout } = useAuth();
  const { track } = useAnalytics();
  const router = useRouter();
  const params = useParams();
  const eventId = parseInt(params.eventid as string);

  const [event, setEvent] = useState<EventDetail | null>(null);
  const [isJoined, setIsJoined] = useState(false);
  const [joinLoading, setJoinLoading] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  // recruitment events: the form and what the player already sent
  const [regForm, setRegForm] = useState<RegistrationForm | null>(null);
  const [showForm, setShowForm] = useState(false);

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

        // Track event view
        track('event_viewed', {
          event_id: eventId,
          event_title: eventData.title,
          event_status: eventData.status,
          participant_count: eventData.participantCount,
          has_picture: !!eventData.picture,
          start_date: eventData.startDate
        });

        // recruitment: guests get the empty form, signed-in players their prefilled one
        if (eventData.eventType === "RECRUITMENT") {
          setRegForm(await eventService.getRegistrationForm(eventId).catch(() => null));
        } else if (isAuthenticated) {
          setIsJoined(await eventService.isUserJoined(eventId));
        }
      } catch (err: any) {
        console.error("Error fetching event:", err);
        setError(t(err.message || "Không thể tải thông tin sự kiện"));
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
      if (!confirm(t("Bạn có chắc chắn muốn rời khỏi sự kiện này?"))) {
        return;
      }
    }

    setJoinLoading(true);
    try {
      if (isJoined) {
        await eventService.leaveEvent(eventId);
        setIsJoined(false);

        // Track event registration cancelled
        track('event_registration_cancelled', {
          event_id: eventId,
          event_title: event?.title || ''
        });

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

        // Track event registration completed
        track('event_registration_completed', {
          event_id: eventId,
          event_title: event?.title || '',
          participant_count_after: (event?.participantCount || 0) + 1
        });

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
      alert(t(err.message || "Có lỗi xảy ra. Vui lòng thử lại."));
    } finally {
      setJoinLoading(false);
    }
  };

  const formatDate = (dateStr: string, timeStr: string | null) => {
    const date = new Date(dateStr);
    const dateFormatted = date.toLocaleDateString(intlLocale, {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
    if (timeStr) {
      return t("{dateFormatted} lúc {timeStr}", { dateFormatted, timeStr });
    }
    return dateFormatted;
  };

  const formatEventTime = () => {
    if (!event) return "";

    const startDateStr = formatDateOnly(event.startDate);
    const endDateStr = formatDateOnly(event.endDate);

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
        return t("Còn {daysLeft} ngày để đăng ký", { daysLeft });
      } else {
        return t("Hết hạn đăng ký");
      }
    } else if (event.status === "CLOSE_REGISTER") {
      return t("Đã đóng đăng ký");
    } else if (event.status === "COMPLETE") {
      return t("Sự kiện đã kết thúc");
    } else if (event.status === "CANCELLED") {
      return t("Sự kiện đã hủy");
    } else {
      return t("Đang lên kế hoạch");
    }
  };

  // only before the first load: signing up from the form must not unmount it
  if ((authLoading || isLoading) && !event) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>{t("Đang tải...")}</p>
      </div>
    );
  }

  if (error || !event) {
    return (
      <div className="min-h-screen bg-gray-50 flex">
        <Sidebar onLogout={handleLogout} />
        <TopBar />
        <TopUserCard />
        <main className="flex-1 p-4 pt-24 md:p-8 md:pt-24 mb-16 md:mb-0">
          <div className="max-w-4xl mx-auto">
            <div className="bg-white rounded-lg shadow p-8 text-center">
              <p className="text-red-600">{error || t("Không tìm thấy sự kiện")}</p>
              <button
                onClick={() => router.push("/events")}
                className="mt-4 px-4 py-2 btn-primary text-white rounded-md transition"
              >
                {t("Quay lại danh sách")}
              </button>
            </div>
          </div>
        </main>
        <MobileNav backgroundImage="/images/ground.jpg" />
      </div>
    );
  }

  const isRecruitment = event.eventType === "RECRUITMENT";
  const canJoin = event.status === "OPEN_REGISTER" && isAuthenticated && !isRecruitment;
  const myReg = regForm?.registration ?? null;
  const fmtDateTime = (iso: string) =>
    new Date(iso).toLocaleString(intlLocale, { hour: "2-digit", minute: "2-digit", day: "2-digit", month: "2-digit", year: "numeric" });

  const openForm = () => {
    if (!regForm) return;
    track("event_registration_started", { event_id: eventId, event_title: event.title });
    setShowForm(true);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <Sidebar onLogout={handleLogout} />
      <TopBar />
      <TopUserCard />

      <main className="flex-1 p-4 pt-24 md:p-8 md:pt-24 mb-16 md:mb-0">
        <div className="max-w-4xl mx-auto">
          {/* Back Button */}
          <button
            onClick={() => router.push("/events")}
            className="mb-4 text-green-600 hover:text-green-700 flex items-center gap-2"
          >
            {t("← Quay lại danh sách")}
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
              <div className="flex flex-wrap gap-2 self-start">
                {isRecruitment && (
                  <span className="px-3 py-1 text-sm font-semibold rounded-full bg-amber-500 text-white">{t("Tuyển sinh")}</span>
                )}
                <span
                  className={`px-3 py-1 text-sm font-semibold rounded-full text-white ${getStatusBadgeColor(
                    event.status
                  )}`}
                >
                  {t(getStatusDisplayName(event.status))}
                </span>
              </div>
            </div>

            {/* Short Description */}
            {event.shortContent && (
              <p className="text-lg text-gray-600 mb-6">{event.shortContent}</p>
            )}

            {/* Event Details Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              {/* Event Time */}
              <div>
                <h3 className="text-sm font-semibold text-gray-500 mb-1">{t("Thời gian")}</h3>
                <p className="text-gray-800">{formatEventTime()}</p>
              </div>

              {/* Location */}
              {event.location && (
                <div>
                  <h3 className="text-sm font-semibold text-gray-500 mb-1">{t("Địa điểm")}</h3>
                  <p className="text-gray-800">{event.location}</p>
                  {event.provinceName && (
                    <p className="text-sm text-gray-500">{event.provinceName}</p>
                  )}
                </div>
              )}

              {isRecruitment && event.partnerName && (
                <div>
                  <h3 className="text-sm font-semibold text-gray-500 mb-1">{t("Đơn vị tuyển sinh")}</h3>
                  <p className="text-gray-800">{event.partnerName}</p>
                </div>
              )}

              {/* Participants */}
              <div>
                <h3 className="text-sm font-semibold text-gray-500 mb-1">{t("Người tham gia")}</h3>
                <p className="text-gray-800">{t("{n} người", { n: event.participantCount })}</p>
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
                    {joinLoading ? "..." : t("Đã tham gia (Nhấn để rời)")}
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
                    {joinLoading ? "..." : t("Tham gia sự kiện")}
                  </button>
                )}
              </div>
            )}

            {/* Recruitment: apply with the form, then follow the application */}
            {isRecruitment && isAuthenticated && myReg && (
              <div className={`mb-4 rounded-md border p-4 ${myReg.status === "FORWARDED" ? "border-blue-200 bg-blue-50" : "border-green-200 bg-green-50"}`}>
                {myReg.status === "FORWARDED" ? (
                  <>
                    <p className="font-semibold text-blue-800">{t("Hồ sơ đã được chuyển")}</p>
                    <p className="text-sm text-blue-800">
                      {t("11of đã chuyển hồ sơ của bạn tới {partner} lúc {time}. Đơn vị sẽ liên hệ trực tiếp với bạn.", {
                        partner: event.partnerName || t("đơn vị tuyển sinh"),
                        time: myReg.forwardedAt ? fmtDateTime(myReg.forwardedAt) : "",
                      })}
                    </p>
                  </>
                ) : (
                  <>
                    <p className="font-semibold text-green-900">{t("Đã gửi hồ sơ")}</p>
                    <p className="text-sm text-green-800">
                      {t("Gửi lúc {time}. 11of đang xem hồ sơ và sẽ chuyển tới {partner}.", {
                        time: fmtDateTime(myReg.updatedAt),
                        partner: event.partnerName || t("đơn vị tuyển sinh"),
                      })}
                    </p>
                  </>
                )}
              </div>
            )}
            {isRecruitment && regForm && (event.status === "OPEN_REGISTER" || myReg) && (
              <div className="mb-6">
                <button
                  onClick={openForm}
                  className={`w-full md:w-auto px-6 py-3 rounded-md transition font-semibold ${
                    myReg ? "bg-white border border-green-600 text-green-700 hover:bg-green-50" : "bg-green-600 text-white hover:bg-green-700"
                  }`}
                >
                  {!myReg
                    ? t("Tham gia")
                    : myReg.status === "SUBMITTED" && event.status === "OPEN_REGISTER"
                      ? t("Xem / sửa hồ sơ")
                      : t("Xem hồ sơ đã gửi")}
                </button>
              </div>
            )}

            {!isAuthenticated && !isRecruitment && event.status === "OPEN_REGISTER" && (
              <div className="mb-6">
                <button
                  onClick={() => router.push("/auth/login")}
                  className="w-full md:w-auto px-6 py-3 btn-primary text-white rounded-md transition"
                >
                  {t("Đăng nhập để tham gia")}
                </button>
              </div>
            )}

            {/* Full Content */}
            {event.content && (
              <div className="border-t pt-6">
                <h2 className="text-2xl font-bold text-gray-800 mb-4">{t("Chi tiết")}</h2>
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

      {showForm && regForm && (
        <RegistrationFormModal
          eventId={eventId}
          eventTitle={event.title}
          form={regForm}
          guest={!isAuthenticated}
          onClose={() => setShowForm(false)}
          onSubmitted={(r) => {
            if (!myReg) track("event_registration_completed", { event_id: eventId, event_title: event.title });
            if (!myReg) setEvent({ ...event, participantCount: event.participantCount + 1 });
            setRegForm({ ...regForm, registration: r });
          }}
        />
      )}
    </div>
  );
}
