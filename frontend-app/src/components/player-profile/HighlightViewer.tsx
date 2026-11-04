'use client';

import { useEffect, useRef, useState, type RefObject } from 'react';
import { createPortal } from 'react-dom';
import { IconClose, IconNext, IconPlay, IconPrev, IconSoundOff } from '@/components/pp/icons';
import { useT } from '@/i18n/I18nProvider';
import type { Highlight } from '@/services/user.service';

type Source =
  // `control` = the player listens to postMessage, so a tap on the video pauses / plays it
  | { kind: 'frame'; src: string; control: 'youtube' | 'playerjs' | null }
  | { kind: 'link'; href: string };

/** The platform name worth showing: "other" and our own Bunny clips say nothing useful. */
export function platformName(h: Highlight): string | null {
  const p = h.platform?.trim();
  return p && p !== 'other' && p !== 'bunny' ? p : null;
}

export function youtubeId(url: string): string | null {
  const m = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?(?:.*&)?v=|shorts\/|embed\/|live\/))([\w-]{11})/);
  return m ? m[1] : null;
}

/** How a highlight plays inside the viewer: our Bunny clip, YouTube, TikTok, Facebook, else a link out. */
export function sourceOf(h: Highlight): Source {
  if (h.kind === 'VIDEO' && h.embedUrl) {
    // browsers only start a video by itself when it is muted (always on iPhone, and after a swipe everywhere);
    // the first tap turns the sound on
    const src = h.embedUrl.replace('autoplay=false', 'autoplay=true').replace('preload=false', 'preload=true');
    return { kind: 'frame', src: src + '&muted=true&loop=true', control: 'playerjs' };
  }
  // a Bunny clip saved as a plain link (its player page) still plays here
  const bunny = h.url.match(/(?:iframe|player)\.mediadelivery\.net\/(?:play|embed)\/(\d+)\/([0-9a-fA-F-]{16,64})/);
  if (bunny) {
    return {
      kind: 'frame',
      src: `https://iframe.mediadelivery.net/embed/${bunny[1]}/${bunny[2]}?autoplay=true&preload=true&responsive=true&muted=true&loop=true`,
      control: 'playerjs',
    };
  }
  const yt = youtubeId(h.url);
  if (yt) {
    return { kind: 'frame', src: `https://www.youtube-nocookie.com/embed/${yt}?autoplay=1&mute=1&playsinline=1&rel=0&loop=1&playlist=${yt}&enablejsapi=1`, control: 'youtube' };
  }
  const tt = h.url.match(/tiktok\.com\/.*\/video\/(\d+)/);
  if (tt) return { kind: 'frame', src: `https://www.tiktok.com/player/v1/${tt[1]}?autoplay=1&loop=1&rel=0`, control: null };
  if (/facebook\.com|fb\.watch/.test(h.url)) {
    return { kind: 'frame', src: `https://www.facebook.com/plugins/video.php?href=${encodeURIComponent(h.url)}&autoplay=true&show_text=false`, control: null };
  }
  return { kind: 'link', href: h.url };
}

type Command = 'play' | 'pause' | 'mute' | 'unmute';
const YT: Record<Command, string> = { play: 'playVideo', pause: 'pauseVideo', mute: 'mute', unmute: 'unMute' };

function post(frame: HTMLIFrameElement | null, msg: object) {
  frame?.contentWindow?.postMessage(JSON.stringify(msg), '*');
}

function command(frame: HTMLIFrameElement | null, control: 'youtube' | 'playerjs', cmd: Command) {
  post(
    frame,
    control === 'youtube'
      ? { event: 'command', func: YT[cmd], args: [] }
      : { context: 'player.js', version: '0.0.11', method: cmd },
  );
}

/** True when a message from the player says the clip is playing. */
export function isPlayingMessage(control: 'youtube' | 'playerjs', data: unknown): boolean {
  let m: Record<string, unknown> | null = null;
  try {
    m = typeof data === 'string' ? JSON.parse(data) : (data as Record<string, unknown>);
  } catch {
    return false;
  }
  if (!m || typeof m !== 'object') return false;
  if (control === 'youtube') {
    const info = m.info as Record<string, unknown> | number | undefined;
    if (m.event === 'onStateChange') return info === 1;
    return m.event === 'infoDelivery' && typeof info === 'object' && info !== null && info.playerState === 1;
  }
  return m.context === 'player.js' && (m.event === 'play' || m.event === 'timeupdate');
}

