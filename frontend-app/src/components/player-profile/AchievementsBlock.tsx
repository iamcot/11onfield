'use client';

import { useState } from 'react';
import { IconPen, IconShield, IconTrophy } from '@/components/pp/icons';
import { useI18n } from '@/i18n/I18nProvider';
import { mediaService, type AchievementType } from '@/services/media.service';
import type { Achievement } from '@/services/user.service';
import { ItemActions, ReviewFlag } from './ItemStatus';

export type TypedAchievement = Achievement & { type: AchievementType };

const TYPE_LABEL: Record<AchievementType, string> = {
  INDIVIDUAL: 'Thành tích cá nhân',
  TEAM: 'Thành tích đồng đội',
  PARTICIPANT: 'Giải đã tham gia',
};

/** Achievements as a timeline. Same review rules as highlights: add, hide or delete, never edit. */
export default function AchievementsBlock({
  items,
  owner,
  onChanged,
  toast,
}: {
  items: TypedAchievement[];
  owner: boolean;
  onChanged: () => void;
  toast: (text: string) => void;
}) {
  const { t, intlLocale } = useI18n();
  const [adding, setAdding] = useState(false);
  const [type, setType] = useState<AchievementType>('INDIVIDUAL');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [busy, setBusy] = useState<number | null>(null);

  const sorted = [...items].sort((a, b) => (b.date ?? '').localeCompare(a.date ?? '') || b.id - a.id);
  const fmt = (d?: string) => (d ? new Date(d).toLocaleDateString(intlLocale, { day: '2-digit', month: '2-digit', year: 'numeric' }) : '');

  const reset = () => {
    setAdding(false);
    setTitle('');
    setDescription('');
    setDate('');
    setError('');
  };

  const save = async () => {
    if (!title.trim()) return setError(t('Cần nhập tên thành tích'));
    setSaving(true);
    try {
      await mediaService.addAchievement(type, title.trim(), description.trim() || undefined, date || undefined);
      reset();
      toast(t('Đã gửi thành tích, chờ ban tổ chức duyệt'));
      onChanged();
    } catch (e) {
      setError((e as { message?: string })?.message || t('Có lỗi xảy ra. Vui lòng thử lại.'));
    } finally {
      setSaving(false);
    }
  };

  const act = async (id: number, fn: () => Promise<void>, done: string) => {
    setBusy(id);
    try {
      await fn();
      toast(done);
      onChanged();
    } catch {
      toast(t('Có lỗi xảy ra. Vui lòng thử lại.'));
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="pp-panel of-cut pp-box pp-b-time" id="achievements">
      <h3>{t('Thành tích & hành trình')}</h3>
      {owner && !adding && (
        <button className="pp-edit" onClick={() => setAdding(true)} aria-label={t('Thêm thành tích')}>
          <IconPen />
        </button>
      )}
      {adding && (
        <div className="pp-inline" style={{ marginBottom: 14 }}>
          <div className="pp-row2">
            <label>
              {t('Loại')}
              <select value={type} onChange={(e) => setType(e.target.value as AchievementType)}>
                {(Object.keys(TYPE_LABEL) as AchievementType[]).map((k) => (
                  <option key={k} value={k}>
                    {t(TYPE_LABEL[k])}
                  </option>
                ))}
              </select>
            </label>
            <label>
              {t('Ngày')}
              <input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
            </label>
          </div>
          <label>
            {t('Thành tích')}
            <input value={title} onChange={(e) => setTitle(e.target.value)} maxLength={300} placeholder={t('VD: Vua phá lưới giải U19')} />
          </label>
          <label>
            {t('Mô tả (không bắt buộc)')}
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} maxLength={2000} />
          </label>
          {error && <p className="err">{error}</p>}
          <p className="pp-mute" style={{ margin: 0, fontSize: 12 }}>
            {t('Thành tích đã gửi không sửa được. Muốn đổi thì xóa và thêm lại để ban tổ chức duyệt lại.')}
          </p>
          <div className="pp-acts">
            <button className="pp-btn pp-btn-ghost pp-btn-sm of-cut" onClick={reset} disabled={saving}>
              {t('Hủy')}
            </button>
            <button className="pp-btn pp-btn-lime pp-btn-sm of-cut" onClick={save} disabled={saving}>
              {t('Lưu')}
            </button>
          </div>
        </div>
      )}
      {sorted.length === 0 ? (
        <p className="pp-mute" style={{ margin: 0, fontSize: 14 }}>
          {owner ? t('Chưa có thành tích. Bấm cây bút để thêm.') : t('Chưa có thành tích.')}
        </p>
      ) : (
        <div className="pp-tl">
          {sorted.map((a) => (
            <div key={a.id} className="pp-tli">
              <span className={`ic ${a.type === 'PARTICIPANT' ? '' : 'g'}`}>{a.type === 'PARTICIPANT' ? <IconShield /> : <IconTrophy />}</span>
              <div style={{ display: 'grid', gap: 4 }}>
                <div className={a.approvalStatus !== 'APPROVED' || a.hidden ? 'pp-pending' : undefined}>
                  {a.date && <time>{fmt(a.date)}</time>}
                  <h4>{a.title}</h4>
                  <p>{[t(TYPE_LABEL[a.type]), a.description].filter(Boolean).join(' · ')}</p>
                </div>
                {owner && (
                  <>
                    <ReviewFlag status={a.approvalStatus} hidden={a.hidden} />
                    <ItemActions
                      hidden={a.hidden}
                      busy={busy === a.id}
                      onHide={() => act(a.id, () => mediaService.hideAchievement(a.id, !a.hidden), a.hidden ? t('Đã hiện lại') : t('Đã ẩn'))}
                      onDelete={() => act(a.id, () => mediaService.deleteAchievement(a.id), t('Đã xóa'))}
                    />
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
