'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { api, useApi } from '@/lib/admin/client';
import { ACHIEVEMENT_TYPES, APPROVAL, FEET, LEVELS, POSITIONS, fmtDate } from '@/lib/admin/labels';
import { useIsManager } from '@/components/admin/me';
import { Badge, Button, Card, Check, Field, Input, LinkButton, Loading, PageTitle, Select, Textarea, useUi } from '@/components/admin/ui';

interface Item {
  id?: number;
  type: string;
  title: string;
  date: string;
  status?: string;
}
interface Highlight {
  id?: number;
  url: string;
  date: string;
  status?: string;
}

const txt = (v: unknown) => (v == null ? '' : String(v));

export default function PlayerEditPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { toast } = useUi();
  const manager = useIsManager();
  const provinces = useApi<{ id: number; name: string }[]>('provinces');
  const detail = useApi<any>(`players/${id}`);
  const [f, setF] = useState<Record<string, string>>({});
  const [verified, setVerified] = useState(false);
  const [achievements, setAchievements] = useState<Item[]>([]);
  const [highlights, setHighlights] = useState<Highlight[]>([]);
  const [socials, setSocials] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const p = detail.data;
    if (!p) return;
    setF({
      fullName: txt(p.fullName), phone: txt(p.phone), email: txt(p.email), avatar: txt(p.avatar), dob: txt(p.dob), gender: txt(p.gender),
      provinceId: txt(p.provinceId), height: txt(p.height), weight: txt(p.weight), preferredFoot: txt(p.preferredFoot), positions: txt(p.positions),
      secondaryPosition: txt(p.secondaryPosition), yearsOfExperience: txt(p.yearsOfExperience), level: txt(p.level), bio: txt(p.bio),
      personalId: txt(p.personalId), address: txt(p.address), school: txt(p.school), academy: txt(p.academy), club: txt(p.club),
    });
    setVerified(!!p.verified);
    setAchievements(p.achievements.map((a: any) => ({ id: a.id, type: a.type, title: a.title, date: txt(a.date), status: a.status })));
    setHighlights(p.highlights.map((h: any) => ({ id: h.id, url: h.url, date: txt(h.date), status: h.status })));
    setSocials(p.socials.map((s: any) => s.url));
  }, [detail.data]);

  const set = (k: string) => (v: string) => setF((s) => ({ ...s, [k]: v }));
  const field = (k: string, label: string, props: Record<string, unknown> = {}) => (
    <Field label={label}>
      <Input value={f[k] ?? ''} onChange={(e) => set(k)(e.target.value)} disabled={!manager} {...props} />
    </Field>
  );
  const num = (v: string) => (v === '' ? null : Number(v));

  async function save() {
    setSaving(true);
    try {
      await api(`players/${id}`, {
        method: 'PUT',
        body: {
          ...f, provinceId: num(f.provinceId), height: num(f.height), weight: num(f.weight), yearsOfExperience: num(f.yearsOfExperience),
          verified, achievements, highlights, socials,
        },
      });
      toast('Đã lưu hồ sơ cầu thủ');
      detail.reload();
    } catch (e) {
      toast((e as Error).message, 'error');
    } finally {
      setSaving(false);
    }
  }

  async function decide(kind: 'achievements' | 'highlights', itemId: number, decision: 'approve' | 'reject') {
    try {
      await api(`${kind}/${itemId}/${decision}`, { method: 'POST' });
      toast(decision === 'approve' ? 'Đã duyệt' : 'Đã từ chối');
      detail.reload();
    } catch (e) {
      toast((e as Error).message, 'error');
    }
  }

  const Decide = ({ kind, item }: { kind: 'achievements' | 'highlights'; item: { id?: number; status?: string } }) =>
    item.id && item.status ? (
      <div className="flex items-center gap-2">
        <Badge tone={APPROVAL[item.status]?.tone}>{APPROVAL[item.status]?.label}</Badge>
        {item.status !== 'APPROVED' && <Button small variant="primary" onClick={() => decide(kind, item.id!, 'approve')}>Duyệt</Button>}
        {item.status !== 'REJECTED' && <Button small variant="danger" onClick={() => decide(kind, item.id!, 'reject')}>Từ chối</Button>}
      </div>
    ) : null;

  const p = detail.data;
  return (
    <>
      <PageTitle title={p?.fullName || 'Cầu thủ'} back={{ href: '/quan-tri/cau-thu', label: 'Danh sách cầu thủ' }}>
        {p && <LinkButton href={`/profile/${p.userid}`}>Xem trang công khai</LinkButton>}
        <LinkButton href={`/quan-tri/cau-thu/${id}/chi-so`}>Chỉ số</LinkButton>
      </PageTitle>
      <Loading error={detail.error} loading={detail.loading && !p} />
      {p && (
        <div className="space-y-4">
          {!manager && <p className="border border-[#E9CF95] bg-[#FDF6E7] px-3 py-2 text-[14px] text-[#8A5A00]">Bạn chỉ có quyền xem hồ sơ và duyệt thành tích, highlight.</p>}

          <Card title="Thông tin cơ bản">
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {field('fullName', 'Họ tên')}
              {field('phone', 'Số điện thoại')}
              {field('email', 'Email', { type: 'email' })}
              {field('dob', 'Ngày sinh', { type: 'date' })}
              <Field label="Giới tính">
                <Select value={f.gender ?? ''} onChange={(e) => set('gender')(e.target.value)} disabled={!manager}>
                  <option value="">—</option><option value="MALE">Nam</option><option value="FEMALE">Nữ</option><option value="OTHER">Khác</option>
                </Select>
              </Field>
              <Field label="Tỉnh/thành">
                <Select value={f.provinceId ?? ''} onChange={(e) => set('provinceId')(e.target.value)} disabled={!manager}>
                  <option value="">—</option>
                  {provinces.data?.map((x) => <option key={x.id} value={x.id}>{x.name}</option>)}
                </Select>
              </Field>
              {field('personalId', 'CCCD / định danh')}
              {field('address', 'Địa chỉ thường trú')}
              <div className="flex items-end gap-3">
                {f.avatar && <img src={f.avatar} alt="" className="h-10 w-10 rounded-full object-cover" />}
                <div className="flex-1">{field('avatar', 'Ảnh đại diện (URL)')}</div>
              </div>
            </div>
          </Card>

          <Card title="Thông tin bóng đá">
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {field('height', 'Chiều cao (cm)', { type: 'number' })}
              {field('weight', 'Cân nặng (kg)', { type: 'number' })}
              <Field label="Chân thuận">
                <Select value={f.preferredFoot ?? ''} onChange={(e) => set('preferredFoot')(e.target.value)} disabled={!manager}>
                  <option value="">—</option>
                  {Object.entries(FEET).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                </Select>
              </Field>
              {field('yearsOfExperience', 'Số năm kinh nghiệm', { type: 'number' })}
              <Field label="Vị trí chính">
                <Select value={f.positions ?? ''} onChange={(e) => set('positions')(e.target.value)} disabled={!manager}>
                  <option value="">—</option>
                  {Object.entries(POSITIONS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                </Select>
              </Field>
              <Field label="Vị trí phụ">
                <Select value={f.secondaryPosition ?? ''} onChange={(e) => set('secondaryPosition')(e.target.value)} disabled={!manager}>
                  <option value="">—</option>
                  {Object.entries(POSITIONS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                </Select>
              </Field>
              <Field label="Trình độ">
                <Select value={f.level ?? ''} onChange={(e) => set('level')(e.target.value)} disabled={!manager}>
                  <option value="">—</option>
                  {Object.entries(LEVELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                </Select>
              </Field>
              {field('school', 'Trường')}
              {field('academy', 'Học viện')}
              {field('club', 'CLB hiện tại')}
            </div>
            <Field label="Giới thiệu" className="mt-3">
              <Textarea rows={4} value={f.bio ?? ''} onChange={(e) => set('bio')(e.target.value)} disabled={!manager} />
            </Field>
            <div className="mt-3"><Check label="Đã xác minh" checked={verified} onChange={(v) => manager && setVerified(v)} /></div>
          </Card>

          <Card title="Thành tích">
            <div className="space-y-2">
              {achievements.length === 0 && <p className="text-[14px] text-[#66766D]">Chưa có thành tích.</p>}
              {achievements.map((a, i) => (
                <div key={i} className="flex flex-wrap items-center gap-2 border border-[#DCE5DF] p-2">
                  <Select className="!w-32" value={a.type} disabled={!manager} onChange={(e) => setAchievements((l) => l.map((x, j) => (j === i ? { ...x, type: e.target.value } : x)))}>
                    {Object.entries(ACHIEVEMENT_TYPES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                  </Select>
                  <Input className="!w-auto min-w-[200px] flex-1" value={a.title} disabled={!manager} onChange={(e) => setAchievements((l) => l.map((x, j) => (j === i ? { ...x, title: e.target.value } : x)))} />
                  <Input className="!w-40" type="date" value={a.date} disabled={!manager} onChange={(e) => setAchievements((l) => l.map((x, j) => (j === i ? { ...x, date: e.target.value } : x)))} />
                  <Decide kind="achievements" item={a} />
                  {manager && <Button small variant="danger" onClick={() => setAchievements((l) => l.filter((_, j) => j !== i))}>Bỏ</Button>}
                </div>
              ))}
              {manager && <Button small onClick={() => setAchievements((l) => [...l, { type: 'INDIVIDUAL', title: '', date: '' }])}>+ Thêm thành tích</Button>}
            </div>
          </Card>

          <Card title="Video highlight">
            <div className="space-y-2">
              {highlights.length === 0 && <p className="text-[14px] text-[#66766D]">Chưa có highlight.</p>}
              {highlights.map((h, i) => (
                <div key={i} className="flex flex-wrap items-center gap-2 border border-[#DCE5DF] p-2">
                  <Input className="!w-auto min-w-[240px] flex-1" placeholder="https://" value={h.url} disabled={!manager} onChange={(e) => setHighlights((l) => l.map((x, j) => (j === i ? { ...x, url: e.target.value } : x)))} />
                  <Input className="!w-40" type="date" value={h.date} disabled={!manager} onChange={(e) => setHighlights((l) => l.map((x, j) => (j === i ? { ...x, date: e.target.value } : x)))} />
                  {h.id && <a href={h.url} target="_blank" rel="noreferrer" className="text-[13px] text-[#1F7A3A] underline">Mở</a>}
                  <Decide kind="highlights" item={h} />
                  {manager && <Button small variant="danger" onClick={() => setHighlights((l) => l.filter((_, j) => j !== i))}>Bỏ</Button>}
                </div>
              ))}
              {manager && <Button small onClick={() => setHighlights((l) => [...l, { url: '', date: '' }])}>+ Thêm highlight</Button>}
            </div>
          </Card>

          <Card title="Mạng xã hội">
            <div className="space-y-2">
              {socials.map((s, i) => (
                <div key={i} className="flex gap-2">
                  <Input placeholder="https://" value={s} disabled={!manager} onChange={(e) => setSocials((l) => l.map((x, j) => (j === i ? e.target.value : x)))} />
                  {manager && <Button small variant="danger" onClick={() => setSocials((l) => l.filter((_, j) => j !== i))}>Bỏ</Button>}
                </div>
              ))}
              {manager && <Button small onClick={() => setSocials((l) => [...l, ''])}>+ Thêm liên kết</Button>}
            </div>
          </Card>

          {manager && (
            <div className="flex gap-2">
              <Button variant="primary" disabled={saving} onClick={save}>{saving ? 'Đang lưu…' : 'Lưu hồ sơ'}</Button>
              <Button onClick={() => router.push('/quan-tri/cau-thu')}>Quay lại</Button>
            </div>
          )}
          <p className="text-[12px] text-[#66766D]">Khi lưu, thành tích và highlight giữ nguyên trạng thái duyệt nếu nội dung không đổi; mục mới hoặc đã sửa sẽ chờ duyệt.</p>
        </div>
      )}
    </>
  );
}
