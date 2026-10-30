'use client';

import { useEffect, useRef, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { api, uploadImage, useApi } from '@/lib/admin/client';
import RichText from '@/components/admin/RichText';
import { sanitizeHtml, textToHtml } from '@/lib/sanitize-html';
import { ACHIEVEMENT_TYPES, APPROVAL, FEET, LEVELS, POSITIONS, fmtDate } from '@/lib/admin/labels';
import { useIsManager } from '@/components/admin/me';
import { Badge, Button, Card, Field, Input, LinkButton, Loading, PageTitle, Select, Toggle, useUi } from '@/components/admin/ui';

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
  const [tab, setTab] = useState<'info' | 'media'>('info');
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

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

  async function pickAvatar(file?: File) {
    if (!file) return;
    setUploading(true);
    try {
      set('avatar')(await uploadImage('avatar', file));
      toast('Đã tải ảnh lên, bấm Lưu hồ sơ để áp dụng');
    } catch (e) {
      toast((e as Error).message, 'error');
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  }

  const select = (k: string, label: string, options: Record<string, string>) => (
    <Field label={label}>
      <Select value={f[k] ?? ''} onChange={(e) => set(k)(e.target.value)} disabled={!manager}>
        <option value="">—</option>
        {Object.entries(options).map(([key, v]) => <option key={key} value={key}>{v}</option>)}
      </Select>
    </Field>
  );

  const p = detail.data;
  const pending = achievements.filter((a) => a.status === 'PENDING').length + highlights.filter((h) => h.status === 'PENDING').length;
  const ready = f.fullName !== undefined;
  const tabCls = (on: boolean) => `flex items-center gap-2 px-4 py-2.5 text-[14px] ${on ? 'border-b-2 border-[#1F7A3A] font-semibold text-[#1F6B32]' : 'text-[#46564D] hover:text-[#10231A]'}`;

  return (
    <>
      <PageTitle title={p?.fullName || 'Cầu thủ'} back={{ href: '/quan-tri/cau-thu', label: 'Danh sách cầu thủ' }}>
        {p && (
          <span className="flex items-center gap-2 rounded-md border border-[#DCE5DF] bg-white px-3 py-1.5 text-[14px]">
            <Toggle label="Đã xác minh" checked={verified} disabled={!manager} onChange={setVerified} />
            {verified ? 'Đã xác minh' : 'Chưa xác minh'}
          </span>
        )}
        {p && <LinkButton href={`/profile/${p.userid}`}>Trang công khai</LinkButton>}
        <LinkButton href={`/quan-tri/cau-thu/${id}/chi-so`}>Chỉ số</LinkButton>
        {manager && <Button variant="primary" disabled={saving || !ready} onClick={save}>{saving ? 'Đang lưu…' : 'Lưu hồ sơ'}</Button>}
      </PageTitle>
      <Loading error={detail.error} loading={detail.loading && !p} />
      {p && ready && (
        <div className="space-y-4">
          {!manager && <p className="rounded-md border border-[#E9CF95] bg-[#FDF6E7] px-3 py-2 text-[14px] text-[#8A5A00]">Bạn chỉ có quyền xem hồ sơ và duyệt thành tích, highlight.</p>}

          <nav className="flex gap-1 border-b border-[#DCE5DF]" role="tablist">
            <button type="button" role="tab" aria-selected={tab === 'info'} className={tabCls(tab === 'info')} onClick={() => setTab('info')}>Thông tin</button>
            <button type="button" role="tab" aria-selected={tab === 'media'} className={tabCls(tab === 'media')} onClick={() => setTab('media')}>
              Thành tích, highlight, MXH
              {pending > 0 && <span className="inline-flex h-5 min-w-[20px] items-center justify-center rounded-full bg-[#E8590C] px-1.5 text-[11px] font-bold text-white">{pending}</span>}
            </button>
          </nav>

          {/* Both tabs stay mounted so the rich-text editor keeps its content when switching. */}
          <div className={tab === 'info' ? 'space-y-4' : 'hidden'}>
            <div className="grid gap-4 xl:grid-cols-2">
              <Card title="Thông tin cơ bản">
                <div className="mb-5 flex flex-col items-center gap-3 sm:flex-row sm:items-end">
                  <div className="h-40 w-40 shrink-0 overflow-hidden rounded-2xl border border-[#DCE5DF] bg-[#F3F6F4]">
                    {f.avatar ? <img src={f.avatar} alt="Ảnh đại diện" className="h-full w-full object-cover" /> : <div className="flex h-full items-center justify-center text-[13px] text-[#66766D]">Chưa có ảnh</div>}
                  </div>
                  {manager && (
                    <div className="flex flex-col gap-2">
                      <input ref={fileRef} type="file" accept="image/*" hidden onChange={(e) => pickAvatar(e.target.files?.[0])} />
                      <Button disabled={uploading} onClick={() => fileRef.current?.click()}>{uploading ? 'Đang tải lên…' : 'Tải ảnh lên'}</Button>
                      {f.avatar && <Button small variant="danger" onClick={() => set('avatar')('')}>Bỏ ảnh</Button>}
                    </div>
                  )}
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  {field('fullName', 'Họ tên')}
                  {field('phone', 'Số điện thoại')}
                  {field('email', 'Email', { type: 'email' })}
                  {field('dob', 'Ngày sinh', { type: 'date' })}
                  {select('gender', 'Giới tính', { MALE: 'Nam', FEMALE: 'Nữ', OTHER: 'Khác' })}
                  <Field label="Tỉnh/thành">
                    <Select value={f.provinceId ?? ''} onChange={(e) => set('provinceId')(e.target.value)} disabled={!manager}>
                      <option value="">—</option>
                      {provinces.data?.map((x) => <option key={x.id} value={x.id}>{x.name}</option>)}
                    </Select>
                  </Field>
                  {field('personalId', 'CCCD / định danh')}
                  {field('address', 'Địa chỉ thường trú')}
                </div>
              </Card>

              <Card title="Thông tin cầu thủ">
                <div className="grid gap-3 sm:grid-cols-2">
                  {field('height', 'Chiều cao (cm)', { type: 'number' })}
                  {field('weight', 'Cân nặng (kg)', { type: 'number' })}
                  {select('preferredFoot', 'Chân thuận', FEET)}
                  {field('yearsOfExperience', 'Số năm kinh nghiệm', { type: 'number' })}
                  {select('positions', 'Vị trí chính', POSITIONS)}
                  {select('secondaryPosition', 'Vị trí phụ', POSITIONS)}
                  {select('level', 'Trình độ', LEVELS)}
                  {field('club', 'CLB hiện tại')}
                  {field('school', 'Trường')}
                  {field('academy', 'Học viện')}
                </div>
              </Card>
            </div>

            <Card title="Giới thiệu">
              {manager ? (
                <RichText key={p.id} value={textToHtml(f.bio ?? '')} imageType="news" height={260} simple onChange={(html) => set('bio')(html)} />
              ) : (
                <div className="text-[14px] [&_li]:ml-5 [&_ol]:list-decimal [&_ul]:list-disc" dangerouslySetInnerHTML={{ __html: f.bio ? sanitizeHtml(f.bio) : '<p>—</p>' }} />
              )}
            </Card>
          </div>

          <div className={tab === 'media' ? 'space-y-4' : 'hidden'}>
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

          <p className="text-[12px] text-[#66766D]">Khi lưu, thành tích và highlight giữ nguyên trạng thái duyệt nếu nội dung không đổi; mục mới hoặc đã sửa sẽ chờ duyệt.</p>
          </div>
        </div>
      )}
    </>
  );
}
