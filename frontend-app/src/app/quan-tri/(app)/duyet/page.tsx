'use client';

import Link from 'next/link';
import { api, useApi } from '@/lib/admin/client';
import { ACHIEVEMENT_TYPES, fmtDate } from '@/lib/admin/labels';
import { Button, Card, Loading, PageTitle, Table, Td, useUi } from '@/components/admin/ui';

interface Ach { id: number; playerId: number; playerName: string; type: string; title: string; date: string | null }
interface Hl { id: number; playerId: number; playerName: string; url: string; platform: string | null; date: string | null }

export default function ApprovalsPage() {
  const { toast } = useUi();
  const q = useApi<{ achievements: Ach[]; highlights: Hl[] }>('approvals');

  async function decide(kind: 'achievements' | 'highlights', id: number, d: 'approve' | 'reject') {
    try {
      await api(`${kind}/${id}/${d}`, { method: 'POST' });
      toast(d === 'approve' ? 'Đã duyệt' : 'Đã từ chối');
      q.reload();
    } catch (e) {
      toast((e as Error).message, 'error');
    }
  }
  const actions = (kind: 'achievements' | 'highlights', id: number) => (
    <Td className="whitespace-nowrap text-right">
      <Button small variant="primary" onClick={() => decide(kind, id, 'approve')}>Duyệt</Button>{' '}
      <Button small variant="danger" onClick={() => decide(kind, id, 'reject')}>Từ chối</Button>
    </Td>
  );
  const who = (id: number, name: string) => <Link className="text-[#1F6B32] hover:underline" href={`/quan-tri/cau-thu/${id}`}>{name}</Link>;

  return (
    <>
      <PageTitle title="Hàng chờ duyệt" back={{ href: '/quan-tri/cau-thu', label: 'Danh sách cầu thủ' }} />
      <Loading error={q.error} loading={q.loading && !q.data} />
      {q.data && (
        <div className="space-y-5">
          <Card title={`Thành tích (${q.data.achievements.length})`}>
            <Table head={['Cầu thủ', 'Loại', 'Thành tích', 'Ngày', '']} empty="Không có thành tích nào chờ duyệt.">
              {q.data.achievements.map((a) => (
                <tr key={a.id}>
                  <Td>{who(a.playerId, a.playerName)}</Td>
                  <Td className="text-[#46564D]">{ACHIEVEMENT_TYPES[a.type] || a.type}</Td>
                  <Td>{a.title}</Td>
                  <Td className="text-[#46564D]">{fmtDate(a.date)}</Td>
                  {actions('achievements', a.id)}
                </tr>
              ))}
            </Table>
          </Card>
          <Card title={`Highlight (${q.data.highlights.length})`}>
            <Table head={['Cầu thủ', 'Video', 'Ngày', '']} empty="Không có highlight nào chờ duyệt.">
              {q.data.highlights.map((h) => (
                <tr key={h.id}>
                  <Td>{who(h.playerId, h.playerName)}</Td>
                  <Td><a href={h.url} target="_blank" rel="noreferrer" className="break-all text-[#1F7A3A] underline">{h.url}</a> {h.platform && <span className="text-[12px] text-[#66766D]">({h.platform})</span>}</Td>
                  <Td className="text-[#46564D]">{fmtDate(h.date)}</Td>
                  {actions('highlights', h.id)}
                </tr>
              ))}
            </Table>
          </Card>
        </div>
      )}
    </>
  );
}
