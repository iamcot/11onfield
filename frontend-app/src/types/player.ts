export type PlayerLevel = "CAU_THU_MOI" | "NGHIEP_DU" | "TUYEN_TRE" | "CHUYEN_NGHIEP";

export interface PlayerListItem {
  id: number;
  userid: string;
  fullName: string;
  avatar: string | null;
  age: number | null;
  height: number | null;
  weight: number | null;
  positions: string[];
  preferredFoot: string | null;
  level: PlayerLevel | null;
  provinceName: string | null;
  academyId: number | null;
  followerCount: number;
}

export interface PlayersFilters {
  search: string;
  positions: string[];
  provinceId: number | null;
  level: PlayerLevel | null;
  preferredFoot: string | null;
  sortBy: string | null;
  sortOrder: "asc" | "desc" | null;
}

// Helper function to get display name for level
export function getLevelDisplayName(level: PlayerLevel | null): string {
  if (!level) return "N/A";

  const levelMap: Record<PlayerLevel, string> = {
    CAU_THU_MOI: "Cầu thủ mới",
    NGHIEP_DU: "Nghiệp dư",
    TUYEN_TRE: "Tuyển trẻ",
    CHUYEN_NGHIEP: "Chuyên nghiệp",
  };

  return levelMap[level];
}

// Helper function to get display name for position
export function getPositionDisplayName(position: string): string {
  const positionMap: Record<string, string> = {
    striker: "Tiền đạo",
    midfielder: "Tiền vệ",
    centerback: "Trung vệ",
    defender: "Hậu vệ",
    goalkeeper: "Thủ môn",
  };

  return positionMap[position] || position;
}

// Helper function to get display name for preferred foot
export function getPreferredFootDisplayName(foot: string | null): string {
  if (!foot) return "N/A";

  const footMap: Record<string, string> = {
    left: "Trái",
    right: "Phải",
    both: "Cả hai",
  };

  return footMap[foot] || foot;
}
