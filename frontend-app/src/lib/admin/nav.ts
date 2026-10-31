import type { AdminRole } from './session';

export interface NavItem {
  label: string;
  /** New Next.js page; when absent the item opens the old admin page (`legacy`). */
  href?: string;
  legacy?: string;
  roles: AdminRole[];
  /** Key of the count from /badges shown next to the item. */
  badge?: 'pendingApprovals' | 'unverifiedPlayers';
}

const STAFF: AdminRole[] = ['EDITOR', 'ADMIN'];
const MANAGERS: AdminRole[] = ['ADMIN'];
const PANEL: AdminRole[] = ['HLV', 'TTV'];

export const NAV: NavItem[] = [
  { label: 'Tổng quan', href: '/quan-tri', roles: STAFF },
  { label: 'Giải đấu', href: '/quan-tri/giai-dau', roles: [...MANAGERS, 'EDITOR'] },
  { label: 'Check-in', href: '/quan-tri/check-in', roles: [...STAFF, ...PANEL] },
  { label: 'Chấm điểm tại trạm', href: '/quan-tri/cham-diem', roles: [...MANAGERS, ...PANEL] },
  { label: 'Ghi nhận thí sinh', href: '/quan-tri/ghi-nhan', roles: PANEL },
  { label: 'Thí sinh', href: '/quan-tri/thi-sinh', roles: [...MANAGERS, ...PANEL, 'MEDICAL'] },
  { label: 'Chọn Top 30', href: '/quan-tri/chon-top-30', roles: PANEL },
  { label: 'Cầu thủ', href: '/quan-tri/cau-thu', roles: STAFF, badge: 'unverifiedPlayers' },
  { label: 'Chờ duyệt', href: '/quan-tri/duyet', roles: STAFF, badge: 'pendingApprovals' },
  { label: 'Sự kiện', href: '/quan-tri/su-kien', roles: STAFF },
  { label: 'Loại chỉ số', href: '/quan-tri/loai-chi-so', roles: MANAGERS },
  { label: 'Thông báo', href: '/quan-tri/thong-bao', roles: MANAGERS },
  { label: 'Tài khoản', href: '/quan-tri/tai-khoan', roles: MANAGERS },
];
