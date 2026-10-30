'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/admin/client';
import { Button, Field, Input, Modal, Select, useUi } from '@/components/admin/ui';
import { REGIONS } from '@/lib/admin/labels';

interface Candidate { userId: number; fullName: string; phone: string | null; avatar: string | null }

/** Search a player by name or phone and add them to the competition (outside the registration window). */
export default function AddContestantModal({ competitionId, onClose, onAdded }: { competitionId: string; onClose: () => void; onAdded: () => void }) {
  const { toast } = useUi();
  const [q, setQ] = useState('');
  const [found, setFound] = useState<Candidate[] | null>(null);
  const [picked, setPicked] = useState<Candidate | null>(null);
  const [region, setRegion] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const term = q.trim();
    if (term.length < 2) return setFound(null);
    let live = true;
    const t = setTimeout(() => {
      api<Candidate[]>(`competitions/${competitionId}/candidates?q=${encodeURIComponent(term)}`)
        .then((r) => live && setFound(r))
        .catch(() => live && setFound([]));
    }, 300);
    return () => { live = false; clearTimeout(t); };
  }, [q, competitionId]);

  async function add() {
    if (!picked) return;
    setBusy(true);
    try {
      const r = await api<{ message: string }>(`competitions/${competitionId}/participants`, { method: 'POST', body: { userId: picked.userId, region: region || null } });
      toast(r.message);
      onAdded();
      onClose();
    } catch (e) {
      toast((e as Error).message, 'error');
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal title="Thêm cầu thủ vào giải" onClose={onClose}>
      {picked ? (
        <>
          <div className="mb-4 flex items-center justify-between rounded-md border border-[#C9D5CD] bg-[#F3F6F4] px-3 py-2.5">
            <div>
              <div className="font-medium">{picked.fullName}</div>
              <div className="text-[13px] tabular-nums text-[#46564D]">{picked.phone}</div>
            </div>
            <Button small onClick={() => setPicked(null)}>Đổi</Button>
          </div>
          <Field label="Khu vực" hint="Để trống nếu chưa biết; check-in tại vòng khu vực sẽ tự điền.">
            <Select value={region} onChange={(e) => setRegion(e.target.value)}>
              <option value="">Chưa chọn</option>
              {Object.entries(REGIONS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </Select>
          </Field>
          <p className="mt-3 text-[13px] text-[#46564D]">Cầu thủ được thêm với trạng thái “Đã đăng ký”, kể cả khi giải đã hết hạn đăng ký.</p>
          <div className="mt-5 flex justify-end gap-2">
            <Button onClick={onClose}>Hủy</Button>
            <Button variant="primary" disabled={busy} onClick={add}>{busy ? 'Đang thêm…' : 'Thêm vào giải'}</Button>
          </div>
        </>
      ) : (
        <>
          <Input autoFocus placeholder="Tên hoặc số điện thoại cầu thủ" value={q} onChange={(e) => setQ(e.target.value)} />
          <div className="mt-3 max-h-[360px] overflow-y-auto">
            {found === null ? (
              <p className="text-[13px] text-[#66766D]">Gõ ít nhất 2 ký tự. Chỉ hiện cầu thủ chưa có trong giải.</p>
            ) : found.length === 0 ? (
              <p className="text-[13px] text-[#66766D]">Không tìm thấy cầu thủ nào chưa có trong giải.</p>
            ) : (
              <ul className="divide-y divide-[#E6ECE8] border border-[#E6ECE8]">
                {found.map((c) => (
                  <li key={c.userId}>
                    <button type="button" onClick={() => setPicked(c)} className="flex w-full items-center justify-between px-3 py-2.5 text-left hover:bg-[#F3F6F4]">
                      <span>
                        <span className="block font-medium">{c.fullName}</span>
                        <span className="block text-[13px] tabular-nums text-[#46564D]">{c.phone}</span>
                      </span>
                      <span aria-hidden="true" className="text-[18px] text-[#66766D]">›</span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </>
      )}
    </Modal>
  );
}
