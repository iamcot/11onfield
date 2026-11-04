'use client';

import { useCallback, useEffect, useRef, useState, type RefObject } from 'react';
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

/** What a message from the player says: it plays, it stopped, or nothing about that. */
export function playStateOf(control: 'youtube' | 'playerjs', data: unknown): 'playing' | 'stopped' | null {
  let m: Record<string, unknown> | null = null;
  try {
    m = typeof data === 'string' ? JSON.parse(data) : (data as Record<string, unknown>);
  } catch {
    return null;
  }
  if (!m || typeof m !== 'object') return null;
  if (control === 'youtube') {
    const info = m.info as Record<string, unknown> | number | undefined;
    const state =
      m.event === 'onStateChange' ? info : m.event === 'infoDelivery' && typeof info === 'object' && info !== null ? info.playerState : undefined;
    if (state === 1) return 'playing';
    if (state === 0 || state === 2) return 'stopped';
    return null;
  }
  if (m.context !== 'player.js') return null;
  if (m.event === 'play' || m.event === 'timeupdate') return 'playing';
  if (m.event === 'pause' || m.event === 'ended') return 'stopped';
  return null;
}

function isIOS(): boolean {
  if (typeof navigator === 'undefined') return false;
  // iPadOS says "Macintosh" but has a touch screen
  return /iPhone|iPad|iPod/.test(navigator.userAgent) || (navigator.userAgent.includes('Macintosh') && navigator.maxTouchPoints > 1);
}

const KICK_EVERY_MS = 500;
const KICK_FOR_MS = 8000;

/**
 * Follows the player inside the frame. Once it has loaded we ask it, muted, to play, every half second until
 * it says it plays (or 8 s pass): the autoplay flag in the address alone is not always taken. `playing` comes
 * from the player's own messages, never from what we asked, so it is false when the browser refused to start
 * the clip (iPhone in Low Power Mode, for one); the player's own play button is then left free to tap.
 */
function usePlayer(frame: RefObject<HTMLIFrameElement | null>, control: 'youtube' | 'playerjs' | null) {
  const [playing, setPlaying] = useState(false);
  const cleanup = useRef<() => void>(() => undefined);
  const stopKick = useRef<() => void>(() => undefined);

  const start = () => {
    cleanup.current();
    setPlaying(false);
    const el = frame.current;
    if (!el || !control) return;
    // iPhone / iPad: a play asked by message is refused there (no tap inside the frame), and the refused start
    // can leave the player stuck so its own play button does nothing; leave it to the autoplay flag and the tap
    let kicking = !isIOS();
    const kick = () => {
      // YouTube only reports its state after "listening"
      if (control === 'youtube') post(el, { event: 'listening', id: 'hv', channel: 'widget' });
      if (!kicking) return;
      command(el, control, 'mute');
      command(el, control, 'play');
    };
    const timer = window.setInterval(kick, KICK_EVERY_MS);
    const limit = window.setTimeout(() => endKick(), KICK_FOR_MS);
    function endKick() {
      kicking = false;
      window.clearInterval(timer);
      window.clearTimeout(limit);
    }
    const onMessage = (e: MessageEvent) => {
      if (e.source !== el.contentWindow) return;
      if (control === 'playerjs') {
        // player.js says "ready" when its methods work: ask it to tell us when it plays and stops
        try {
          const m = typeof e.data === 'string' ? JSON.parse(e.data) : e.data;
          if (m?.context === 'player.js' && m.event === 'ready') {
            for (const ev of ['play', 'pause', 'ended', 'timeupdate']) {
              post(el, { context: 'player.js', version: '0.0.11', method: 'addEventListener', value: ev, listener: `hv-${ev}` });
            }
          }
        } catch {
          /* not ours */
        }
      }
      const state = playStateOf(control, e.data);
      if (state === 'playing') {
        endKick();
        setPlaying(true);
      } else if (state === 'stopped') {
        setPlaying(false);
      }
    };
    window.addEventListener('message', onMessage);
    kick();
    stopKick.current = endKick;
    cleanup.current = () => {
      endKick();
      window.removeEventListener('message', onMessage);
    };
  };

  useEffect(() => () => cleanup.current(), []);
  return { playing, start, stopKick: () => stopKick.current() };
}

type HlsInstance = import('hls.js').default;

/**
 * An uploaded clip played in our own video element, like the Khám phá viewer of anylearn: the HLS playlist plays
 * natively on Safari and with hls.js elsewhere (loaded only here). Being our own element, it starts by itself
 * (muted) wherever the browser allows it, and a tap on it is a real tap: sound on, then pause / play.
 * `onFail` hands the clip back to Bunny's iframe player when the stream cannot be read.
 */
