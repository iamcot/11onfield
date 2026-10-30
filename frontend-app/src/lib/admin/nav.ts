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

const STAFF: AdminRole[] = ['EDITOR', 'ADMIN', 'SUPER_USER'];
const MANAGERS: AdminRole[] = ['ADMIN', 'SUPER_USER'];

export const NAV: NavItem[] = [
  { label: 'Tổng quan', href: '/quan-tri', roles: STAFF },
  { label: 'Giải đấu', href: '/quan-tri/giai-dau', roles: [...MANAGERS, 'EDITOR'] },
  { label: 'Chấm điểm', href: '/quan-tri/cham-diem', roles: [...MANAGERS, 'BGK'] },
  { label: 'Check-in', href: '/quan-tri/check-in', roles: [...STAFF, 'BGK'] },
  { label: 'Cầu thủ', href: '/quan-tri/cau-thu', roles: STAFF, badge: 'unverifiedPlayers' },
  { label: 'Chờ duyệt', href: '/quan-tri/duyet', roles: STAFF, badge: 'pendingApprovals' },
  { label: 'Sự kiện', href: '/quan-tri/su-kien', roles: STAFF },
  { label: 'Loại chỉ số', href: '/quan-tri/loai-chi-so', roles: MANAGERS },
  { label: 'Thông báo', href: '/quan-tri/thong-bao', roles: MANAGERS },
  { label: 'Tài khoản', href: '/quan-tri/tai-khoan', roles: ['SUPER_USER'] },
];
