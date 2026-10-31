'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { api, useApi } from '@/lib/admin/client';
import { useMe } from '@/components/admin/me';
import { Badge, Button, Loading, Modal, Textarea, useUi } from '@/components/admin/ui';
import { fmtDateTime } from '@/lib/admin/labels';
import { REGIONS } from '@/lib/admin/labels';
import { FlagBadges, RankCell, RankFilters, TotalCell, inGroup, positionLabel, useRanking, type Group, type RankRow } from '@/components/admin/ranking';

const LIMIT = 30;
const ROUND = 'TOP30';

interface Votes { mine: number[]; limit: number; counts?: Record<string, number>; judges?: number; voted?: number }
interface Decision { id?: number; participantIds?: number[]; notes?: Record<string, string>; decidedAt?: string }

const sameSet = (a: Set<number>, b: Set<number>) => a.size === b.size && Array.from(a).every((x) => b.has(x));

/** The decision call, made by hand because a 400 carries `needNote` next to the message. */
async function postDecision(id: string, participantIds: number[], notes: Record<string, string>) {
  const res = await fetch(`/quan-tri/api/proxy/competitions/${id}/selection/${ROUND}/decision`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ participantIds, notes }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) return { ok: false as const, message: data?.message || `Lỗi ${res.status}`, needNote: (data?.needNote as number[] | undefined) || [] };
  return { ok: true as const };
}

function FinalizeModal({
  id, rows, picked, need, onClose, onDone,
}: { id: string; rows: RankRow[]; picked: Set<number>; need: number[]; onClose: () => void; onDone: () => void }) {
  const { toast } = useUi();
  const byId = useMemo(() => new Map(rows.map((r) => [r.participantId, r])), [rows]);
  const [needed, setNeeded] = useState<number[]>(need);
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit() {
    const missing = needed.filter((pid) => !(notes[pid] || '').trim());
    if (missing.length) { setError('Hãy ghi lý do cho tất cả các thí sinh bên dưới.'); return; }
    setBusy(true);
    setError('');
    try {
      const r = await postDecision(id, Array.from(picked), notes);
      if (r.ok) { toast('Đã chốt Top 30'); onDone(); return; }
      if (r.needNote.length) setNeeded((cur) => Array.from(new Set(cur.concat(r.needNote))));
      setError(r.message);
    } finally {
      setBusy(false);
    }
  }

  const label = (pid: number) => { const r = byId.get(pid); return r ? `SBD ${r.sbd} · ${r.fullName}` : `Thí sinh #${pid}`; };
  return (
    <Modal title="Chốt Top 30" onClose={onClose} wide>
      <p className="text-[14px] text-[#46564D]">
        Sau khi chốt, danh sách không đổi được và thí sinh được báo kết quả. Bước này không hoàn tác.
      </p>
      {needed.length > 0 ? (
        <div className="mt-4 space-y-3">
          <p className="text-[14px] font-semibold">Chọn khác thứ tự điểm cần ghi lý do ({needed.length} người):</p>
          {needed.map((pid) => {
            const r = byId.get(pid);
            const inList = picked.has(pid);
            return (
              <div key={pid} className="rounded-lg border border-[#DCE5DF] p-3">
                <div className="mb-1.5 flex flex-wrap items-center gap-2 text-[14px]">
                  <strong>{label(pid)}</strong>
                  {r && <span className="text-[#66766D]">hạng {r.rank}</span>}
                  <Badge tone={inList ? 'green' : 'red'}>{inList ? 'Chọn dù ngoài Top 30 theo điểm' : 'Bỏ dù trong Top 30 theo điểm'}</Badge>
                </div>
                <Textarea rows={2} aria-label={`Lý do cho ${label(pid)}`} placeholder="Lý do" value={notes[pid] || ''} onChange={(e) => setNotes({ ...notes, [pid]: e.target.value })} />
              </div>
            );
          })}
        </div>
      ) : (
        <p className="mt-4 text-[14px]">Danh sách {picked.size} người trùng với thứ tự điểm, không cần ghi lý do.</p>
      )}
      {error && <p role="alert" className="mt-3 border border-[#F3B4AD] bg-[#FEF1EF] px-3 py-2 text-[14px] text-[#B42318]">{error}</p>}
      <div className="mt-5 flex justify-end gap-2">
        <Button onClick={onClose}>Huỷ</Button>
        <Button variant="primary" disabled={busy} onClick={submit}>{busy ? 'Đang chốt…' : 'Chốt danh sách'}</Button>
      </div>
    </Modal>
  );
}