function ClipVideo({ src, poster, active, caption, onFail }: { src: string; poster: string | null; active: boolean; caption: string; onFail: () => void }) {
  const t = useT();
  const ref = useRef<HTMLVideoElement>(null);
  const hlsRef = useRef<HlsInstance | null>(null);
  const activeRef = useRef(active);
  const userPaused = useRef(false);
  const [muted, setMuted] = useState(true);
  const [paused, setPaused] = useState(false);
  const [waiting, setWaiting] = useState(false);

  const tryPlay = useCallback(() => {
    const video = ref.current;
    if (!video || !activeRef.current || userPaused.current) return;
    video.play().then(
      () => setPaused(false),
      () => setPaused(true), // refused (iPhone in Low Power Mode): the play button asks for a tap
    );
  }, []);

  useEffect(() => {
    const video = ref.current;
    if (!video) return;
    if (video.canPlayType('application/vnd.apple.mpegurl')) {
      video.src = src;
      return () => {
        video.removeAttribute('src');
        video.load();
      };
    }
    let cancelled = false;
    import('hls.js').then(({ default: Hls }) => {
      if (cancelled) return;
      if (!Hls.isSupported()) {
        onFail();
        return;
      }
      const instance = new Hls({ maxBufferLength: 30, startLevel: 0 });
      instance.on(Hls.Events.ERROR, (_e, data) => {
        if (data.fatal) onFail();
      });
      instance.loadSource(src);
      instance.attachMedia(video);
      hlsRef.current = instance;
      tryPlay();
    });
    return () => {
      cancelled = true;
      hlsRef.current?.destroy();
      hlsRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [src]);

  // on screen: play; off screen (the clips next to it stay loaded): pause and go back to the start
  useEffect(() => {
    activeRef.current = active;
    const video = ref.current;
    if (!video) return;
    if (active) {
      userPaused.current = false;
      tryPlay();
    } else {
      video.pause();
      try {
        video.currentTime = 0;
      } catch {
        /* not loaded yet */
      }
      video.muted = true;
      setMuted(true);
    }
  }, [active, tryPlay]);

  const tap = () => {
    const video = ref.current;
    if (!video) return;
    if (video.paused) {
      userPaused.current = false;
      video.play().then(() => setPaused(false), () => setPaused(true));
      return;
    }
    if (video.muted) {
      video.muted = false;
      setMuted(false);
      return;
    }
    userPaused.current = true;
    video.pause();
    setPaused(true);
  };

  return (
    <>
      <video
        ref={ref}
        className="pp-hv-video"
        poster={poster ?? undefined}
        playsInline
        loop
        muted={muted}
        autoPlay={active}
        preload={active ? 'auto' : 'metadata'}
        aria-label={caption}
        onCanPlay={tryPlay}
        onWaiting={() => setWaiting(true)}
        onPlaying={() => {
          setWaiting(false);
          setPaused(false);
        }}
        onError={onFail}
      />
      {active && (
        <button type="button" className="pp-hv-catch" onClick={tap} aria-label={paused ? t('Phát') : muted ? t('Bật tiếng') : t('Tạm dừng')}>
          {muted && !paused && (
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
          {waiting && !paused && <span className="spin" aria-hidden />}
        </button>
      )}
    </>
  );
}

function Slide({ h, active, poster }: { h: Highlight; active: boolean; poster: string | null }) {
  const t = useT();
  const frame = useRef<HTMLIFrameElement>(null);
  const [muted, setMuted] = useState(true);
  const src = sourceOf(h);
  const caption = h.title || platformName(h) || t('Video highlight');
  const player = usePlayer(frame, src.kind === 'frame' ? src.control : null);

  useEffect(() => {
    setMuted(true);
  }, [active]);

  const toggle = () => {
    if (src.kind !== 'frame' || !src.control) return;
    player.stopKick();
    if (muted) {
      // first tap: sound on, keep playing
      command(frame.current, src.control, 'unmute');
      command(frame.current, src.control, 'play');
      setMuted(false);
      return;
    }
    // the player then says it stopped: this layer goes away and its own play button shows
    command(frame.current, src.control, 'pause');
  };

  const [hlsFailed, setHlsFailed] = useState(false);
  const failHls = useCallback(() => setHlsFailed(true), []);

  if (h.hlsUrl && !hlsFailed) {
    return (
      <section className="pp-hv-slide">
        <ClipVideo src={h.hlsUrl} poster={poster} active={active} caption={caption} onFail={failHls} />
        <div className="pp-hv-cap">{caption}</div>
      </section>
    );
  }

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
            onLoad={player.start}
          />
          {/* only while the clip plays: a tap turns the sound on / pauses, a swipe on it scrolls the list.
              A clip that is not playing gets the tap itself, so the player's own play button works (a play
              asked by message is not a tap, and iPhone may refuse it) */}
          {src.control && player.playing && (
            <button type="button" className="pp-hv-catch" onClick={toggle} aria-label={muted ? t('Bật tiếng') : t('Tạm dừng')}>
              {muted && (
                <span className="unmute">
                  <IconSoundOff />
                  {t('Chạm để bật tiếng')}
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
