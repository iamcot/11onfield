"use client";

import MobileNav from "@/components/layout/MobileNav";
import RightNavigator from "@/components/layout/RightNavigator";
import Sidebar from "@/components/layout/Sidebar";
import TopBar from "@/components/layout/TopBar";
import TopUserCard from "@/components/layout/TopUserCard";
import { useAuth } from "@/contexts/AuthContext";
import { useSidebar } from "@/contexts/SidebarContext";
import { playerService } from "@/services/player.service";
import {
  PlayerListItem,
  PlayersFilters,
  getLevelDisplayName,
  getPositionDisplayName,
  getPreferredFootDisplayName,
} from "@/types/player";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";

function PlayersContent() {
  const { isAuthenticated, isLoading: authLoading, logout } = useAuth();
  const { isCollapsed } = useSidebar();
  const router = useRouter();
  const searchParams = useSearchParams();

  // State
  const [players, setPlayers] = useState<PlayerListItem[]>([]);
  const [pagination, setPagination] = useState({
    page: 0,
    totalPages: 0,
    total: 0,
    pageSize: 20,
  });
  const [filters, setFilters] = useState<Partial<PlayersFilters>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [searchInput, setSearchInput] = useState("");
  const [isInitialized, setIsInitialized] = useState(false);
  const [showRightNav, setShowRightNav] = useState(false);
  const [showSortMenu, setShowSortMenu] = useState(false);
  const [viewMode, setViewMode] = useState<"list" | "card">("list");

  const handleLogout = () => {
    logout();
    router.push("/auth/login");
  };

  // Initialize state from URL params on mount
  useEffect(() => {
    const page = parseInt(searchParams.get("page") || "0");
    const search = searchParams.get("search") || "";
    const positions =
      searchParams.get("positions")?.split(",").filter(Boolean) || [];
    const level = searchParams.get("level") || null;
    const preferredFoot = searchParams.get("preferredFoot") || null;
    const sortBy = searchParams.get("sortBy") || null;
    const sortOrder = (searchParams.get("sortOrder") as "asc" | "desc") || null;

    setSearchInput(search);
    setFilters({
      search: search || undefined,
      positions: positions.length > 0 ? positions : undefined,
      level: level as any,
      preferredFoot: preferredFoot || undefined,
      sortBy: sortBy || undefined,
      sortOrder: sortOrder || undefined,
    });
    setPagination((prev) => ({ ...prev, page }));
    setIsInitialized(true);
  }, []);

  // Update URL params when state changes
  useEffect(() => {
    if (!isInitialized) return;

    const params = new URLSearchParams();
    if (pagination.page > 0) params.set("page", pagination.page.toString());
    if (filters.search) params.set("search", filters.search);
    if (filters.positions && filters.positions.length > 0)
      params.set("positions", filters.positions.join(","));
    if (filters.level) params.set("level", filters.level);
    if (filters.preferredFoot)
      params.set("preferredFoot", filters.preferredFoot);
    if (filters.sortBy) {
      params.set("sortBy", filters.sortBy);
      params.set("sortOrder", filters.sortOrder || "asc");
    }

    const newUrl = params.toString()
      ? `/players?${params.toString()}`
      : "/players";
    window.history.replaceState(null, "", newUrl);
  }, [filters, pagination.page, isInitialized]);

  // Debounced search
  useEffect(() => {
    if (!isInitialized) return;

    const timer = setTimeout(() => {
      if (searchInput !== (filters.search || "")) {
        setFilters((prev) => ({ ...prev, search: searchInput }));
        setPagination((prev) => ({ ...prev, page: 0 })); // Reset to first page
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [searchInput, isInitialized]);

  // Fetch players
  useEffect(() => {
    if (!authLoading && isInitialized) {
      const fetchPlayers = async () => {
        try {
          setIsLoading(true);
          const response = await playerService.getPlayers(
            pagination.page,
            pagination.pageSize,
            filters,
          );
          setPlayers(response.data);
          setPagination((prev) => ({
            ...prev,
            totalPages: response.totalPages,
            total: response.total,
          }));
        } catch (error) {
          console.error("Error fetching players:", error);
        } finally {
          setIsLoading(false);
        }
      };

      fetchPlayers();
    }
  }, [authLoading, filters, pagination.page, isInitialized]);

  const handleFilterChange = (key: keyof PlayersFilters, value: any) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
    setPagination((prev) => ({ ...prev, page: 0 })); // Reset to first page
  };

  const handleSortChange = (sortBy: string, sortOrder: "asc" | "desc") => {
    if (sortBy === "") {
      // Clear sort
      setFilters((prev) => {
        const { sortBy, sortOrder, ...rest } = prev;
        return rest;
      });
    } else {
      setFilters((prev) => ({ ...prev, sortBy, sortOrder }));
    }
    setPagination((prev) => ({ ...prev, page: 0 }));
  };

  const handleClearFilters = () => {
    setSearchInput("");
    setFilters({});
    setPagination((prev) => ({ ...prev, page: 0 }));
  };

  const handlePageChange = (newPage: number) => {
    setPagination((prev) => ({ ...prev, page: newPage }));
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleRowClick = (userid: string) => {
    router.push(`/profile/${userid}?from=players`);
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Đang tải...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white flex flex-col md:flex-row">
      <Sidebar onLogout={handleLogout} />
      <TopBar onMenuToggle={() => setShowRightNav(!showRightNav)} />
      <RightNavigator
        isOpen={showRightNav}
        onClose={() => setShowRightNav(false)}
      />

      {/* Top User Card - Desktop Only */}
      <TopUserCard />

      <main className="flex-1 overflow-auto pb-16 pt-20 md:pb-0 md:pt-16 relative">
        {/* Background image at bottom */}
        <div className={`fixed bottom-0 left-0 right-0 h-48 pointer-events-none z-0 transition-all duration-300 ${isCollapsed ? 'md:left-16' : 'md:left-64'}`}>
          <div
            className="absolute inset-0 bg-cover bg-bottom"
            style={{ backgroundImage: `url(/images/ground.jpg)` }}
          >
            {/* Gradient overlay fade to white at top */}
            <div className="absolute inset-0 bg-gradient-to-t from-transparent via-white/50 to-white"></div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 py-6 relative z-10">
          {/* Page Header */}
          <div className="mb-6">
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
              Danh sách cầu thủ
            </h1>
            <p className="hidden md:block text-gray-600 mt-1">
              Tìm kiếm và khám phá cầu thủ trên hệ thống
            </p>
          </div>

          {/* Filters Section */}
          <div className="mb-6">
            {/* Mobile: Search + View Toggle + Sort Icon Row */}
            <div className="md:hidden flex gap-2 mb-3">
              <input
                type="text"
                placeholder="Tìm kiếm theo tên..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
              />

              {/* Sort Icon */}
              <div className="relative">
                <button
                  onClick={() => setShowSortMenu(!showSortMenu)}
                  className="p-2 border border-gray-300 rounded-md hover:bg-gray-50 transition"
                  aria-label="Sắp xếp"
                >
                  <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4h13M3 8h9m-9 4h6m4 0l4-4m0 0l4 4m-4-4v12" />
                  </svg>
                </button>

                {/* Sort Popup Menu */}
                {showSortMenu && (
                  <>
                    <div
                      className="fixed inset-0 z-10"
                      onClick={() => setShowSortMenu(false)}
                    ></div>
                    <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-xl border border-gray-200 py-2 z-20">
                      <button
                        onClick={() => {
                          handleSortChange("", "asc");
                          setShowSortMenu(false);
                        }}
                        className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-50 ${!filters.sortBy ? "text-green-600 font-medium" : "text-gray-700"}`}
                      >
                        Không sắp xếp
                      </button>
                      <button
                        onClick={() => {
                          handleSortChange("fullName", "asc");
                          setShowSortMenu(false);
                        }}
                        className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-50 ${filters.sortBy === "fullName" && filters.sortOrder === "asc" ? "text-green-600 font-medium" : "text-gray-700"}`}
                      >
                        Tên (A → Z)
                      </button>
                      <button
                        onClick={() => {
                          handleSortChange("fullName", "desc");
                          setShowSortMenu(false);
                        }}
                        className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-50 ${filters.sortBy === "fullName" && filters.sortOrder === "desc" ? "text-green-600 font-medium" : "text-gray-700"}`}
                      >
                        Tên (Z → A)
                      </button>
                      <button
                        onClick={() => {
                          handleSortChange("createdAt", "desc");
                          setShowSortMenu(false);
                        }}
                        className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-50 ${filters.sortBy === "createdAt" && filters.sortOrder === "desc" ? "text-green-600 font-medium" : "text-gray-700"}`}
                      >
                        Mới nhất
                      </button>
                      <button
                        onClick={() => {
                          handleSortChange("createdAt", "asc");
                          setShowSortMenu(false);
                        }}
                        className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-50 ${filters.sortBy === "createdAt" && filters.sortOrder === "asc" ? "text-green-600 font-medium" : "text-gray-700"}`}
                      >
                        Cũ nhất
                      </button>
                    </div>
                  </>
                )}
              </div>

              {/* View Mode Toggle */}
              <button
                onClick={() => setViewMode(viewMode === "list" ? "card" : "list")}
                className="p-2 border border-gray-300 rounded-md hover:bg-gray-50 transition"
                aria-label="Chuyển chế độ xem"
              >
                {viewMode === "list" ? (
                  <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                )}
              </button>
            </div>

            {/* Mobile: Filter Row - Horizontal Scroll */}
            <div className="md:hidden flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
              <select
                value={filters.positions?.[0] || ""}
                onChange={(e) =>
                  handleFilterChange(
                    "positions",
                    e.target.value ? [e.target.value] : [],
                  )
                }
                className="flex-shrink-0 px-2 py-1.5 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 text-xs"
                style={{
                  colorScheme: 'light',
                  backgroundColor: 'white',
                  color: '#374151',
                  WebkitTextFillColor: '#374151'
                }}
              >
                <option value="">Vị trí</option>
                <option value="striker">Tiền đạo</option>
                <option value="midfielder">Tiền vệ</option>
                <option value="defender">Hậu vệ</option>
                <option value="centerback">Trung vệ</option>
                <option value="goalkeeper">Thủ môn</option>
              </select>

              <select
                value={filters.level || ""}
                onChange={(e) =>
                  handleFilterChange("level", e.target.value || null)
                }
                className="flex-shrink-0 px-2 py-1.5 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 text-xs"
              >
                <option value="">Cấp độ</option>
                <option value="CAU_THU_MOI">Mới</option>
                <option value="NGHIEP_DU">Nghiệp dư</option>
                <option value="TUYEN_TRE">Tuyển trẻ</option>
                <option value="CHUYEN_NGHIEP">Chuyên nghiệp</option>
              </select>

              <select
                value={filters.preferredFoot || ""}
                onChange={(e) =>
                  handleFilterChange("preferredFoot", e.target.value || null)
                }
                className="flex-shrink-0 px-2 py-1.5 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 text-xs"
              >
                <option value="">Chân thuận</option>
                <option value="left">Trái</option>
                <option value="right">Phải</option>
                <option value="both">Cả hai</option>
              </select>
            </div>

            {/* Desktop: Search + Sort + View Toggle Row */}
            <div className="hidden md:flex gap-2 mb-3">
              <input
                type="text"
                placeholder="Tìm kiếm theo tên cầu thủ..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
              />

              {/* Sort Dropdown */}
              <select
                value={
                  filters.sortBy ? `${filters.sortBy}-${filters.sortOrder}` : ""
                }
                onChange={(e) => {
                  if (!e.target.value) {
                    handleSortChange("", "asc");
                  } else {
                    const [sortBy, sortOrder] = e.target.value.split("-");
                    handleSortChange(sortBy, sortOrder as "asc" | "desc");
                  }
                }}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 text-sm"
              >
                <option value="">Không sắp xếp</option>
                <option value="fullName-asc">Tên (A → Z)</option>
                <option value="fullName-desc">Tên (Z → A)</option>
                <option value="dob-asc">Tuổi (Tăng dần)</option>
                <option value="dob-desc">Tuổi (Giảm dần)</option>
                <option value="height-asc">Chiều cao (Thấp → Cao)</option>
                <option value="height-desc">Chiều cao (Cao → Thấp)</option>
                <option value="weight-asc">Cân nặng (Nhẹ → Nặng)</option>
                <option value="weight-desc">Cân nặng (Nặng → Nhẹ)</option>
              </select>

              {/* View Mode Toggle */}
              <button
                onClick={() => setViewMode(viewMode === "list" ? "card" : "list")}
                className="p-2 border border-gray-300 rounded-md hover:bg-gray-50 transition"
                aria-label="Chuyển chế độ xem"
              >
                {viewMode === "list" ? (
                  <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                )}
              </button>
            </div>

            {/* Desktop: Quick Filters */}
            <div className="hidden md:grid grid-cols-3 gap-3 mb-3">
              {/* Position Filter (simplified for now - will add multi-select later) */}
              <select
                value={filters.positions?.[0] || ""}
                onChange={(e) =>
                  handleFilterChange(
                    "positions",
                    e.target.value ? [e.target.value] : [],
                  )
                }
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 text-sm"
              >
                <option value="">Tất cả vị trí</option>
                <option value="striker">Tiền đạo</option>
                <option value="midfielder">Tiền vệ</option>
                <option value="defender">Hậu vệ</option>
                <option value="centerback">Trung vệ</option>
                <option value="goalkeeper">Thủ môn</option>
              </select>

              {/* Level Filter */}
              <select
                value={filters.level || ""}
                onChange={(e) =>
                  handleFilterChange("level", e.target.value || null)
                }
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 text-sm"
              >
                <option value="">Tất cả cấp độ</option>
                <option value="CAU_THU_MOI">Cầu thủ mới</option>
                <option value="NGHIEP_DU">Nghiệp dư</option>
                <option value="TUYEN_TRE">Tuyển trẻ</option>
                <option value="CHUYEN_NGHIEP">Chuyên nghiệp</option>
              </select>

              {/* Preferred Foot Filter */}
              <select
                value={filters.preferredFoot || ""}
                onChange={(e) =>
                  handleFilterChange("preferredFoot", e.target.value || null)
                }
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 text-sm"
              >
                <option value="">Tất cả chân thuận</option>
                <option value="left">Trái</option>
                <option value="right">Phải</option>
                <option value="both">Cả hai</option>
              </select>
            </div>

            {/* Clear Filters Button */}
            {(searchInput ||
              filters.positions?.length ||
              filters.level ||
              filters.preferredFoot ||
              filters.sortBy) && (
              <div className="mt-2 flex justify-end">
                <button
                  onClick={handleClearFilters}
                  className="px-3 py-1.5 text-xs text-red-600 hover:text-red-700 hover:bg-red-50 rounded-md transition flex items-center gap-1"
                >
                  <svg
                    className="w-3.5 h-3.5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                  <span>Xóa bộ lọc</span>
                </button>
              </div>
            )}
          </div>

          {/* Results Count */}
          <div className="mb-4 text-sm text-gray-600">
            Tìm thấy <span className="font-semibold">{pagination.total}</span>{" "}
            cầu thủ
          </div>

          {/* Players Content */}
          {isLoading ? (
            <div className="p-8 text-center text-gray-500 bg-white rounded-lg shadow">Đang tải...</div>
          ) : players.length === 0 ? (
            <div className="p-8 text-center text-gray-500 bg-white rounded-lg shadow">
              Không tìm thấy cầu thủ nào
            </div>
          ) : (
            <>
              {/* Desktop Content */}
              <div className="hidden md:block">
                {viewMode === "list" ? (
                  /* Desktop Table View */
                  <div className="bg-white rounded-lg shadow overflow-hidden">
                    <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 border-b">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Avatar
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Tên
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Tuổi
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Chiều cao
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Cân nặng
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Vị trí
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Chân thuận
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Cấp độ
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Tỉnh/TP
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {players.map((player) => (
                        <tr
                          key={player.id}
                          onClick={() => handleRowClick(player.userid)}
                          className="hover:bg-gray-50 cursor-pointer transition"
                        >
                          <td className="px-4 py-3">
                            {player.avatar ? (
                              <img
                                src={player.avatar}
                                alt={player.fullName}
                                className="w-10 h-10 rounded-full object-cover"
                              />
                            ) : (
                              <div className="w-10 h-10 rounded-full bg-green-200 flex items-center justify-center text-sm font-bold text-green-600">
                                {player.fullName?.charAt(0) || "?"}
                              </div>
                            )}
                          </td>
                          <td className="px-4 py-3 text-sm font-medium text-gray-900">
                            {player.fullName}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-600">
                            {player.age || "N/A"}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-600">
                            {player.height ? `${player.height} cm` : "N/A"}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-600">
                            {player.weight ? `${player.weight} kg` : "N/A"}
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex gap-1 flex-wrap">
                              {player.positions.slice(0, 2).map((pos) => (
                                <span
                                  key={pos}
                                  className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800"
                                >
                                  {getPositionDisplayName(pos)}
                                </span>
                              ))}
                              {player.positions.length > 2 && (
                                <span className="px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                                  +{player.positions.length - 2}
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-600">
                            {player.preferredFoot
                              ? getPreferredFootDisplayName(
                                  player.preferredFoot,
                                )
                              : "N/A"}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-600">
                            {player.level
                              ? getLevelDisplayName(player.level)
                              : "N/A"}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-600">
                            {player.provinceName || "N/A"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                  </div>
                ) : (
                  /* Desktop Card View - 3-4 columns */
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {players.map((player) => (
                      <div
                        key={player.id}
                        onClick={() => handleRowClick(player.userid)}
                        className="bg-white rounded-lg shadow overflow-hidden cursor-pointer hover:shadow-lg transition"
                      >
                        {/* Player Image - Full Width */}
                        {player.avatar ? (
                          <img
                            src={player.avatar}
                            alt={player.fullName}
                            className="w-full h-48 object-cover"
                          />
                        ) : (
                          <div className="w-full h-48 bg-gradient-to-br from-green-200 to-green-400 flex items-center justify-center">
                            <span className="text-5xl font-bold text-white">
                              {player.fullName?.charAt(0) || "?"}
                            </span>
                          </div>
                        )}

                        {/* Player Info */}
                        <div className="p-4">
                          <h3 className="font-semibold text-gray-900 mb-2 truncate">
                            {player.fullName}
                          </h3>
                          <p className="text-sm text-gray-500 mb-3">
                            {player.age ? `${player.age} tuổi` : "N/A"}
                          </p>
                          <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                              <span className="text-gray-500">Chiều cao:</span>
                              <span className="font-medium text-gray-900">
                                {player.height ? `${player.height}cm` : "N/A"}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-500">Cân nặng:</span>
                              <span className="font-medium text-gray-900">
                                {player.weight ? `${player.weight}kg` : "N/A"}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-500">Vị trí:</span>
                              <span className="font-medium text-gray-900 truncate ml-2">
                                {player.positions.length > 0
                                  ? player.positions
                                      .map(getPositionDisplayName)
                                      .join(", ")
                                  : "N/A"}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-500">Cấp độ:</span>
                              <span className="font-medium text-gray-900">
                                {player.level ? getLevelDisplayName(player.level) : "N/A"}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Mobile Cards */}
              <div className="md:hidden">
                  {viewMode === "list" ? (
                    /* List View - Table Style */
                    <div className="bg-white rounded-lg shadow divide-y divide-gray-200">
                      {players.map((player) => (
                        <div
                          key={player.id}
                          onClick={() => handleRowClick(player.userid)}
                          className="p-4 hover:bg-gray-50 cursor-pointer transition"
                        >
                          <div className="flex items-center gap-3 mb-3">
                            {player.avatar ? (
                              <img
                                src={player.avatar}
                                alt={player.fullName}
                                className="w-12 h-12 rounded-full object-cover"
                              />
                            ) : (
                              <div className="w-12 h-12 rounded-full bg-green-200 flex items-center justify-center text-lg font-bold text-green-600">
                                {player.fullName?.charAt(0) || "?"}
                              </div>
                            )}
                            <div className="flex-1 min-w-0">
                              <h3 className="font-semibold text-gray-900 truncate">
                                {player.fullName}
                              </h3>
                              <p className="text-sm text-gray-500">
                                {player.age ? `${player.age} tuổi` : "N/A"} •{" "}
                                {player.height ? `${player.height} cm` : "N/A"} •{" "}
                                {player.weight ? `${player.weight} kg` : "N/A"}
                              </p>
                            </div>
                          </div>
                          <div className="grid grid-cols-2 gap-2 text-sm">
                            <div>
                              <span className="text-gray-500">Vị trí:</span>{" "}
                              <span className="font-medium text-gray-900">
                                {player.positions.length > 0
                                  ? player.positions
                                      .map(getPositionDisplayName)
                                      .join(", ")
                                  : "N/A"}
                              </span>
                            </div>
                            <div>
                              <span className="text-gray-500">Chân:</span>{" "}
                              <span className="font-medium text-gray-900">
                                {player.preferredFoot
                                  ? getPreferredFootDisplayName(
                                      player.preferredFoot,
                                    )
                                  : "N/A"}
                              </span>
                            </div>
                            <div>
                              <span className="text-gray-500">Cấp độ:</span>{" "}
                              <span className="font-medium text-gray-900">
                                {player.level
                                  ? getLevelDisplayName(player.level)
                                  : "N/A"}
                              </span>
                            </div>
                            <div>
                              <span className="text-gray-500">Tỉnh/TP:</span>{" "}
                              <span className="font-medium text-gray-900">
                                {player.provinceName || "N/A"}
                              </span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    /* Card View - 2 columns Grid */
                    <div className="grid grid-cols-2 gap-3">
                      {players.map((player) => (
                        <div
                          key={player.id}
                          onClick={() => handleRowClick(player.userid)}
                          className="bg-white rounded-lg shadow overflow-hidden cursor-pointer hover:shadow-lg transition"
                        >
                          {/* Player Image - Full Width */}
                          {player.avatar ? (
                            <img
                              src={player.avatar}
                              alt={player.fullName}
                              className="w-full h-40 object-cover"
                            />
                          ) : (
                            <div className="w-full h-40 bg-gradient-to-br from-green-200 to-green-400 flex items-center justify-center">
                              <span className="text-4xl font-bold text-white">
                                {player.fullName?.charAt(0) || "?"}
                              </span>
                            </div>
                          )}

                          {/* Player Info */}
                          <div className="p-3">
                            <h3 className="font-semibold text-gray-900 text-sm mb-1 truncate">
                              {player.fullName}
                            </h3>
                            <p className="text-xs text-gray-500 mb-2">
                              {player.age ? `${player.age} tuổi` : "N/A"}
                            </p>
                            <div className="space-y-1 text-xs">
                              <div className="flex justify-between">
                                <span className="text-gray-500">Chiều cao:</span>
                                <span className="font-medium text-gray-900">
                                  {player.height ? `${player.height}cm` : "N/A"}
                                </span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-500">Cân nặng:</span>
                                <span className="font-medium text-gray-900">
                                  {player.weight ? `${player.weight}kg` : "N/A"}
                                </span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-500">Vị trí:</span>
                                <span className="font-medium text-gray-900 truncate ml-1">
                                  {player.positions.length > 0
                                    ? player.positions
                                        .map(getPositionDisplayName)
                                        .join(", ")
                                    : "N/A"}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </>
            )}

            {/* Pagination */}
            {pagination.totalPages > 1 && (
            <div className="mt-6 flex items-center justify-between">
              <button
                onClick={() => handlePageChange(pagination.page - 1)}
                disabled={pagination.page === 0}
                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                ← Trước
              </button>

              <div className="flex items-center gap-2">
                {/* Page numbers */}
                {Array.from(
                  { length: Math.min(5, pagination.totalPages) },
                  (_, i) => {
                    let pageNum: number;
                    if (pagination.totalPages <= 5) {
                      pageNum = i;
                    } else if (pagination.page < 3) {
                      pageNum = i;
                    } else if (pagination.page > pagination.totalPages - 4) {
                      pageNum = pagination.totalPages - 5 + i;
                    } else {
                      pageNum = pagination.page - 2 + i;
                    }

                    return (
                      <button
                        key={pageNum}
                        onClick={() => handlePageChange(pageNum)}
                        className={`px-3 py-1 rounded-md text-sm font-medium ${
                          pagination.page === pageNum
                            ? "bg-green-600 text-white"
                            : "text-gray-700 hover:bg-gray-100"
                        }`}
                      >
                        {pageNum + 1}
                      </button>
                    );
                  },
                )}
              </div>

              <button
                onClick={() => handlePageChange(pagination.page + 1)}
                disabled={pagination.page >= pagination.totalPages - 1}
                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Sau →
              </button>
            </div>
          )}
        </div>
      </main>

      <MobileNav backgroundImage="/images/ground.jpg" />
    </div>
  );
}

export default function PlayersPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <p>Đang tải...</p>
        </div>
      }
    >
      <PlayersContent />
    </Suspense>
  );
}
