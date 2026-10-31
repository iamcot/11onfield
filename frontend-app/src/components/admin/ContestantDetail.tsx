'use client';

// One contestant as the station staff see them: flags (medical, discipline, did not start) with history, Green Card,
// judges' records. Used by the Thí sinh page of the sidebar and the contestant list of a competition.

import { useState } from 'react';
import { api, useApi } from '@/lib/admin/client';
import { useMe } from '@/components/admin/me';
import { Badge, Button, Card, Field, Input, Loading, Textarea, useUi } from '@/components/admin/ui';
import { fmtDateTime, FLAG_KINDS, PARTICIPATION } from '@/lib/admin/labels';

export interface Row { id: number; sbd: number; fullName: string; phone: string | null; status: string; flags: string[]; greenCard: boolean }
interface Flag { id: number; kind: string; reason: string | null; createdAt: string; createdBy: string; active: boolean; revokedAt?: string; revokedBy?: string; revokeReason?: string }
interface Note { judge: string; step: string | null; participation: string; ticked: boolean; note: string | null; updatedAt: string }
interface Detail extends Omit<Row, 'greenCard'> {
  blocked: boolean; disciplineCount: number; flags: any; judgeNotes: Note[];
  greenCard?: { holderTitle: string; reason: string; usedAt: string };
  myGreenCard?: { id: number; title: string; used: boolean };
}

/** Which flags this role may raise (the server checks again). */
function raisable(role: string): string[] {
  if (role === 'ADMIN') return ['MEDICAL_OUT', 'DISCIPLINE', 'DNS'];
  if (role === 'MEDICAL') return ['MEDICAL_OUT'];
  if (role === 'HLV' || role === 'TTV') return ['DISCIPLINE', 'DNS'];
  return [];
}

const ACTION: Record<string, string> = { MEDICAL_OUT: 'Không đủ điều kiện (y tế)', DISCIPLINE: 'Ghi vi phạm kỷ luật', DNS: 'Đánh dấu không thi' };

