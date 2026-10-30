'use client';

import { useState, type ReactNode } from 'react';
import { IconPen, IconPlay, IconUpload } from '@/components/pp/icons';
import { useT } from '@/i18n/I18nProvider';
import { mediaService, type MediaConfig } from '@/services/media.service';
import type { Highlight } from '@/services/user.service';
import { VideoGuide } from './Guides';
import { ItemActions, ReviewFlag } from './ItemStatus';

/** YouTube thumbnail of a link, when we can tell the video id. */
function youtubeThumb(url: string): string | null {
  const m = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|shorts\/|embed\/))([\w-]{11})/);
  return m ? `https://img.youtube.com/vi/${m[1]}/hqdefault.jpg` : null;
}

/** A 9:16 card. Not approved yet (or no picture) = light grey card with the title and the review badge inside. */
function Clip({ h, badge }: { h: Highlight; badge?: ReactNode }) {
  const t = useT();
  const [playing, setPlaying] = useState(false);
  const [noPoster, setNoPoster] = useState(false);
  const poster = h.kind === 'VIDEO' ? h.posterUrl : youtubeThumb(h.url);
  const caption = h.title || (h.kind === 'VIDEO' ? t('Video highlight') : h.platform || t('Video highlight'));
  const body = (
    <>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      {poster && !noPoster && <img src={poster} alt="" loading="lazy" onError={() => setNoPoster(true)} />}
      {badge ? <span className="badge">{badge}</span> : <span className="src">{h.kind === 'VIDEO' ? '11 On Field' : h.platform || t('Link')}</span>}
      <span className="play">
        <IconPlay />
      </span>
      <span className="cap">{caption}</span>
    </>
  );
  const grey = h.approvalStatus !== 'APPROVED' || !poster || noPoster ? ' grey' : '';
  if (h.kind === 'VIDEO' && h.embedUrl) {
    return playing ? (
      <div className="pp-clip playing">
        <iframe src={h.embedUrl.replace('autoplay=false', 'autoplay=true')} title={caption} allow="autoplay; fullscreen; picture-in-picture" allowFullScreen loading="lazy" />
      </div>
    ) : (
      <button type="button" className={`pp-clip${grey}`} onClick={() => setPlaying(true)} aria-label={t('Xem {n}', { n: caption })}>
        {body}
      </button>
    );
  }
  return (
    <a className={`pp-clip${grey}`} href={h.url} target="_blank" rel="noopener noreferrer" aria-label={t('Xem {n}', { n: caption })}>
      {body}
    </a>
  );
}

/**
 * Highlight reel. The owner adds a link or uploads a video (to Bunny, under the size limit); new items are faded
 * with "Chờ duyệt" until the admin approves them, and can be hidden or deleted but not edited.
 */
