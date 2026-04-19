"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { eventService } from "@/services/event.service";
import { EventListItem, EventsFilters, getStatusDisplayName, getStatusBadgeColor } from "@/types/event";
import Sidebar from "@/components/layout/Sidebar";
import MobileNav from "@/components/layout/MobileNav";

function EventsContent() {
  const { isAuthenticated, isLoading: authLoading, logout } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

  // State
  const [events, setEvents] = useState<EventListItem[]>([]);
  const [pagination, setPagination] = useState({ page: 0, totalPages: 0, total: 0, pageSize: 20 });
  const [filters, setFilters] = useState<Partial<EventsFilters>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [searchInput, setSearchInput] = useState("");
  const [isInitialized, setIsInitialized] = useState(false);

  const handleLogout = () => {
    logout();
    router.push("/auth/login");
  };

  // Initialize state from URL params on mount
  useEffect(() => {
    const page = parseInt(searchParams.get("page") || "0");
    const search = searchParams.get("search") || "";
    const status = searchParams.get("status") || "";
    const sortBy = searchParams.get("sortBy") || null;
    const sortOrder = (searchParams.get("sortOrder") as "asc" | "desc") || null;

    setSearchInput(search);
    setFilters({
      search: search || undefined,
      status: status as any,
      sortBy: sortBy || undefined,
      sortOrder: sortOrder || undefined,
    });
    setPagination(prev => ({ ...prev, page }));
    setIsInitialized(true);
  }, []);

  // Update URL params when state changes
  useEffect(() => {
    if (!isInitialized) return;

    const params = new URLSearchParams();
    if (pagination.page > 0) params.set("page", pagination.page.toString());
    if (filters.search) params.set("search", filters.search);
    if (filters.status) params.set("status", filters.status);
    if (filters.sortBy) {
      params.set("sortBy", filters.sortBy);
      params.set("sortOrder", filters.sortOrder || "asc");
    }

    const newUrl = params.toString() ? `/events?${params.toString()}` : "/events";
    window.history.replaceState(null, "", newUrl);
  }, [filters, pagination.page, isInitialized]);

  // Debounced search
  useEffect(() => {
    if (!isInitialized) return;

    const timer = setTimeout(() => {
      if (searchInput !== (filters.search || "")) {
        setFilters(prev => ({ ...prev, search: searchInput }));
        setPagination(prev => ({ ...prev, page: 0 })); // Reset to first page
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [searchInput, isInitialized]);

  // Fetch events
  useEffect(() => {
    if (!authLoading && isInitialized) {
      const fetchEvents = async () => {
        try {
          setIsLoading(true);
          const response = await eventService.getEvents(pagination.page, pagination.pageSize, filters);
          setEvents(response.data);
          setPagination(prev => ({
            ...prev,
            totalPages: response.totalPages,
            total: response.total,
          }));
        } catch (error) {
          console.error("Error fetching events:", error);
        } finally {
          setIsLoading(false);
        }
      };

      fetchEvents();
    }
  }, [authLoading, filters, pagination.page, isInitialized]);

  const handleFilterChange = (key: keyof EventsFilters, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setPagination(prev => ({ ...prev, page: 0 })); // Reset to first page
  };

  const handleClearFilters = () => {
    setSearchInput("");
    setFilters({});
    setPagination(prev => ({ ...prev, page: 0 }));
  };

  const handlePageChange = (newPage: number) => {
    setPagination(prev => ({ ...prev, page: newPage }));
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleRowClick = (eventId: number) => {
    router.push(`/events/${eventId}`);
  };

  const formatDate = (dateStr: string, timeStr: string | null) => {
    const date = new Date(dateStr);
    const dateFormatted = date.toLocaleDateString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
    if (timeStr) {
      return `${dateFormatted} ${timeStr}`;
    }
    return dateFormatted;
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Đang tải...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <Sidebar onLogout={handleLogout} />

      <main className="flex-1 p-4 md:p-8 mb-16 md:mb-0">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-gray-800">Sự kiện</h1>
            <p className="text-gray-600 mt-1">Khám phá và tham gia các sự kiện bóng đá</p>
          </div>

          {/* Filters */}
          <div className="bg-white rounded-lg shadow p-4 mb-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {/* Search */}
              <div className="md:col-span-2">
                <input
                  type="text"
                  placeholder="Tìm kiếm sự kiện..."
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>

              {/* Status Filter */}
              <div>
                <select
                  value={filters.status || ""}
                  onChange={(e) => handleFilterChange("status", e.target.value || undefined)}
                  className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  <option value="">Tất cả trạng thái</option>
                  <option value="PLAN">Đang lên kế hoạch</option>
                  <option value="OPEN_REGISTER">Đang mở đăng ký</option>
                  <option value="CLOSE_REGISTER">Đóng đăng ký</option>
                  <option value="COMPLETE">Hoàn thành</option>
                  <option value="CANCELLED">Hủy bỏ</option>
                </select>
              </div>

              {/* Clear Filters */}
              <div>
                <button
                  onClick={handleClearFilters}
                  className="w-full px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition"
                >
                  Xóa bộ lọc
                </button>
              </div>
            </div>
          </div>

          {/* Loading State */}
          {isLoading ? (
            <div className="bg-white rounded-lg shadow p-8 text-center">
              <p className="text-gray-500">Đang tải sự kiện...</p>
            </div>
          ) : events.length === 0 ? (
            <div className="bg-white rounded-lg shadow p-8 text-center">
              <p className="text-gray-500">Không tìm thấy sự kiện nào</p>
            </div>
          ) : (
            <>
              {/* Events Grid - 2 columns */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {events.map((event) => (
                  <div
                    key={event.id}
                    onClick={() => handleRowClick(event.id)}
                    className="bg-white rounded-lg shadow overflow-hidden cursor-pointer hover:shadow-lg transition-shadow"
                  >
                    {/* Event Image - Full Width */}
                    {event.picture ? (
                      <div className="relative w-full h-48 bg-gray-200">
                        <img
                          src={event.picture}
                          alt={event.title}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    ) : (
                      <div className="w-full h-48 bg-gray-200 flex items-center justify-center">
                        <span className="text-gray-400 text-sm">Không có hình ảnh</span>
                      </div>
                    )}

                    {/* Event Info */}
                    <div className="p-4">
                      {/* Title */}
                      <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2">
                        {event.title}
                      </h3>

                      {/* Status Badge */}
                      <div className="mb-3">
                        <span
                          className={`px-2 py-1 text-xs font-semibold rounded-full text-white ${getStatusBadgeColor(
                            event.status
                          )}`}
                        >
                          {getStatusDisplayName(event.status)}
                        </span>
                      </div>

                      {/* Time and Location - Same Line */}
                      <div className="flex items-center text-sm text-gray-600 mb-2 flex-wrap gap-x-4">
                        {/* Time */}
                        <div className="flex items-center">
                          <svg
                            className="w-4 h-4 mr-1 flex-shrink-0"
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
                          <span>{formatDate(event.startDate, event.startTime)}</span>
                        </div>

                        {/* Location */}
                        <div className="flex items-center">
                          <svg
                            className="w-4 h-4 mr-1 flex-shrink-0"
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
                          <span>{event.location || "Chưa xác định"}</span>
                        </div>
                      </div>

                      {/* Short Content */}
                      {event.shortContent && (
                        <p className="text-sm text-gray-600 mb-2 line-clamp-2">
                          {event.shortContent}
                        </p>
                      )}

                      {/* Participant Count */}
                      <div className="flex items-center text-sm text-gray-500 mt-3 pt-3 border-t">
                        <svg
                          className="w-4 h-4 mr-1"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
                          />
                        </svg>
                        <span>{event.participantCount} người tham gia</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Pagination */}
              {pagination.totalPages > 1 && (
                <div className="mt-6 flex justify-center items-center gap-2">
                  <button
                    onClick={() => handlePageChange(pagination.page - 1)}
                    disabled={pagination.page === 0}
                    className="px-4 py-2 bg-white border rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Trước
                  </button>
                  <span className="text-sm text-gray-600">
                    Trang {pagination.page + 1} / {pagination.totalPages}
                  </span>
                  <button
                    onClick={() => handlePageChange(pagination.page + 1)}
                    disabled={pagination.page >= pagination.totalPages - 1}
                    className="px-4 py-2 bg-white border rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Sau
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </main>

      <MobileNav onLogout={handleLogout} />
    </div>
  );
}

export default function EventsPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <p>Đang tải...</p>
      </div>
    }>
      <EventsContent />
    </Suspense>
  );
}