/**
 * Top 30 by hand: every judge ticks up to 30 players (their own vote), then the head coach (HLV) marks the final 30 and
 * finalises. Ranks come from the combined ranking and are only shown here, never to players.
 */
export default function Top30Selection({ id }: { id: string }) {
  const { toast } = useUi();
  const me = useMe();
  // HLV decides and sees everyone's votes; TTV votes; admins watch.
  const superUser = me.role === 'HLV';
  const staff = me.role === 'HLV' || me.role === 'ADMIN';
  const canVote = me.role === 'HLV' || me.role === 'TTV';
  const [group, setGroup] = useState<Group>('ALL');
  const [region, setRegion] = useState('');
  const ranking = useRanking(id, '');
  const votes = useApi<Votes>(`competitions/${id}/selection/${ROUND}/votes`);
  const decision = useApi<Decision>(`competitions/${id}/selection/${ROUND}/decision`);

  const [mine, setMine] = useState<Set<number>>(new Set());
  const [final, setFinal] = useState<Set<number>>(new Set());
  const [savingVote, setSavingVote] = useState(false);
  const [finalizing, setFinalizing] = useState(false);

  const rows = ranking.data || [];
  const decided = !!decision.data?.participantIds;
  const savedMine = useMemo(() => new Set(votes.data?.mine || []), [votes.data]);
  const dirty = !sameSet(mine, savedMine);

  useEffect(() => { setMine(new Set(votes.data?.mine || [])); }, [votes.data]);
  // Green Card holders must be in the list, so they start ticked.
  useEffect(() => {
    if (decision.data?.participantIds) setFinal(new Set(decision.data.participantIds));
    else setFinal((cur) => (cur.size ? cur : new Set(rows.filter((r) => r.greenCard).map((r) => r.participantId))));
  }, [decision.data, ranking.data]); // eslint-disable-line react-hooks/exhaustive-deps

  const toggle = (set: Set<number>, setter: (s: Set<number>) => void, pid: number, cap: number) => {
    const n = new Set(set);
    if (n.has(pid)) n.delete(pid);
    else if (n.size >= cap) { toast(`Chỉ chọn tối đa ${cap} người`, 'error'); return; }
    else n.add(pid);
    setter(n);
  };

  // Each "Chọn" in Phiếu của tôi saves at once. Saves run one after another and always send the latest picks, so
  // quick taps never arrive out of order; the counts are reloaded once the last one is in.
  const latestMine = useRef(mine);
  const saveChain = useRef<Promise<void>>(Promise.resolve());
  function toggleVote(pid: number) {
    const n = new Set(mine);
    if (n.has(pid)) n.delete(pid);
    else if (n.size >= LIMIT) { toast(`Chỉ chọn tối đa ${LIMIT} người`, 'error'); return; }
    else n.add(pid);
    setMine(n);
    latestMine.current = n;
    setSavingVote(true);
    saveChain.current = saveChain.current.then(async () => {
      const sent = latestMine.current;
      try {
        await api(`competitions/${id}/selection/${ROUND}/votes`, { method: 'PUT', body: { participantIds: Array.from(sent) } });
        if (sent === latestMine.current) { setSavingVote(false); votes.reload(); }
      } catch (e) {
        toast(`Chưa lưu được phiếu: ${(e as Error).message}`, 'error');
        latestMine.current = savedMine;
        setSavingVote(false);
        votes.reload();
      }
    });
  }

  // Who needs a written reason: picked below rank 30 (Green Card exempt), or a complete top-30 player left out.
  const need = rows
    .filter((r) => (final.has(r.participantId) ? r.rank > LIMIT && !r.greenCard : r.rank <= LIMIT && r.complete))
    .map((r) => r.participantId);
  const missingGreen = rows.filter((r) => r.greenCard && !final.has(r.participantId));

  const decidedNotes = decision.data?.notes || {};
  const list = rows.filter((r) => inGroup(r, group) && (!region || r.region === region));
  const shownRows = decided ? list.filter((r) => final.has(r.participantId)) : list;
  const judges = votes.data?.judges;

  return (
    <>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <p className="max-w-3xl text-[13px] text-[#46564D]">
          {decided
            ? 'Top 30 đã chốt. Danh sách dưới đây là kết quả chính thức, kèm lý do khi chọn khác thứ tự điểm.'
            : 'Mỗi thành viên hội đồng tuyển trạch chọn tối đa 30 người làm phiếu của mình. HLV xem số phiếu và thứ hạng, rồi chọn tay 30 người cuối cùng. Hệ thống không tự cắt theo điểm.'}
        </p>
        <div className="flex flex-wrap items-center gap-2">
          {canVote && !decided && <span className="rounded-lg border border-[#DCE5DF] bg-white px-3 py-2 text-[14px] font-semibold">Phiếu của bạn {mine.size}/{LIMIT}</span>}
          {canVote && !decided && <span className="text-[13px] text-[#46564D]">{savingVote || dirty ? 'Đang lưu phiếu…' : 'Phiếu tự lưu khi bấm Chọn'}</span>}
          {staff && !decided && judges != null && <span className="rounded-lg border border-[#DCE5DF] bg-white px-3 py-2 text-[14px] font-semibold">Đã bỏ phiếu {votes.data?.voted ?? 0}/{judges} người</span>}
          {superUser && !decided && <span className="rounded-lg border border-[#DCE5DF] bg-white px-3 py-2 text-[14px] font-semibold">Đã chọn {final.size}/{LIMIT}</span>}
          {superUser && !decided && (
            <Button variant="primary" disabled={final.size !== LIMIT || missingGreen.length > 0} onClick={() => setFinalizing(true)}>Chốt danh sách</Button>
          )}
        </div>
      </div>

      {decided && decision.data?.decidedAt && <p className="mb-3 text-[13px] text-[#46564D]">Chốt lúc {fmtDateTime(decision.data.decidedAt)}.</p>}
      {superUser && !decided && missingGreen.length > 0 && (
        <p role="alert" className="mb-3 border border-[#E8C779] bg-[#FBEFD5] px-3 py-2 text-[14px] text-[#6B4500]">
          Người có Green Card bắt buộc nằm trong danh sách: {missingGreen.map((r) => `${r.fullName} (SBD ${r.sbd})`).join(', ')}.
        </p>
      )}

      <RankFilters group={group} onGroup={setGroup} region={region} onRegion={setRegion} />
      <Loading error={ranking.error || votes.error || decision.error} loading={(ranking.loading && !ranking.data) || (votes.loading && !votes.data)} />

      {ranking.data && (
        <div className="overflow-x-auto rounded-lg border border-[#DCE5DF] bg-white shadow-[0_1px_2px_rgba(16,35,26,0.06)]">
          <table className="w-full min-w-[900px] text-left text-[14px] whitespace-nowrap">
            <thead className="bg-[#F3F6F4] text-[11px] uppercase tracking-wider text-[#56665D]">
              <tr>
                {['Hạng', 'SBD', 'Họ tên', 'Khu vực', 'Vị trí', 'Tổng', ...(staff ? [`Phiếu${judges != null ? ` (/${judges})` : ''}`] : []), 'Cờ'].map((h) => <th key={h} className="px-3 py-2.5 font-medium">{h}</th>)}
                {canVote && !decided && <th className="px-3 py-2.5 font-medium">Phiếu của tôi</th>}
                {superUser && <th className="px-3 py-2.5 font-medium">{decided ? 'Lý do' : 'Chọn'}</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E6ECE8]">
              {shownRows.map((r) => {
                const on = final.has(r.participantId);
                const voted = mine.has(r.participantId);
                const count = votes.data?.counts?.[String(r.participantId)] ?? r.votes;
                return (
                  <tr key={r.participantId} className={on ? 'bg-[#EAF4EC]' : r.tied ? 'bg-[#FFF6D6]' : r.medicalOut ? 'bg-[#FEF1EF]' : ''}>
                    <td className="px-3 py-2.5"><RankCell row={r} /></td>
                    <td className="px-3 py-2.5 tabular-nums">{r.sbd}</td>
                    <td className="px-3 py-2.5 font-medium">{r.fullName}</td>
                    <td className="px-3 py-2.5">{r.region ? (REGIONS[r.region] || r.region).split(' & ')[0] : '—'}</td>
                    <td className="px-3 py-2.5">{positionLabel(r.positions)}</td>
                    <td className="px-3 py-2.5"><TotalCell row={r} /></td>
                    {staff && <td className="px-3 py-2.5 tabular-nums">{count}{judges ? `/${judges}` : ''}</td>}
                    <td className="px-3 py-2.5"><FlagBadges row={r} /></td>
                    {canVote && !decided && (
                      <td className="px-3 py-2.5">
                        <button
                          type="button"
                          aria-pressed={voted}
                          aria-label={`Phiếu của tôi cho ${r.fullName}`}
                          onClick={() => toggleVote(r.participantId)}
                          className={`min-w-[84px] rounded-md border px-3 py-1.5 text-[13px] font-medium ${voted ? 'border-[#1F7A3A] bg-[#1F7A3A] text-white' : 'border-[#C9D5CD] bg-white text-[#10231A] hover:border-[#1F7A3A]'}`}
                        >
                          {voted ? 'Đã chọn' : 'Chọn'}
                        </button>
                      </td>
                    )}
                    {superUser && (
                      <td className="px-3 py-2.5">
                        {decided ? (
                          <span className="whitespace-normal text-[13px] text-[#46564D]">{decidedNotes[String(r.participantId)] || ''}</span>
                        ) : (
                          <button
                            type="button"
                            aria-pressed={on}
                            aria-label={`Chốt ${r.fullName} vào Top 30`}
                            disabled={r.greenCard}
                            onClick={() => toggle(final, setFinal, r.participantId, LIMIT)}
                            className={`min-w-[84px] rounded-md border px-3 py-1.5 text-[13px] font-medium disabled:cursor-not-allowed ${on ? 'border-[#0F3324] bg-[#0F3324] text-[#D6FA9E]' : 'border-[#C9D5CD] bg-white text-[#10231A] hover:border-[#0F3324]'}`}
                          >
                            {on ? 'Top 30' : 'Chọn'}
                          </button>
                        )}
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
          {shownRows.length === 0 && <p className="px-3 py-6 text-center text-[#66766D]">Chưa có thí sinh nào có điểm vòng.</p>}
        </div>
      )}
      <div className="mt-3 flex flex-wrap gap-x-6 gap-y-1 text-[12px] text-[#56665D]">
        <span>Hạng là hạng chung 3 khu vực, chỉ hội đồng tuyển trạch và BTC thấy.</span>
        <span>Chọn người ngoài Top 30 theo điểm, hoặc bỏ người trong Top 30 đã đủ điểm, phải ghi lý do khi chốt.</span>
        {!superUser && <span>Chỉ Super user chốt danh sách cuối.</span>}
      </div>

      {finalizing && (
        <FinalizeModal id={id} rows={rows} picked={final} need={need} onClose={() => setFinalizing(false)} onDone={() => { setFinalizing(false); decision.reload(); ranking.reload(); }} />
      )}
    </>
  );
}