export default function HighlightsBlock({
  items,
  owner,
  config,
  onChanged,
  toast,
}: {
  items: Highlight[];
  owner: boolean;
  config: MediaConfig | null;
  onChanged: () => void;
  toast: (text: string) => void;
}) {
  const t = useT();
  const [adding, setAdding] = useState(false);
  const [mode, setMode] = useState<'link' | 'video'>('link');
  const [url, setUrl] = useState('');
  const [title, setTitle] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState('');
  const [progress, setProgress] = useState<number | null>(null);
  const [busy, setBusy] = useState<number | null>(null);
  const maxBytes = config?.maxVideoBytes ?? 50 * 1024 * 1024;
  const maxMb = Math.round(maxBytes / 1024 / 1024);

  const reset = () => {
    setAdding(false);
    setUrl('');
    setTitle('');
    setFile(null);
    setError('');
    setProgress(null);
  };

  const save = async () => {
    setError('');
    try {
      if (mode === 'link') {
        if (!/^https?:\/\/\S+$/i.test(url.trim())) return setError(t('Dán link video bắt đầu bằng https://'));
        await mediaService.addLinkHighlight(url.trim(), title.trim() || undefined);
      } else {
        if (!file) return setError(t('Chọn một video'));
        if (file.size >= maxBytes) return setError(t('Video phải nhỏ hơn {n}MB', { n: maxMb }));
        setProgress(0);
        await mediaService.uploadVideoHighlight(file, title.trim(), setProgress);
      }
      reset();
      toast(t('Đã gửi highlight, chờ ban tổ chức duyệt'));
      onChanged();
    } catch (e) {
      setProgress(null);
      setError((e as { message?: string })?.message || t('Có lỗi xảy ra. Vui lòng thử lại.'));
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
    <div className="pp-panel of-cut pp-box pp-b-hl" id="highlights">
      <h3>
        {t('Highlight')}
        {items.length > 1 && <span className="pp-hud">{t('Vuốt ngang')}</span>}
      </h3>
      {owner && !adding && (
        <button className="pp-edit" onClick={() => setAdding(true)} aria-label={t('Thêm highlight')}>
          <IconPen />
        </button>
      )}
      {adding && (
        <div className="pp-inline" style={{ marginBottom: 14 }}>
          {config?.videoUpload && (
            <div className="pp-seg" role="group" aria-label={t('Cách thêm')} style={{ justifySelf: 'start' }}>
              <button type="button" aria-pressed={mode === 'link'} onClick={() => setMode('link')}>
                {t('Dán link')}
              </button>
              <button type="button" aria-pressed={mode === 'video'} onClick={() => setMode('video')}>
                <IconUpload />
                {t('Tải video')}
              </button>
            </div>
          )}
          <div className="pp-row2">
            {mode === 'link' ? (
              <label>
                {t('Link video (TikTok, YouTube, Facebook)')}
                <input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://" inputMode="url" />
              </label>
            ) : (
              <label>
                {t('Video (dưới {n}MB)', { n: maxMb })}
                <input type="file" accept="video/mp4,video/quicktime,video/*" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
              </label>
            )}
            <label>
              {t('Tiêu đề')}
              <input value={title} onChange={(e) => setTitle(e.target.value)} maxLength={200} placeholder={t('VD: Cú vô lê ngày tuyển trạch')} />
            </label>
          </div>
          {mode === 'video' && <VideoGuide maxMb={maxMb} />}
          {progress !== null && (
            <div>
              <div className="pp-progress" role="progressbar" aria-valuenow={progress} aria-valuemin={0} aria-valuemax={100}>
                <i style={{ transform: `scaleX(${progress / 100})` }} />
              </div>
              <p className="pp-mute" style={{ margin: '6px 0 0', fontSize: 12 }}>
                {t('Đang tải lên {n}%', { n: progress })}
              </p>
            </div>
          )}
          {error && <p className="err">{error}</p>}
          <p className="pp-mute" style={{ margin: 0, fontSize: 12 }}>
            {t('Highlight đã gửi không sửa được. Muốn đổi thì xóa và thêm lại để ban tổ chức duyệt lại.')}
          </p>
          <div className="pp-acts">
            <button className="pp-btn pp-btn-ghost pp-btn-sm of-cut" onClick={reset} disabled={progress !== null}>
              {t('Hủy')}
            </button>
            <button className="pp-btn pp-btn-lime pp-btn-sm of-cut" onClick={save} disabled={progress !== null}>
              {mode === 'video' ? t('Tải lên') : t('Lưu')}
            </button>
          </div>
        </div>
      )}
      {items.length === 0 ? (
        <p className="pp-mute" style={{ margin: 0, fontSize: 14 }}>
          {owner ? t('Chưa có highlight. Bấm cây bút để thêm link hoặc tải video lên.') : t('Chưa có highlight.')}
        </p>
      ) : (
        <div className="pp-reel">
          {items.map((h) => (
            <div key={h.id} className="pp-item-wrap">
              <div className={h.hidden ? 'pp-pending' : undefined}>
                <Clip h={h} badge={owner && (h.approvalStatus !== 'APPROVED' || h.hidden) ? <ReviewFlag status={h.approvalStatus} hidden={h.hidden} /> : undefined} />
              </div>
              {owner && (
                <>
                  <ItemActions
                    hidden={h.hidden}
                    busy={busy === h.id}
                    onHide={() => act(h.id, () => mediaService.hideHighlight(h.id, !h.hidden), h.hidden ? t('Đã hiện lại') : t('Đã ẩn'))}
                    onDelete={() => act(h.id, () => mediaService.deleteHighlight(h.id), t('Đã xóa'))}
                  />
                </>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
