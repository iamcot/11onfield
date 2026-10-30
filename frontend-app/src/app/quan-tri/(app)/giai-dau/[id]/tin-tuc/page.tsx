'use client';

import { useParams } from 'next/navigation';
import { api, useApi } from '@/lib/admin/client';
import { fmtDateTime } from '@/lib/admin/labels';
import CompetitionTabs from '@/components/admin/CompetitionTabs';
import { Badge, Button, LinkButton, Loading, Table, Td, useUi } from '@/components/admin/ui';

interface News {
  id: number;
  title: string;
  thumbnail: string | null;
  authorByline: string | null;
  isFeatured: boolean;
  status: 'DRAFT' | 'PUBLISHED';
  publishedAt: string | null;
  createdAt: string;
}

export default function NewsListPage() {
  const { id } = useParams<{ id: string }>();
  const { toast } = useUi();
  const list = useApi<News[]>(`competitions/${id}/news`);

  async function post(n: News, action: string, ok: string) {
    try {
      await api(`news/${n.id}/${action}`, { method: 'POST' });
      toast(ok);
      list.reload();
    } catch (e) {
      toast((e as Error).message, 'error');
    }
  }

  return (
    <>
      <CompetitionTabs id={id}>
        <LinkButton href={`/quan-tri/giai-dau/${id}/tin-tuc/moi`} variant="primary">+ Viết tin</LinkButton>
      </CompetitionTabs>
      <Loading error={list.error} loading={list.loading && !list.data} />
      {list.data && (
        <Table head={['Tin tức', 'Trạng thái', 'Ngày đăng', '']} empty="Chưa có tin tức nào.">
          {list.data.map((n) => (
            <tr key={n.id}>
              <Td>
                <div className="flex items-center gap-3">
                  {n.thumbnail ? <img src={n.thumbnail} alt="" className="h-10 w-14 shrink-0 object-cover" /> : <div className="h-10 w-14 shrink-0 bg-white/5" />}
                  <div>
                    <div className="font-medium">{n.title} {n.isFeatured && <Badge tone="gold">Nổi bật</Badge>}</div>
                    {n.authorByline && <div className="text-[12px] text-[#8FA597]">{n.authorByline}</div>}
                  </div>
                </div>
              </Td>
              <Td><Badge tone={n.status === 'PUBLISHED' ? 'green' : 'gray'}>{n.status === 'PUBLISHED' ? 'Đã đăng' : 'Nháp'}</Badge></Td>
              <Td className="whitespace-nowrap text-[#C4D0C8]">{fmtDateTime(n.publishedAt)}</Td>
              <Td className="whitespace-nowrap text-right">
                <LinkButton small href={`/quan-tri/giai-dau/${id}/tin-tuc/${n.id}`}>Sửa</LinkButton>{' '}
                <Button small onClick={() => post(n, 'toggle-featured', n.isFeatured ? 'Đã bỏ nổi bật' : 'Đã đặt nổi bật')}>{n.isFeatured ? 'Bỏ nổi bật' : 'Nổi bật'}</Button>{' '}
                {n.status === 'PUBLISHED' ? (
                  <Button small variant="danger" onClick={() => post(n, 'unpublish', 'Đã chuyển về nháp')}>Gỡ bài</Button>
                ) : (
                  <Button small variant="primary" onClick={() => post(n, 'publish', 'Đã đăng bài')}>Đăng</Button>
                )}
              </Td>
            </tr>
          ))}
        </Table>
      )}
    </>
  );
}
