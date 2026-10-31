export const EVENT_STATUS: Record<string, { label: string; tone: 'green' | 'gold' | 'red' | 'gray' }> = {
  PLAN: { label: 'Lên kế hoạch', tone: 'gray' },
  OPEN_REGISTER: { label: 'Đang mở đăng ký', tone: 'green' },
  CLOSE_REGISTER: { label: 'Đóng đăng ký', tone: 'gold' },
  COMPLETE: { label: 'Hoàn thành', tone: 'gray' },
  CANCELLED: { label: 'Đã huỷ', tone: 'red' },
  DELETED: { label: 'Đã xoá', tone: 'red' },
};

export const fmtDate = (d?: string | null) => (d ? d.split('-').reverse().join('/') : '');
export const fmtDateTime = (d?: string | null) => {
  if (!d) return '';
  const [date, time] = d.split('T');
  return `${fmtDate(date)} ${time ? time.slice(0, 5) : ''}`.trim();
};

export const POSITIONS: Record<string, string> = {
  striker: 'Tiền đạo',
  midfielder: 'Tiền vệ',
  defender: 'Hậu vệ',
  goalkeeper: 'Thủ môn',
};
export const LEVELS: Record<string, string> = {
  CAU_THU_MOI: 'Cầu thủ mới',
  NGHIEP_DU: 'Nghiệp dư',
  TUYEN_TRE: 'Tuyển trẻ',
  CHUYEN_NGHIEP: 'Chuyên nghiệp',
};
export const ACHIEVEMENT_TYPES: Record<string, string> = {
  INDIVIDUAL: 'Cá nhân',
  TEAM: 'Tập thể',
  PARTICIPANT: 'Tham gia',
};
export const APPROVAL: Record<string, { label: string; tone: 'green' | 'gold' | 'red' | 'gray' }> = {
  PENDING: { label: 'Chờ duyệt', tone: 'gold' },
  APPROVED: { label: 'Đã duyệt', tone: 'green' },
  REJECTED: { label: 'Từ chối', tone: 'red' },
};
export const FEET: Record<string, string> = { left: 'Chân trái', right: 'Chân phải', both: 'Hai chân' };

export const COMP_STATUS: Record<string, { label: string; tone: 'green' | 'gold' | 'red' | 'gray' }> = {
  DRAFT: { label: 'Nháp', tone: 'gray' },
  REGISTRATION_OPEN: { label: 'Đang mở đăng ký', tone: 'green' },
  REGIONAL_AUDITION: { label: 'Vòng tuyển trạch', tone: 'green' },
  SELECTING_TOP30: { label: 'Chọn Top 30', tone: 'gold' },
  TRAINING_PHASE: { label: 'Giai đoạn tập huấn', tone: 'gold' },
  FINAL_PHASE: { label: 'Chung kết', tone: 'gold' },
  COMPLETED: { label: 'Đã kết thúc', tone: 'gray' },
};
export const STAGE_TYPES: Record<string, string> = {
  REGIONAL_AUDITION: 'Tuyển trạch khu vực',
  TRAINING_EPISODE: 'Tập huấn (nội bộ)',
  FINAL_MATCH: 'Chung kết',
};
export const STAGE_STATUS: Record<string, { label: string; tone: 'green' | 'gold' | 'red' | 'gray' }> = {
  UPCOMING: { label: 'Sắp diễn ra', tone: 'gray' },
  LIVE: { label: 'Đang diễn ra', tone: 'green' },
  COMPLETED: { label: 'Đã xong', tone: 'gold' },
};
export const REGIONS: Record<string, string> = {
  HANOI_NORTH: 'Hà Nội & Miền Bắc',
  DANANG_CENTRAL: 'Đà Nẵng & Miền Trung',
  HCMC_SOUTH: 'TP HCM & Miền Nam',
};
export const PARTICIPANT_STATUS: Record<string, { label: string; tone: 'green' | 'gold' | 'red' | 'gray' }> = {
  REGISTERED: { label: 'Đã đăng ký', tone: 'gray' },
  CHECKED_IN: { label: 'Đã check-in', tone: 'green' },
  SELECTED_TOP30: { label: 'Top 30', tone: 'gold' },
  SELECTED_TOP11: { label: 'Top 11', tone: 'green' },
  ELIMINATED: { label: 'Bị loại', tone: 'red' },
  WITHDRAWN: { label: 'Đã rút', tone: 'gray' },
};

export const ROLES: Record<string, string> = {
  USER: 'Người dùng',
  PLAYER: 'Cầu thủ',
  COACH: 'Huấn luyện viên',
  SCOUTER: 'Tuyển trạch viên',
  EDITOR: 'Biên tập viên',
  MEDICAL: 'Y tế',
  ADMIN: 'Admin',
};
export const STAFF_ROLE_KEYS = ['EDITOR', 'MEDICAL', 'ADMIN', 'COACH', 'SCOUTER'];

export const FLAG_KINDS: Record<string, { label: string; tone: 'red' | 'gold' | 'gray' | 'green' }> = {
  MEDICAL_OUT: { label: 'Y tế: không đủ điều kiện', tone: 'red' },
  DISCIPLINE: { label: 'Vi phạm kỷ luật', tone: 'gold' },
  LOW_PERFORMANCE: { label: 'Low Performance', tone: 'gold' },
  DNS: { label: 'Không thi', tone: 'gray' },
};
export const PARTICIPATION: Record<string, string> = { FULL: 'Đủ', PARTIAL: 'Một phần', NONE: 'Không' };
export const CHANNELS: Record<string, string> = { EMAIL: 'Email', IN_APP: 'Trong ứng dụng', INAPP: 'Trong ứng dụng', ZNS: 'Zalo ZNS' };
