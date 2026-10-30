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