const KICK_EVERY_MS = 500;
const KICK_FOR_MS = 8000;

/**
 * The autoplay flag in the address is not enough: the player may ignore it (it loads after the swipe, it was
 * not muted yet, the browser blocked it). Once the frame has loaded we ask it, muted, to play, every half
 * second until it says it is playing (or 8 s pass, or the person taps).
 */
function useKickPlay(frame: RefObject<HTMLIFrameElement | null>, control: 'youtube' | 'playerjs' | null) {
  const stop = useRef<() => void>(() => undefined);

  const start = () => {
    stop.current();
    const el = frame.current;
    if (!el || !control) return;
    let done = false;
    const onMessage = (e: MessageEvent) => {
      if (e.source !== el.contentWindow) return;
      if (control === 'playerjs') {
        // player.js says "ready" when its methods work: ask it to tell us when it plays
        try {
          const m = typeof e.data === 'string' ? JSON.parse(e.data) : e.data;
          if (m?.context === 'player.js' && m.event === 'ready') {
            post(el, { context: 'player.js', version: '0.0.11', method: 'addEventListener', value: 'play', listener: 'hv-play' });
            post(el, { context: 'player.js', version: '0.0.11', method: 'addEventListener', value: 'timeupdate', listener: 'hv-time' });
          }
        } catch {
          /* not ours */
        }
      }
      if (isPlayingMessage(control, e.data)) finish();
    };
    const kick = () => {
      // YouTube only reports its state after "listening"
      if (control === 'youtube') post(el, { event: 'listening', id: 'hv', channel: 'widget' });
      command(el, control, 'mute');
      command(el, control, 'play');
    };
    const timer = window.setInterval(kick, KICK_EVERY_MS);
    const limit = window.setTimeout(() => finish(), KICK_FOR_MS);
    function finish() {
      if (done) return;
      done = true;
      window.clearInterval(timer);
      window.clearTimeout(limit);
      window.removeEventListener('message', onMessage);
    }
    window.addEventListener('message', onMessage);
    kick();
    stop.current = finish;
  };

  useEffect(() => () => stop.current(), []);
  return { start, stop: () => stop.current() };
}

function Slide({ h, active, poster }: { h: Highlight; active: boolean; poster: string | null }) {
  const t = useT();
  const frame = useRef<HTMLIFrameElement>(null);
  const [paused, setPaused] = useState(false);
  const [muted, setMuted] = useState(true);
  const src = sourceOf(h);
  const caption = h.title || platformName(h) || t('Video highlight');
  const kick = useKickPlay(frame, src.kind === 'frame' ? src.control : null);

  useEffect(() => {
    setPaused(false);
    setMuted(true);
  }, [active]);

  const toggle = () => {
    if (src.kind !== 'frame' || !src.control) return;
    kick.stop();
    if (muted) {
      // first tap: sound on, keep playing
      command(frame.current, src.control, 'unmute');
      command(frame.current, src.control, 'play');
      setMuted(false);
      setPaused(false);
      return;
    }
    command(frame.current, src.control, paused ? 'play' : 'pause');
    setPaused(!paused);
  };

  return (
    <section className="pp-hv-slide">
      {active && src.kind === 'frame' ? (
        <>
          <iframe
            ref={frame}
            src={src.src}
            title={caption}
            allow="autoplay; fullscreen; picture-in-picture; encrypted-media"
            allowFullScreen
            onLoad={kick.start}
          />
          {/* a tap pauses / plays; a swipe on it scrolls the list, since it lives in our page and not in the player */}
          {src.control && (
            <button type="button" className="pp-hv-catch" onClick={toggle} aria-label={muted ? t('Bật tiếng') : paused ? t('Phát') : t('Tạm dừng')}>
              {muted && (
                <span className="unmute">
                  <IconSoundOff />
                  {t('Chạm để bật tiếng')}
                </span>
              )}
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
              {t('Mở trên {n}', { n: platformName(h) || t('trang gốc') })}
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
  const activeRef = useRef(start);
  activeRef.current = active;

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
    // going full screen (or turning the phone) changes the height of a clip: stay on the same clip, not between two
    const realign = () => {
      el.scrollTop = activeRef.current * el.clientHeight;
    };
    const ro = new ResizeObserver(realign);
    ro.observe(el);
    return () => {
      io.disconnect();
      ro.disconnect();
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
