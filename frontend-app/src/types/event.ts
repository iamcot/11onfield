export type EventStatus =
  | "PLAN"
  | "OPEN_REGISTER"
  | "CLOSE_REGISTER"
  | "COMPLETE"
  | "CANCELLED"
  | "DELETED";

export interface EventListItem {
  id: number;
  title: string;
  picture: string | null;
  shortContent: string | null;
  startDate: string; // ISO date
  startTime: string | null; // HH:mm format
  endDate: string; // ISO date
  endTime: string | null; // HH:mm format
  location: string | null;
  provinceName: string | null;
  status: EventStatus;
  participantCount: number;
}

export interface EventDetail {
  id: number;
  title: string;
  picture: string | null;
  shortContent: string | null;
  content: string | null;
  startDate: string;
  startTime: string | null;
  endDate: string;
  endTime: string | null;
  location: string | null;
  provinceName: string | null;
  status: EventStatus;
  participantCount: number;
}

export interface EventsFilters {
  search: string;
  status: EventStatus | "";
  provinceId: string;
  sortBy: string;
  sortOrder: "asc" | "desc";
}

export function getStatusDisplayName(status: EventStatus): string {
  const statusMap: Record<EventStatus, string> = {
    PLAN: "Đang lên kế hoạch",
    OPEN_REGISTER: "Đang mở đăng ký",
    CLOSE_REGISTER: "Đóng đăng ký",
    COMPLETE: "Hoàn thành",
    CANCELLED: "Hủy bỏ",
    DELETED: "Đã xóa",
  };
  return statusMap[status] || status;
}

export function getStatusBadgeColor(status: EventStatus): string {
  const colorMap: Record<EventStatus, string> = {
    PLAN: "bg-gray-500",
    OPEN_REGISTER: "bg-green-600",
    CLOSE_REGISTER: "bg-yellow-600",
    COMPLETE: "bg-blue-500",
    CANCELLED: "bg-red-600",
    DELETED: "bg-gray-400",
  };
  return colorMap[status] || "bg-gray-500";
}
