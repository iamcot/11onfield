import { apiClient } from "@/lib/api-client";
import { PaginatedResponse } from "@/types/api";
import { PlayerListItem, PlayersFilters } from "@/types/player";
import { storage } from "@/lib/storage";

export const playerService = {
  /**
   * Get paginated list of players with optional filters
   *
   * @param page Page number (0-indexed)
   * @param size Page size
   * @param filters Optional filters for search, position, province, level, foot, sorting
   * @returns Paginated response with player list
   */
  async getPlayers(
    page: number = 0,
    size: number = 20,
    filters: Partial<PlayersFilters> = {}
  ): Promise<PaginatedResponse<PlayerListItem>> {
    const token = storage.getToken();

    // Build query params
    const params = new URLSearchParams();
    params.append("page", page.toString());
    params.append("size", size.toString());

    if (filters.search) params.append("search", filters.search);
    if (filters.positions && filters.positions.length > 0) {
      filters.positions.forEach((pos) => params.append("positions", pos));
    }
    if (filters.provinceId) params.append("provinceId", filters.provinceId.toString());
    if (filters.level) params.append("level", filters.level);
    if (filters.preferredFoot) params.append("preferredFoot", filters.preferredFoot);
    if (filters.sortBy) {
      params.append("sortBy", filters.sortBy);
      params.append("sortOrder", filters.sortOrder || "asc");
    }

    // Include Authorization header only if token exists
    const headers: Record<string, string> = {};
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    const response = await apiClient.get<any>(`/users/players?${params.toString()}`, {
      headers,
    });

    // Transform Spring Boot Page to PaginatedResponse
    return {
      data: response.content,
      total: response.totalElements,
      page: response.number,
      pageSize: response.size,
      totalPages: response.totalPages,
    };
  },
};
