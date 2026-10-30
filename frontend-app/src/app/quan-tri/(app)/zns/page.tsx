'use client';

import { useApi } from '@/lib/admin/client';
import { Badge, Card, Loading, PageTitle } from '@/components/admin/ui';

interface Info { status: 'NOT_CONFIGURED' | 'ACTIVE' | 'EXPIRED'; accessTokenPreview?: string; refreshTokenPreview?: string; expiresAt?: string }

const STATUS = { NOT_CONFIGURED: { label: 'Chưa cấu hình', tone: 'red' }, ACTIVE: { label: 'Đang hoạt động', tone: 'green' }, EXPIRED: { label: 'Đã hết hạn', tone: 'gold' } } as const;

export default function ZnsPage() {
  const info = useApi<Info>('zns');
  const s = info.data ? STATUS[info.data.status] : null;
  return (
    <>
      <PageTitle title="Zalo ZNS" />
      <Loading error={info.error} loading={info.loading && !info.data} />
      {info.data && s && (
        <div className="max-w-xl">
          <Card title="Token gửi tin Zalo">
            <dl className="space-y-3 text-[14px]">
              <div className="flex justify-between"><dt className="text-[#C4D0C8]">Trạng thái</dt><dd><Badge tone={s.tone}>{s.label}</Badge></dd></div>
              {info.data.accessTokenPreview && <div className="flex justify-between"><dt className="text-[#C4D0C8]">Access token</dt><dd className="font-mono">{info.data.accessTokenPreview}…</dd></div>}
              {info.data.refreshTokenPreview && <div className="flex justify-between"><dt className="text-[#C4D0C8]">Refresh token</dt><dd className="font-mono">{info.data.refreshTokenPreview}…</dd></div>}
              {info.data.expiresAt && <div className="flex justify-between"><dt className="text-[#C4D0C8]">Hết hạn</dt><dd>{info.data.expiresAt}</dd></div>}
            </dl>
            <div className="mt-5 border-t border-white/10 pt-4">
              <a href="/admin/zns/authorize" className="inline-block bg-[#A6E35A] px-4 py-2 text-[14px] font-medium text-[#0B2419]">Cấp quyền lại với Zalo</a>
              <p className="mt-2 text-[12px] text-[#8FA597]">Zalo chỉ quay về đúng địa chỉ đã đăng ký, nên bước này đi qua trang đăng nhập quản trị cũ một lần. Xong sẽ tự quay lại trang này.</p>
            </div>
          </Card>
        </div>
      )}
    </>
  );
}
