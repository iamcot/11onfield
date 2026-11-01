export type EventStatus =
  | "PLAN"
  | "OPEN_REGISTER"
  | "CLOSE_REGISTER"
  | "COMPLETE"
  | "CANCELLED"
  | "DELETED";

/** GENERAL: information only. RECRUITMENT (Tuyển sinh): players apply through a form. */
export type EventType = "GENERAL" | "RECRUITMENT";

export type FormFieldType =
  | "text" | "textarea" | "number" | "date" | "email" | "phone"
  | "select" | "radio" | "checkboxes" | "agree" | "heading"
  | "image" | "link";

/** One field of a recruitment event's form. `source` names the profile field it is filled from. */
export interface FormField {
  id: string;
  type: FormFieldType;
  label: string;
  required?: boolean | null;
  help?: string | null;
  options?: string[] | null;
  source?: string | null;
}

export interface RegistrationAnswer {
  id: string;
  type: FormFieldType;
  label: string;
  value: string | null;
}

export type RegistrationStatus = "SUBMITTED" | "FORWARDED";

export interface MyRegistration {
  id: number;
  status: RegistrationStatus;
  answers: RegistrationAnswer[];
  createdAt: string;
  updatedAt: string;
  forwardedAt: string | null;
}

export interface RegistrationForm {
  fields: FormField[];
  prefill: Record<string, string>;
  open: boolean;
  partnerName: string | null;
  registration: MyRegistration | null;
}

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
  eventType?: EventType;
  partnerName?: string | null;
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
  eventType?: EventType;
  partnerName?: string | null;
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
