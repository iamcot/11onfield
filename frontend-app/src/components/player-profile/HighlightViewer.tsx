'use client';

import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { IconClose, IconNext, IconPlay, IconPrev } from '@/components/pp/icons';
import { useT } from '@/i18n/I18nProvider';
import type { Highlight } from '@/services/user.service';

type Source =
  // `control` = the player listens to postMessage, so a tap on the video pauses / plays it
  | { kind: 'frame'; src: string; control: 'youtube' | 'playerjs' | null }
  | { kind: 'link'; href: string };

export function youtubeId(url: string): string | null {
  const m = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?(?:.*&)?v=|shorts\/|embed\/|live\/))([\w-]{11})/);
  return m ? m[1] : null;
}

/** How a highlight plays inside the viewer: our Bunny clip, YouTube, TikTok, Facebook, else a link out. */
export function sourceOf(h: Highlight): Source {
  if (h.kind === 'VIDEO' && h.embedUrl) {
    return { kind: 'frame', src: h.embedUrl.replace('autoplay=false', 'autoplay=true') + '&loop=true', control: 'playerjs' };
  }
  const yt = youtubeId(h.url);
  if (yt) {
    return { kind: 'frame', src: `https://www.youtube-nocookie.com/embed/${yt}?autoplay=1&playsinline=1&rel=0&loop=1&playlist=${yt}&enablejsapi=1`, control: 'youtube' };
  }
  const tt = h.url.match(/tiktok\.com\/.*\/video\/(\d+)/);
  if (tt) return { kind: 'frame', src: `https://www.tiktok.com/player/v1/${tt[1]}?autoplay=1&loop=1&rel=0`, control: null };
  if (/facebook\.com|fb\.watch/.test(h.url)) {
    return { kind: 'frame', src: `https://www.facebook.com/plugins/video.php?href=${encodeURIComponent(h.url)}&autoplay=true&show_text=false`, control: null };
  }
  return { kind: 'link', href: h.url };
}

function command(frame: HTMLIFrameElement | null, control: 'youtube' | 'playerjs', play: boolean) {
  const msg =
    control === 'youtube'
      ? { event: 'command', func: play ? 'playVideo' : 'pauseVideo', args: [] }
      : { context: 'player.js', version: '0.0.11', method: play ? 'play' : 'pause' };
  frame?.contentWindow?.postMessage(JSON.stringify(msg), '*');
}

function Slide({ h, active, poster }: { h: Highlight; active: boolean; poster: string | null }) {
  const t = useT();
  const frame = useRef<HTMLIFrameElement>(null);
  const [paused, setPaused] = useState(false);
  const src = sourceOf(h);
  const caption = h.title || h.platform || t('Video highlight');

  useEffect(() => setPaused(false), [active]);

  const toggle = () => {
    if (src.kind !== 'frame' || !src.control) return;
    command(frame.current, src.control, paused);
    setPaused(!paused);
  };

  return (
    <section className="pp-hv-slide">
      {active && src.kind === 'frame' ? (
        <>
          <iframe ref={frame} src={src.src} title={caption} allow="autoplay; fullscreen; picture-in-picture; encrypted-media" allowFullScreen />
          {/* a tap pauses / plays; a swipe on it scrolls the list, since it lives in our page and not in the player */}
          {src.control && (
            <button type="button" className="pp-hv-catch" onClick={toggle} aria-label={paused ? t('Phát') : t('Tạm dừng')}>
              {paused && (
                <span className="play">
                  <IconPlay />
                </span>
              )}
            </button>
          )}
        </>
      ) : (
        <div className="pp-hv-poster">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          {poster && <img src={poster} alt="" />}
          {src.kind === 'link' && (
            <a className="pp-btn pp-btn-lime of-cut" href={src.href} target="_blank" rel="noopener noreferrer">
              {t('Mở trên {n}', { n: h.platform || t('trang gốc') })}
            </a>
          )}
        </div>
      )}
      <div className="pp-hv-cap">{caption}</div>
    </section>
  );
}

/**
 * Full-screen highlight viewer: one clip per screen, swipe up / down (or arrows, keyboard) for the next one.
 * Only the clip on screen loads its player; the others show their picture.
 */
export default function HighlightViewer({
  items,
  start,
  posterOf,
  onClose,
}: {
  items: Highlight[];
  start: number;
  posterOf: (h: Highlight) => string | null;
  onClose: () => void;
}) {
  const t = useT();
  const list = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(start);

  useEffect(() => {
    const el = list.current;
    if (!el) return;
    el.scrollTop = start * el.clientHeight;
    document.body.style.overflow = 'hidden';
    // a real full screen where the browser allows it (Android, desktop); iPhone keeps the fixed overlay
    document.documentElement.requestFullscreen?.().catch(() => undefined);
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) if (e.isIntersecting) setActive(Number((e.target as HTMLElement).dataset.i));
      },
      { root: el, threshold: 0.6 },
    );
    Array.from(el.children).forEach((c) => io.observe(c));
    return () => {
      io.disconnect();
      document.body.style.overflow = '';
      if (document.fullscreenElement) document.exitFullscreen().catch(() => undefined);
    };
  }, [start]);

  const go = (d: number) => {
    const el = list.current;
    if (el) el.scrollTo({ top: Math.max(0, Math.min(items.length - 1, active + d)) * el.clientHeight, behavior: 'smooth' });
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowDown') go(1);
      if (e.key === 'ArrowUp') go(-1);
    };
    const onFs = () => {
      // leaving the browser's full screen (back gesture, Esc) closes the viewer too
      if (!document.fullscreenElement) onClose();
    };
    window.addEventListener('keydown', onKey);
    document.addEventListener('fullscreenchange', onFs);
    return () => {
      window.removeEventListener('keydown', onKey);
      document.removeEventListener('fullscreenchange', onFs);
    };
  });

  return createPortal(
    <div className="pp pp-hv" role="dialog" aria-modal="true" aria-label={t('Highlight')}>
      <div className="pp-hv-list" ref={list}>
        {items.map((h, i) => (
          <div key={h.id} data-i={i} className="pp-hv-cell">
            {Math.abs(i - active) <= 1 ? <Slide h={h} active={i === active} poster={posterOf(h)} /> : null}
          </div>
        ))}
      </div>
      <div className="pp-hv-top">
        <span className="pp-hud">
          {active + 1} / {items.length}
        </span>
        <button className="pp-icb" onClick={onClose} aria-label={t('Đóng')}>
          <IconClose />
        </button>
      </div>
      {items.length > 1 && (
        <div className="pp-hv-nav">
          <button className="pp-icb" onClick={() => go(-1)} disabled={active === 0} aria-label={t('Clip trước')}>
            <IconPrev />
          </button>
          <button className="pp-icb" onClick={() => go(1)} disabled={active === items.length - 1} aria-label={t('Clip sau')}>
            <IconNext />
          </button>
        </div>
      )}
    </div>,
    document.body,
  );
}
