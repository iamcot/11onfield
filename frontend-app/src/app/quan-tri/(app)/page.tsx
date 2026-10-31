import { adminGet, getMe } from '@/lib/admin/server';
import { ROLE_LABEL } from '@/lib/admin/session';

interface Dashboard {
  totalPlayers: number;
  totalUsers: number;
  totalEvents: number;
  upcomingEvents: { id: number; title: string; startDate: string | null; location: string | null }[];
  competition?: {
    season: number;
    totalParticipants: number;
    byStatus: Record<string, number>;
    byRegion: Record<string, number>;
  };
}

const STATUS_LABEL: Record<string, string> = {
  REGISTERED: 'Đã đăng ký',
  CHECKED_IN: 'Đã check-in',
  SELECTED_TOP30: 'Top 30',
  SELECTED_TOP11: 'Top 11',
  ELIMINATED: 'Bị loại',
};
const REGION_LABEL: Record<string, string> = {
  HANOI_NORTH: 'Hà Nội / miền Bắc',
  DANANG_CENTRAL: 'Đà Nẵng / miền Trung',
  HCMC_SOUTH: 'TP.HCM / miền Nam',
};

function Stat({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="relative overflow-hidden rounded-lg border border-[#DCE5DF] bg-white p-4 shadow-[0_1px_2px_rgba(16,35,26,0.06)]">
      <span className="absolute inset-y-0 left-0 w-1 bg-gradient-to-b from-[#A6E35A] to-[#1F7A3A]" aria-hidden="true" />
      <div className="font-[family-name:var(--font-hud)] text-[11px] font-semibold uppercase tracking-[0.12em] text-[#66766D]">{label}</div>
      <div className="mt-1 font-[family-name:var(--font-display)] text-[40px] font-bold leading-none tabular-nums text-[#0F3324]">{value.toLocaleString('vi-VN')}</div>
    </div>
  );
}

function Breakdown({ title, rows }: { title: string; rows: [string, number][] }) {
  return (
    <section className="rounded-lg border border-[#DCE5DF] bg-white p-4 shadow-[0_1px_2px_rgba(16,35,26,0.06)]">
      <h2 className="mb-3 text-[13px] font-semibold uppercase tracking-wider text-[#46564D]">{title}</h2>
      <ul className="divide-y divide-[#E6ECE8] text-[14px]">
        {rows.map(([name, n]) => (
          <li key={name} className="flex justify-between py-2">
            <span>{name}</span>
            <span className="tabular-nums text-[#1F6B32]">{n}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}

export default async function AdminDashboardPage() {
  const me = await getMe();
  if (me.role === 'BGK') {
    return (
      <>
        <h1 className="text-2xl font-semibold">Xin chào, {me.fullName || 'Ban giám khảo'}</h1>
        <p className="mt-2 max-w-xl text-[#46564D]">Bạn có quyền nhập điểm thi tại sân.</p>
        <a href="/quan-tri/cham-diem" className="mt-4 inline-block bg-[#0F3324] px-5 py-3 font-medium text-[#D6FA9E]">Mở màn hình chấm điểm</a>
      </>
    );
  }

  if (me.role === 'MEDICAL' || me.role === 'COORDINATOR') {
    return (
      <>
        <h1 className="text-2xl font-semibold">Xin chào, {me.fullName || ROLE_LABEL[me.role]}</h1>
        <p className="mt-2 max-w-xl text-[#46564D]">
          {me.role === 'MEDICAL' ? 'Bạn có quyền đặt cờ "không đủ điều kiện" cho thí sinh.' : 'Bạn có quyền ghi nhận vi phạm kỷ luật của thí sinh.'}
        </p>
        <a href="/quan-tri/thi-sinh" className="mt-4 inline-block bg-[#0F3324] px-5 py-3 font-medium text-[#D6FA9E]">Tìm thí sinh</a>
      </>
    );
  }

  const { data } = await adminGet<Dashboard>('dashboard');
  if (!data) return <p className="text-[#B42318]">Không tải được số liệu tổng quan. Thử tải lại trang.</p>;

  return (
    <>
      <h1 className="text-[24px] font-semibold tracking-tight text-[#0F2A1C]">Tổng quan</h1>
      <div className="mt-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat label="Cầu thủ" value={data.totalPlayers} />
        <Stat label="Tài khoản" value={data.totalUsers} />
        <Stat label="Sự kiện" value={data.totalEvents} />
        <Stat label={data.competition ? `Hồ sơ mùa ${data.competition.season}` : 'Hồ sơ'} value={data.competition?.totalParticipants ?? 0} />
      </div>

      <div className="mt-6 grid gap-3 lg:grid-cols-3">
        {data.competition && (
          <>
            <Breakdown
              title="Theo trạng thái"
              rows={Object.entries(data.competition.byStatus).map(([k, v]) => [STATUS_LABEL[k] || k, v])}
            />
            <Breakdown
              title="Theo khu vực"
              rows={Object.entries(data.competition.byRegion).map(([k, v]) => [REGION_LABEL[k] || k, v])}
            />
          </>
        )}
        <section className="rounded-lg border border-[#DCE5DF] bg-white p-4 shadow-[0_1px_2px_rgba(16,35,26,0.06)]">
          <h2 className="mb-3 text-[13px] font-semibold uppercase tracking-wider text-[#46564D]">Sự kiện sắp tới</h2>
          {data.upcomingEvents.length === 0 ? (
            <p className="text-[14px] text-[#66766D]">Chưa có sự kiện nào.</p>
          ) : (
            <ul className="divide-y divide-[#E6ECE8] text-[14px]">
              {data.upcomingEvents.map((e) => (
                <li key={e.id} className="py-2">
                  <div>{e.title}</div>
                  <div className="text-[12px] text-[#66766D]">
                    {[e.startDate, e.location].filter(Boolean).join(' · ')}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </>
  );
}
