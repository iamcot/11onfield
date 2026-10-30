import { adminGet, getMe } from '@/lib/admin/server';

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
    <div className="border border-white/10 bg-[#0F3324] p-4">
      <div className="text-[11px] uppercase tracking-wider text-[#8FA597]">{label}</div>
      <div className="mt-1 text-3xl font-semibold tabular-nums text-[#D6FA9E]">{value}</div>
    </div>
  );
}

function Breakdown({ title, rows }: { title: string; rows: [string, number][] }) {
  return (
    <section className="border border-white/10 bg-[#0F3324] p-4">
      <h2 className="mb-3 text-[13px] font-semibold uppercase tracking-wider text-[#C4D0C8]">{title}</h2>
      <ul className="divide-y divide-white/10 text-[14px]">
        {rows.map(([name, n]) => (
          <li key={name} className="flex justify-between py-2">
            <span>{name}</span>
            <span className="tabular-nums text-[#D6FA9E]">{n}</span>
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
        <p className="mt-2 max-w-xl text-[#C4D0C8]">
          Màn hình chấm điểm tại sân đang được xây dựng. Trong lúc chờ, hãy dùng{' '}
          <a className="text-[#A6E35A] underline" href="/admin/field-scoring">trang chấm điểm bản cũ</a>.
        </p>
      </>
    );
  }

  const { data } = await adminGet<Dashboard>('dashboard');
  if (!data) return <p className="text-[#FFD2CD]">Không tải được số liệu tổng quan. Thử tải lại trang.</p>;

  return (
    <>
      <h1 className="text-2xl font-semibold">Tổng quan</h1>
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
        <section className="border border-white/10 bg-[#0F3324] p-4">
          <h2 className="mb-3 text-[13px] font-semibold uppercase tracking-wider text-[#C4D0C8]">Sự kiện sắp tới</h2>
          {data.upcomingEvents.length === 0 ? (
            <p className="text-[14px] text-[#8FA597]">Chưa có sự kiện nào.</p>
          ) : (
            <ul className="divide-y divide-white/10 text-[14px]">
              {data.upcomingEvents.map((e) => (
                <li key={e.id} className="py-2">
                  <div>{e.title}</div>
                  <div className="text-[12px] text-[#8FA597]">
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
