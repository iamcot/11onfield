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
