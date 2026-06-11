"use client";

import HexagonChart from "@/components/HexagonChart";
import PlayerCard from "@/components/PlayerCard";
import { playerService } from "@/services/player.service";
import { provinceService } from "@/services/province.service";
import {
  getLevelDisplayName,
  getPositionDisplayName,
  getPreferredFootDisplayName,
  PlayerListItem,
  PlayersFilters,
} from "@/types/player";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function PlayersSection() {
  const router = useRouter();

  const [players, setPlayers] = useState<PlayerListItem[]>([]);
  const [provinces, setProvinces] = useState<Array<{ id: number; name: string }>>([]);
  const [pagination, setPagination] = useState({ page: 0, totalPages: 0, total: 0, pageSize: 20 });
  const [filters, setFilters] = useState<Partial<PlayersFilters>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [searchInput, setSearchInput] = useState("");
  const [showSortMenu, setShowSortMenu] = useState(false);
  const [viewMode, setViewMode] = useState<"list" | "card">("list");

  useEffect(() => {
    provinceService.getAllProvinces().then(setProvinces).catch(console.error);
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      setFilters((prev) => ({ ...prev, search: searchInput || undefined }));
      setPagination((prev) => ({ ...prev, page: 0 }));
    }, 500);
    return () => clearTimeout(timer);
  }, [searchInput]);

  useEffect(() => {
    setIsLoading(true);
    playerService
      .getPlayers(pagination.page, pagination.pageSize, filters)
      .then((response) => {
        setPlayers(response.data);
        setPagination((prev) => ({ ...prev, totalPages: response.totalPages, total: response.total }));
      })
      .catch(console.error)
      .finally(() => setIsLoading(false));
  }, [filters, pagination.page]);

  const handleFilterChange = (key: keyof PlayersFilters, value: any) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
    setPagination((prev) => ({ ...prev, page: 0 }));
  };

  const handleSortChange = (sortBy: string, sortOrder: "asc" | "desc") => {
    if (sortBy === "") {
      setFilters((prev) => { const { sortBy, sortOrder, ...rest } = prev; return rest; });
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

  const handleRowClick = (userid: string) => {
    router.push(`/profile/${userid}?from=players`);
  };

  const hasFilters = !!(searchInput || filters.positions?.length || filters.provinceId || filters.level || filters.preferredFoot || filters.sortBy);

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-xl font-bold text-gray-900">Danh sách cầu thủ đăng ký</h3>
          <p className="text-sm text-gray-500">Tìm kiếm và khám phá cầu thủ tham gia chương trình</p>
        </div>
      </div>

      {/* Filters */}
      <div className="mb-4">
        {/* Mobile: Search + Sort + View */}
        <div className="md:hidden flex gap-2 mb-3">
          <input
            type="text"
            placeholder="Tìm kiếm theo tên..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
          />
          <div className="relative">
            <button onClick={() => setShowSortMenu(!showSortMenu)} className="p-2 border border-gray-300 rounded-md hover:bg-gray-50">
              <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4h13M3 8h9m-9 4h6m4 0l4-4m0 0l4 4m-4-4v12" />
              </svg>
            </button>
            {showSortMenu && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setShowSortMenu(false)} />
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-xl border border-gray-200 py-2 z-20">
                  {[["", "asc", "Không sắp xếp"], ["fullName", "asc", "Tên (A→Z)"], ["fullName", "desc", "Tên (Z→A)"], ["createdAt", "desc", "Mới nhất"]].map(([sb, so, label]) => (
                    <button key={label} onClick={() => { handleSortChange(sb, so as "asc" | "desc"); setShowSortMenu(false); }}
                      className="w-full text-left px-4 py-2 text-sm hover:bg-gray-50 text-gray-700">{label}</button>
                  ))}
                </div>
              </>
            )}
          </div>
          <button onClick={() => setViewMode(viewMode === "list" ? "card" : "list")} className="p-2 border border-gray-300 rounded-md hover:bg-gray-50">
            <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={viewMode === "list" ? "M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" : "M4 6h16M4 12h16M4 18h16"} />
            </svg>
          </button>
        </div>

        {/* Mobile: Filter chips */}
        <div className="md:hidden flex gap-2 overflow-x-auto pb-2">
          {(["striker:Tiền đạo", "midfielder:Tiền vệ", "defender:Hậu vệ", "centerback:Trung vệ", "goalkeeper:Thủ môn"] as string[]).map((p) => {
            const [val, label] = p.split(":");
            return (
              <button key={val} onClick={() => handleFilterChange("positions", filters.positions?.[0] === val ? [] : [val])}
                className={`flex-shrink-0 px-3 py-1 rounded-full text-xs border transition ${filters.positions?.[0] === val ? "bg-green-700 text-white border-green-700" : "bg-white text-gray-600 border-gray-300"}`}>
                {label}
              </button>
            );
          })}
        </div>

        {/* Desktop: Search + Sort + View */}
        <div className="hidden md:flex gap-2 mb-3">
          <input
            type="text"
            placeholder="Tìm kiếm theo tên cầu thủ..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
          />
          <select value={filters.sortBy ? `${filters.sortBy}-${filters.sortOrder}` : ""}
            onChange={(e) => { if (!e.target.value) { handleSortChange("", "asc"); } else { const [s, o] = e.target.value.split("-"); handleSortChange(s, o as "asc" | "desc"); } }}
            className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-green-500">
            <option value="">Không sắp xếp</option>
            <option value="fullName-asc">Tên (A→Z)</option>
            <option value="fullName-desc">Tên (Z→A)</option>
            <option value="dob-asc">Tuổi (Tăng)</option>
            <option value="dob-desc">Tuổi (Giảm)</option>
            <option value="height-desc">Chiều cao (Cao→Thấp)</option>
          </select>
          <button onClick={() => setViewMode(viewMode === "list" ? "card" : "list")} className="p-2 border border-gray-300 rounded-md hover:bg-gray-50">
            <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={viewMode === "list" ? "M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" : "M4 6h16M4 12h16M4 18h16"} />
            </svg>
          </button>
        </div>

        {/* Desktop: Filters */}
        <div className="hidden md:grid grid-cols-4 gap-3 mb-3">
          <select value={filters.positions?.[0] || ""} onChange={(e) => handleFilterChange("positions", e.target.value ? [e.target.value] : [])}
            className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-green-500">
            <option value="">Tất cả vị trí</option>
            <option value="striker">Tiền đạo</option>
            <option value="midfielder">Tiền vệ</option>
            <option value="defender">Hậu vệ</option>
            <option value="centerback">Trung vệ</option>
            <option value="goalkeeper">Thủ môn</option>
          </select>
          <select value={filters.provinceId || ""} onChange={(e) => handleFilterChange("provinceId", e.target.value ? parseInt(e.target.value) : null)}
            className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-green-500">
            <option value="">Tất cả tỉnh/thành</option>
            {provinces.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
          <select value={filters.level || ""} onChange={(e) => handleFilterChange("level", e.target.value || null)}
            className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-green-500">
            <option value="">Tất cả cấp độ</option>
            <option value="CAU_THU_MOI">Cầu thủ mới</option>
            <option value="NGHIEP_DU">Nghiệp dư</option>
            <option value="TUYEN_TRE">Tuyển trẻ</option>
            <option value="CHUYEN_NGHIEP">Chuyên nghiệp</option>
          </select>
          <select value={filters.preferredFoot || ""} onChange={(e) => handleFilterChange("preferredFoot", e.target.value || null)}
            className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-green-500">
            <option value="">Chân thuận</option>
            <option value="left">Trái</option>
            <option value="right">Phải</option>
            <option value="both">Cả hai</option>
          </select>
        </div>

        {hasFilters && (
          <div className="flex justify-end mt-1">
            <button onClick={handleClearFilters} className="px-3 py-1.5 text-xs text-red-600 hover:bg-red-50 rounded-md transition flex items-center gap-1">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              Xóa bộ lọc
            </button>
          </div>
        )}
      </div>

      {/* Result count */}
      <div className="mb-4 text-sm text-gray-600">
        Tìm thấy <span className="font-semibold">{pagination.total}</span> cầu thủ
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="p-8 text-center text-gray-500 bg-white rounded-lg shadow">Đang tải...</div>
      ) : players.length === 0 ? (
        <div className="p-8 text-center text-gray-500 bg-white rounded-lg shadow">Không tìm thấy cầu thủ nào</div>
      ) : (
        <>
          {/* Desktop */}
          <div className="hidden md:block">
            {viewMode === "list" ? (
              <div className="bg-white rounded-lg shadow overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 border-b">
                      <tr>
                        {["Chỉ số", "Avatar", "Tên", "Tuổi", "Chiều cao", "Cân nặng", "Vị trí", "Chân thuận", "Cấp độ", "Tỉnh/TP"].map((h) => (
                          <th key={h} className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {players.map((player) => (
                        <tr key={player.id} onClick={() => handleRowClick(player.userid)} className="hover:bg-gray-50 cursor-pointer transition">
                          <td className="px-4 py-3">
                            {(player.attributes?.length ?? 0) > 0 ? <HexagonChart attributes={player.attributes!} size={60} showLabels={false} /> : <div className="w-[60px] h-[60px]" />}
                          </td>
                          <td className="px-4 py-3">
                            {player.avatar ? <img src={player.avatar} alt={player.fullName} className="w-10 h-10 rounded-full object-cover" /> : <div className="w-10 h-10 rounded-full bg-green-700 flex items-center justify-center text-sm font-bold text-white">{player.fullName?.charAt(0) || "?"}</div>}
                          </td>
                          <td className="px-4 py-3 text-sm font-medium text-gray-900">{player.fullName}</td>
                          <td className="px-4 py-3 text-sm text-gray-600">{player.age || "N/A"}</td>
                          <td className="px-4 py-3 text-sm text-gray-600">{player.height ? `${player.height} cm` : "N/A"}</td>
                          <td className="px-4 py-3 text-sm text-gray-600">{player.weight ? `${player.weight} kg` : "N/A"}</td>
                          <td className="px-4 py-3">
                            <div className="flex gap-1 flex-wrap">
                              {player.positions.slice(0, 2).map((pos) => <span key={pos} className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">{getPositionDisplayName(pos)}</span>)}
                              {player.positions.length > 2 && <span className="px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600">+{player.positions.length - 2}</span>}
                            </div>
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-600">{player.preferredFoot ? getPreferredFootDisplayName(player.preferredFoot) : "N/A"}</td>
                          <td className="px-4 py-3 text-sm text-gray-600">{player.level ? getLevelDisplayName(player.level) : "N/A"}</td>
                          <td className="px-4 py-3 text-sm text-gray-600">{player.provinceName || "N/A"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {players.map((player) => (
                  <div key={player.id} onClick={() => handleRowClick(player.userid)} className="cursor-pointer hover:scale-105 transition-transform">
                    <PlayerCard avatar={player.avatar} fullName={player.fullName} positions={player.positions} preferredFoot={player.preferredFoot} attributes={player.attributes} className="w-full" />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Mobile */}
          <div className="md:hidden">
            {viewMode === "list" ? (
              <div className="bg-white rounded-lg shadow divide-y divide-gray-200">
                {players.map((player) => (
                  <div key={player.id} onClick={() => handleRowClick(player.userid)} className="p-4 hover:bg-gray-50 cursor-pointer transition">
                    <div className="flex items-start gap-3 mb-3">
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        {player.avatar ? <img src={player.avatar} alt={player.fullName} className="w-12 h-12 rounded-full object-cover flex-shrink-0" /> : <div className="w-12 h-12 rounded-full bg-green-700 flex items-center justify-center text-lg font-bold text-white flex-shrink-0">{player.fullName?.charAt(0) || "?"}</div>}
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-gray-900 truncate">{player.fullName}</h3>
                          <p className="text-sm text-gray-500">{player.age ? `${player.age} tuổi` : "N/A"} • {player.height ? `${player.height} cm` : "N/A"}</p>
                        </div>
                      </div>
                      <div className="flex-shrink-0">
                        {(player.attributes?.length ?? 0) > 0 ? <HexagonChart attributes={player.attributes!} size={50} showLabels={false} /> : <div className="w-[50px] h-[50px]" />}
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div><span className="text-gray-500">Vị trí:</span> <span className="font-medium">{player.positions.length > 0 ? player.positions.map(getPositionDisplayName).join(", ") : "N/A"}</span></div>
                      <div><span className="text-gray-500">Chân:</span> <span className="font-medium">{player.preferredFoot ? getPreferredFootDisplayName(player.preferredFoot) : "N/A"}</span></div>
                      <div><span className="text-gray-500">Tỉnh/TP:</span> <span className="font-medium">{player.provinceName || "N/A"}</span></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                {players.map((player) => (
                  <div key={player.id} onClick={() => handleRowClick(player.userid)} className="cursor-pointer hover:scale-105 transition-transform">
                    <PlayerCard avatar={player.avatar} fullName={player.fullName} positions={player.positions} preferredFoot={player.preferredFoot} attributes={player.attributes} className="w-full" />
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
          <button onClick={() => setPagination((p) => ({ ...p, page: p.page - 1 }))} disabled={pagination.page === 0}
            className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed">
            ← Trước
          </button>
          <div className="flex items-center gap-2">
            {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
              let p = pagination.totalPages <= 5 ? i : pagination.page < 3 ? i : pagination.page > pagination.totalPages - 4 ? pagination.totalPages - 5 + i : pagination.page - 2 + i;
              return (
                <button key={p} onClick={() => setPagination((prev) => ({ ...prev, page: p }))}
                  className={`px-3 py-1 rounded-md text-sm font-medium ${pagination.page === p ? "bg-green-600 text-white" : "text-gray-700 hover:bg-gray-100"}`}>
                  {p + 1}
                </button>
              );
            })}
          </div>
          <button onClick={() => setPagination((p) => ({ ...p, page: p.page + 1 }))} disabled={pagination.page >= pagination.totalPages - 1}
            className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed">
            Sau →
          </button>
        </div>
      )}
    </div>
  );
}