function FlagForm({ participantId, kind, onDone, onCancel }: { participantId: number; kind: string; onDone: () => void; onCancel: () => void }) {
  const { toast } = useUi();
  const [reason, setReason] = useState('');
  const [busy, setBusy] = useState(false);
  async function submit() {
    setBusy(true);
    try {
      await api(`scouting/participants/${participantId}/flags`, { body: { kind, reason } });
      toast('Đã đặt cờ');
      onDone();
    } catch (e) {
      toast((e as Error).message, 'error');
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="mt-3 rounded-md border border-[#E8958B] bg-[#FFF8F7] p-3">
      <Field label={`${ACTION[kind]}: lý do${kind === 'DNS' ? '' : ' *'}`}>
        <Textarea value={reason} onChange={(e) => setReason(e.target.value)} />
      </Field>
      <div className="mt-2 flex justify-end gap-2">
        <Button onClick={onCancel}>Huỷ</Button>
        <Button variant="danger" disabled={busy || (kind !== 'DNS' && !reason.trim())} onClick={submit}>{busy ? 'Đang lưu…' : 'Đặt cờ'}</Button>
      </div>
    </div>
  );
}

export default function ContestantDetail({ id, onChanged }: { id: number; onChanged: () => void }) {
  const me = useMe();
  const { toast, confirm } = useUi();
  const d = useApi<Detail>(`scouting/participants/${id}`);
  const [adding, setAdding] = useState<string | null>(null);
  const [revoking, setRevoking] = useState<{ flag: Flag; reason: string } | null>(null);
  const [cardReason, setCardReason] = useState('');
  const [usingCard, setUsingCard] = useState(false);
  const reload = () => { d.reload(); onChanged(); };
  const can = raisable(me.role).filter((k) => !(k === 'MEDICAL_OUT' && d.data?.blocked));
  const x = d.data;

  async function revoke() {
    if (!revoking) return;
    try {
      await api(`scouting/flags/${revoking.flag.id}/revoke`, { body: { reason: revoking.reason } });
      toast('Đã gỡ cờ');
      setRevoking(null);
      reload();
    } catch (e) {
      toast((e as Error).message, 'error');
    }
  }

  async function useCard() {
    if (!x) return;
    // The card cannot be taken back, so ask twice.
    if (!(await confirm(`Dùng Green Card cho SBD ${x.sbd} · ${x.fullName}? Thí sinh sẽ vào thẳng Top 30.`))) return;
    if (!(await confirm('Xác nhận lần cuối: mỗi người chỉ có một thẻ và không thể thu hồi.'))) return;
    try {
      const r = await api<{ message: string }>('scouting/green-card/use', { body: { participantId: x.id, reason: cardReason, confirmed: true } });
      toast(r.message);
      setUsingCard(false);
      reload();
    } catch (e) {
      toast((e as Error).message, 'error');
    }
  }

  if (!x) return <Loading error={d.error} loading={d.loading} />;
  const flags: Flag[] = x.flags;
  return (
    <div className="space-y-4">
      <div>
        <div className="text-[13px] text-[#66766D]">SBD {x.sbd}</div>
        <div className="text-[20px] font-semibold">{x.fullName}</div>
        <div className="text-[13px] text-[#46564D]">{x.phone}</div>
        {x.blocked && <div className="mt-2 rounded-md bg-[#FDE4E1] px-3 py-2 text-[14px] font-medium text-[#B42318]">Thí sinh bị loại khỏi các trạm sau (bác sĩ). Gỡ cờ để thi tiếp.</div>}
      </div>

      <Card title="Cờ">
        {can.length > 0 && !adding && (
          <div className="mb-3 flex flex-wrap gap-2">
            {can.map((k) => <Button key={k} small variant={k === 'MEDICAL_OUT' ? 'danger' : 'ghost'} onClick={() => setAdding(k)}>{ACTION[k]}</Button>)}
          </div>
        )}
        {adding && <FlagForm participantId={x.id} kind={adding} onCancel={() => setAdding(null)} onDone={() => { setAdding(null); reload(); }} />}
        {flags.length === 0 && !adding && <p className="text-[14px] text-[#66766D]">Chưa có cờ nào.</p>}
        <ul className="mt-2 divide-y divide-[#E6ECE8]">
          {flags.map((f) => (
            <li key={f.id} className={`py-2 text-[14px] ${f.active ? '' : 'opacity-60'}`}>
              <div className="flex flex-wrap items-center gap-2">
                <Badge tone={FLAG_KINDS[f.kind]?.tone || 'gray'}>{FLAG_KINDS[f.kind]?.label || f.kind}</Badge>
                {!f.active && <Badge>Đã gỡ</Badge>}
                <span className="text-[12px] text-[#66766D]">{f.createdBy} · {fmtDateTime(f.createdAt)}</span>
                {f.active && (
                  <button type="button" className="ml-auto text-[13px] text-[#1F6B32] underline" onClick={() => setRevoking({ flag: f, reason: '' })}>Gỡ cờ</button>
                )}
              </div>
              {f.reason && <p className="mt-1">{f.reason}</p>}
              {!f.active && <p className="mt-1 text-[13px] text-[#46564D]">Gỡ bởi {f.revokedBy} · {fmtDateTime(f.revokedAt)}: {f.revokeReason}</p>}
              {revoking?.flag.id === f.id && (
                <div className="mt-2 flex gap-2">
                  <Input placeholder="Lý do gỡ cờ *" value={revoking.reason} onChange={(e) => setRevoking({ flag: f, reason: e.target.value })} />
                  <Button variant="primary" disabled={!revoking.reason.trim()} onClick={revoke}>Gỡ</Button>
                  <Button onClick={() => setRevoking(null)}>Huỷ</Button>
                </div>
              )}
            </li>
          ))}
        </ul>
        {x.disciplineCount > 0 && <p className="mt-2 text-[13px] text-[#8A5A00]">Vi phạm kỷ luật đang hiệu lực: {x.disciplineCount} (dùng khi xét đồng điểm)</p>}
      </Card>

      <Card title="Green Card">
        {x.greenCard ? (
          <p className="text-[14px]">
            <Badge tone="green">Đã có Green Card</Badge> do {x.greenCard.holderTitle} · vào thẳng Top 30.<br />
            <span className="text-[#46564D]">Lý do: {x.greenCard.reason}</span>
          </p>
        ) : x.myGreenCard && !x.myGreenCard.used ? (
          usingCard ? (
            <div>
              <Field label="Lý do dùng Green Card *"><Textarea value={cardReason} onChange={(e) => setCardReason(e.target.value)} /></Field>
              <div className="mt-2 flex justify-end gap-2">
                <Button onClick={() => setUsingCard(false)}>Huỷ</Button>
                <Button variant="primary" disabled={!cardReason.trim()} onClick={useCard}>Dùng Green Card</Button>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-between gap-3">
              <p className="text-[14px]">Bạn giữ 1 Green Card ({x.myGreenCard.title}) chưa dùng.</p>
              <Button variant="primary" onClick={() => setUsingCard(true)}>Dùng cho thí sinh này</Button>
            </div>
          )
        ) : (
          <p className="text-[14px] text-[#66766D]">{x.myGreenCard?.used ? 'Bạn đã dùng Green Card của mình.' : 'Thí sinh chưa có Green Card.'}</p>
        )}
      </Card>

      {(me.role === 'HLV' || me.role === 'TTV' || me.role === 'ADMIN') && (
        <Card title={me.role === 'TTV' ? 'Ghi nhận của bạn' : 'Ghi nhận của hội đồng tuyển trạch'}>
          {x.judgeNotes.length === 0 && <p className="text-[14px] text-[#66766D]">Chưa có ghi nhận.</p>}
          <ul className="divide-y divide-[#E6ECE8] text-[14px]">
            {x.judgeNotes.map((n, i) => (
              <li key={i} className="py-2">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-medium">{n.step}</span>
                  <Badge tone={n.participation === 'FULL' ? 'green' : n.participation === 'PARTIAL' ? 'gold' : 'red'}>{PARTICIPATION[n.participation]}</Badge>
                  {n.ticked && <Badge tone="green">✓ tick</Badge>}
                  {me.role !== 'TTV' && <span className="text-[12px] text-[#66766D]">{n.judge}</span>}
                </div>
                {n.note && <p className="mt-1 text-[#46564D]">{n.note}</p>}
              </li>
            ))}
          </ul>
        </Card>
      )}
    </div>
  );
}

