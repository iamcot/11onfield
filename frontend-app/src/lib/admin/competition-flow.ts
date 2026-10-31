/**
 * The steps of a competition, in the order an admin works through them. The bar on top of every competition screen
 * is drawn from this list, so each screen has exactly one place in it. See plans/02-tuyen-trach-vong-1/05-dieu-huong-giai.md.
 */
export type PhaseKey = 'prep' | 'day' | 'after' | 'content';

export interface FlowStep {
  id: string;
  label: string;
  phase: PhaseKey;
  /** Work done once per round: the link follows the round picker. */
  perRound?: boolean;
  /** Only the admin does this step; panel members and editors do not see it. */
  managerOnly?: boolean;
  /** Path under /quan-tri/giai-dau/{id}; `{n}` is the chosen round. */
  path: string;
}

export const PHASES: { key: PhaseKey; title: string; when: string }[] = [
  { key: 'prep', title: 'Chuẩn bị', when: 'Trước ngày thi' },
  { key: 'day', title: 'Ngày thi', when: 'Trên tablet tại sân' },
  { key: 'after', title: 'Sau khi thi', when: 'Chốt điểm, chọn người' },
  { key: 'content', title: 'Nội dung giải', when: '' },
];

export const STEPS: FlowStep[] = [
  { id: 'thong-tin', label: 'Thông tin giải', phase: 'prep', path: '' },
  { id: 'thi-sinh', label: 'Thí sinh và SBD', phase: 'prep', path: '/thi-sinh' },
  { id: 'danh-sach-vong', label: 'Danh sách vòng', phase: 'prep', path: '/vong' },
  { id: 'hoi-dong', label: 'Hội đồng tuyển trạch', phase: 'prep', path: '/hoi-dong', managerOnly: true },
  { id: 'bai-thi', label: 'Bài thi và thang điểm', phase: 'prep', perRound: true, path: '/vong/{n}' },
  { id: 'kich-hoat', label: 'Kích hoạt vòng', phase: 'prep', perRound: true, path: '/vong/{n}/kich-hoat', managerOnly: true },
  { id: 'check-in', label: 'Check-in', phase: 'day', perRound: true, path: '/vong/{n}/check-in' },
  { id: 'cham-diem', label: 'Chấm điểm tại trạm', phase: 'day', perRound: true, path: '/vong/{n}/cham-diem' },
  { id: 'ghi-nhan', label: 'Ghi nhận thí sinh', phase: 'day', perRound: true, path: '/vong/{n}/ghi-nhan' },
  { id: 'doi-soat', label: 'Đối soát và khoá sổ', phase: 'after', perRound: true, path: '/vong/{n}/doi-soat' },
  { id: 'ket-qua', label: 'Kết quả vòng', phase: 'after', perRound: true, path: '/vong/{n}/ket-qua' },
  { id: 'xep-hang', label: 'Xếp hạng 3 khu vực', phase: 'after', path: '/xep-hang' },
  { id: 'top-30', label: 'Top 30 và Green Card', phase: 'after', path: '/tuyen-chon' },
  { id: 'phat-hanh', label: 'Phát hành kết quả', phase: 'after', path: '/hien-thi', managerOnly: true },
  { id: 'tin-tuc', label: 'Tin tức', phase: 'content', path: '/tin-tuc', managerOnly: true },
  { id: 'nha-tai-tro', label: 'Nhà tài trợ', phase: 'content', path: '/nha-tai-tro', managerOnly: true },
];

export const competitionBase = (id: string | number) => `/quan-tri/giai-dau/${id}`;

export function stepHref(step: FlowStep, id: string | number, n: number | string | null) {
  return competitionBase(id) + step.path.replace('{n}', String(n ?? 1));
}

/** The step a path belongs to: the longest step path that is a prefix of it (so /vong/1/doi-soat is not "Bài thi"). */
export function stepOfPath(pathname: string, id: string | number): FlowStep | null {
  const base = competitionBase(id);
  if (!pathname.startsWith(base)) return null;
  const rest = pathname.slice(base.length).replace(/\/vong\/\d+/, '/vong/{n}').replace('/bien-ban', '/ket-qua');
  let best: FlowStep | null = null;
  for (const s of STEPS) {
    const match = s.path === '' ? rest === '' : rest === s.path || rest.startsWith(s.path + '/');
    if (match && (!best || s.path.length > best.path.length)) best = s;
  }
  return best;
}

/** The round in a path such as /quan-tri/giai-dau/3/vong/2/doi-soat. */
export function roundOfPath(pathname: string): number | null {
  const m = pathname.match(/\/giai-dau\/\d+\/vong\/(\d+)/);
  return m ? Number(m[1]) : null;
}
