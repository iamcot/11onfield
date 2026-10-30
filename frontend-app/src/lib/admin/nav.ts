import type { AdminRole } from './session';

export interface NavItem {
  label: string;
  /** New Next.js page; when absent the item opens the old admin page (`legacy`). */
  href?: string;
  legacy?: string;
  roles: AdminRole[];
}

const STAFF: AdminRole[] = ['EDITOR', 'ADMIN', 'SUPER_USER'];
const MANAGERS: AdminRole[] = ['ADMIN', 'SUPER_USER'];

export const NAV: NavItem[] = [
  { label: 'Tổng quan', href: '/quan-tri', roles: STAFF },
  { label: 'Giải đấu', href: '/quan-tri/giai-dau', roles: [...MANAGERS, 'EDITOR'] },
  { label: 'Chấm điểm', legacy: '/admin/field-scoring', roles: [...MANAGERS, 'BGK'] },
  { label: 'Cầu thủ', legacy: '/admin/players', roles: STAFF },
  { label: 'Sự kiện', href: '/quan-tri/su-kien', roles: STAFF },
  { label: 'Loại chỉ số', legacy: '/admin/attribute-types', roles: MANAGERS },
  { label: 'Thông báo', legacy: '/admin/notifications', roles: MANAGERS },
  { label: 'Zalo ZNS', legacy: '/admin/zns', roles: MANAGERS },
  { label: 'Tài khoản', legacy: '/admin/users', roles: ['SUPER_USER'] },
];
