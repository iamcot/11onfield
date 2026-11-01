'use client';

import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from 'react';
import { useT } from '@/i18n/I18nProvider';
import type { HeroAnchor, HeroFacts, HeroPin } from '@/lib/players/hero';
import { IconDrag } from './icons';

export const FIGURE_IMG = '/images/players/figure-line.webp';

interface Props {
  /** Full-body cut-out; null shows the drawn figure. */
  image: string | null;
  bigText: string;
  name: string;
  /** What the stage shows around the player (see lib/players/hero). */
  facts: HeroFacts;
  /** Changing it replays the entrance animation (a new player in the drawer). */
  enterKey?: string | number;
  className?: string;
  children?: ReactNode;
}

type Pt = { x: number; y: number };
/** Body points as fractions of the photo's box. */
type Anchors = Record<HeroAnchor, Pt> & { side: 'l' | 'r' };

const PITCH_W = 520;
const PITCH_H = 300;
/** Gap between a card and the stage edge, as a share of the stage width. */
const EDGE = 0.03;
const cardWidth = (W: number) => (W < 420 ? 106 : 124);

/** Used until the photo is measured, or when its pixels cannot be read (another origin without CORS). */
function defaultAnchors(foot: 'l' | 'r'): Anchors {
  return { head: { x: 0.5, y: 0.07 }, thigh: { x: foot === 'r' ? 0.4 : 0.6, y: 0.62 }, foot: { x: foot === 'r' ? 0.64 : 0.36, y: 0.94 }, side: foot };
}

/**
 * Finds the head, the kicking (or preferred) foot and the other thigh from the cut-out's alpha, so the cards point
 * at the body whether the photo is a kick or the player standing straight.
 */
function measure(img: HTMLImageElement, prefer: 'l' | 'r'): Anchors | null {
  const H = 160;
  const W = Math.max(8, Math.round((img.naturalWidth / img.naturalHeight) * H));
  const c = document.createElement('canvas');
  c.width = W;
  c.height = H;
  const g = c.getContext('2d', { willReadFrequently: true });
  if (!g) return null;
  g.drawImage(img, 0, 0, W, H);
  let a: Uint8ClampedArray;
  try {
    a = g.getImageData(0, 0, W, H).data;
  } catch {
    return null; // tainted canvas
  }
  const on = (x: number, y: number) => a[(y * W + x) * 4 + 3] > 128;
  let top = -1;
  let bottom = -1;
  for (let y = 0; y < H && top < 0; y++) for (let x = 0; x < W; x++) if (on(x, y)) { top = y; break; }
  for (let y = H - 1; y >= 0 && bottom < 0; y--) for (let x = 0; x < W; x++) if (on(x, y)) { bottom = y; break; }
  if (top < 0 || bottom - top < H * 0.4) return null;
  const span = bottom - top;
  const rowMean = (y0: number, y1: number) => {
    let s = 0;
    let n = 0;
    for (let y = Math.round(y0); y <= Math.round(y1); y++) for (let x = 0; x < W; x++) if (on(x, y)) { s += x; n++; }
    return n ? s / n : W / 2;
  };
  const head = { x: rowMean(top, top + span * 0.08), y: top + span * 0.07 };
  const cx = rowMean(top + span * 0.2, top + span * 0.5);

  // the lower body's extremes: a kick sticks out to one side, a standing player has two feet at about the same distance
  let lx = W;
  let ly = bottom;
  let rx = -1;
  let ry = bottom;
  for (let y = Math.round(top + span * 0.6); y <= bottom; y++)
    for (let x = 0; x < W; x++)
      if (on(x, y)) {
        if (x < lx || (x === lx && y > ly)) { lx = x; ly = y; }
        if (x > rx || (x === rx && y > ry)) { rx = x; ry = y; }
      }
  const dl = cx - lx;
  const dr = rx - cx;
  const side: 'l' | 'r' = dr > dl * 1.25 ? 'r' : dl > dr * 1.25 ? 'l' : prefer;
  const inset = W * 0.04;
  const foot = side === 'r' ? { x: rx - inset, y: ry } : { x: lx + inset, y: ly };
  if (Math.abs(foot.y - bottom) < span * 0.06) foot.y = bottom - span * 0.035;

  // the other leg's thigh: the middle of the opaque run furthest to the other side
  const ty = Math.round(top + span * 0.64);
  const runs: [number, number][] = [];
  for (let x = 0, s = -1; x <= W; x++) {
    const o = x < W && on(x, ty);
    if (o && s < 0) s = x;
    if (!o && s >= 0) { runs.push([s, x - 1]); s = -1; }
  }
  let thigh = { x: cx, y: ty };
  if (runs.length) {
    const run = side === 'r' ? runs[0] : runs[runs.length - 1];
    const w = run[1] - run[0];
    const mid = (run[0] + run[1]) / 2;
    thigh = { x: runs.length > 1 ? mid : mid + (side === 'r' ? -w / 4 : w / 4), y: ty };
  }
  const f = (p: Pt) => ({ x: p.x / W, y: p.y / H });
  return { head: f(head), thigh: f(thigh), foot: f(foot), side };
}

/**
 * The 2.5D stage of the drawer and the profile: the player on a perspective pitch (the glow is their position, the
 * dots their other positions), the body facts and public Combine results pinned to the body, drag to spin the pitch.
 * 60 fps on phones: every frame only writes transforms, and the loop stops while the stage is off screen or the tab
 * is hidden.
 */
export default function PlayerStage({ image, bigText, name, facts, enterKey, className, children }: Props) {
  const t = useT();
  const root = useRef<HTMLDivElement>(null);
  const hero = useRef<HTMLDivElement>(null);
  const photo = useRef<HTMLImageElement>(null);
  const pitch = useRef<HTMLDivElement>(null);
  const gradId = useRef(`pp-z-${Math.random().toString(36).slice(2, 8)}`);
  const src = image || FIGURE_IMG;
  // a player facing the camera has the right foot on the left of the photo
  const prefer: 'l' | 'r' = facts.foot === 'left' ? 'r' : 'l';
  const [anchors, setAnchors] = useState<Anchors>(() => defaultAnchors(prefer));
  const [box, setBox] = useState<{ W: number; H: number; img: DOMRect | null }>({ W: 0, H: 0, img: null });

  useEffect(() => {
    const el = root.current;
    if (!el) return;
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const s = { angle: 0, vel: 0.12, tilt: 0, drag: false, lx: 0, raf: 0, visible: false };

    const paint = () => {
      if (!s.drag) {
        s.vel += (0.12 - s.vel) * 0.03;
        if (!reduce) s.angle += s.vel;
      }
      s.tilt += (Math.max(-1, Math.min(1, s.vel / 6)) * 6 - s.tilt) * 0.08;
      if (hero.current) hero.current.style.transform = `translateX(-50%) rotateY(${(s.tilt + Math.sin((s.angle * Math.PI) / 180) * 2).toFixed(2)}deg)`;
      if (pitch.current) pitch.current.style.transform = `rotateX(64deg) rotateZ(${(-14 + s.angle).toFixed(2)}deg)`;
    };

    const stop = () => {
      cancelAnimationFrame(s.raf);
      s.raf = 0;
    };
    const start = () => {
      if (s.raf || !s.visible || document.hidden) return;
      const loop = () => {
        paint();
        s.raf = requestAnimationFrame(loop);
      };
      s.raf = requestAnimationFrame(loop);
    };

    const down = (ev: PointerEvent) => {
      if ((ev.target as HTMLElement).closest('button,label,input,a,.upload,.pp-stage-guide')) return;
      s.drag = true;
      s.lx = ev.clientX;
      el.classList.add('drag');
      el.setPointerCapture(ev.pointerId);
    };
    const move = (ev: PointerEvent) => {
      if (!s.drag) return;
      const dx = ev.clientX - s.lx;
      s.lx = ev.clientX;
      s.angle += dx * 0.45;
      s.vel = dx * 0.45;
    };
    const up = () => {
      s.drag = false;
      el.classList.remove('drag');
    };
    const onVis = () => (document.hidden ? stop() : start());

    el.addEventListener('pointerdown', down);
    el.addEventListener('pointermove', move);
    el.addEventListener('pointerup', up);
    el.addEventListener('pointercancel', up);
    document.addEventListener('visibilitychange', onVis);
    const io = new IntersectionObserver(([en]) => {
      s.visible = en.isIntersecting;
      if (s.visible) start();
      else stop();
    });
    io.observe(el);
    paint();

    return () => {
      stop();
      io.disconnect();
      el.removeEventListener('pointerdown', down);
      el.removeEventListener('pointermove', move);
      el.removeEventListener('pointerup', up);
      el.removeEventListener('pointercancel', up);
      document.removeEventListener('visibilitychange', onVis);
    };
  }, []);

  // where the photo sits in the stage, for the leader lines (the photo is laid out without the frame's rotation)
  useLayoutEffect(() => {
    const el = root.current;
    const img = photo.current;
    if (!el || !img) return;
    const read = () => {
      const r = el.getBoundingClientRect();
      const h = hero.current;
      if (!h || !img.naturalWidth) return setBox({ W: r.width, H: r.height, img: null });
      const height = h.offsetHeight;
      const width = (img.naturalWidth / img.naturalHeight) * height;
      const left = h.offsetLeft - width / 2;
      setBox({ W: r.width, H: r.height, img: new DOMRect(left, h.offsetTop, width, height) });
    };
    read();
    img.addEventListener('load', read);
    const ro = new ResizeObserver(read);
    ro.observe(el);
    return () => {
      img.removeEventListener('load', read);
      ro.disconnect();
    };
  }, [src]);

  // body points of this photo
  useEffect(() => {
    let alive = true;
    setAnchors(defaultAnchors(prefer));
    const probe = new Image();
    probe.crossOrigin = 'anonymous';
    probe.onload = () => {
      if (!alive) return;
      const m = measure(probe, prefer);
      if (m) setAnchors(m);
    };
    probe.src = src;
    return () => {
      alive = false;
    };
  }, [src, prefer]);

  // replay the entrance when the player changes
  useEffect(() => {
    const el = root.current;
    if (!el) return;
    el.classList.remove('enter');
    void el.offsetWidth;
    el.classList.add('enter');
  }, [enterKey]);

  const tv = (vars?: Record<string, string | number>) =>
    vars && Object.fromEntries(Object.entries(vars).map(([k, v]) => [k, typeof v === 'string' ? v.split(' · ').map((x) => t(x)).join(' · ') : v]));

  // cards: anchored ones beside their body part, the side away from the photo's centre; free ones fill the left
  const img = box.img;
  const at = (a: HeroAnchor): Pt | null => (img ? { x: img.left + anchors[a].x * img.width, y: img.top + anchors[a].y * img.height } : null);
  // the head card goes on the kicking side, the thigh and loose cards (weight) on the other, the ruler opposite the head
  const kick = anchors.side;
  const other: 'l' | 'r' = kick === 'r' ? 'l' : 'r';
  const chipsTop = box.H - 76;
  const placed = facts.pins.map((p) => {
    const pt = p.anchor ? at(p.anchor) : null;
    const side = p.anchor === 'foot' || p.anchor === 'head' ? kick : other;
    const h = p.level != null ? 112 : 92; // about the card's height
    let y: number;
    if (!pt) y = box.H * 0.42;
    else if (p.anchor === 'head') y = pt.y - 64;
    else if (p.anchor === 'foot') y = pt.y + 14 + h < chipsTop ? pt.y + 14 : pt.y - h - 14;
    else y = pt.y - h / 2;
    return { p, pt, side, y: Math.max(40, Math.min(chipsTop - h, y)) };
  });
  // left edge of a card: at the stage edge on phones, near the photo on wide screens
  const cardX = (side: 'l' | 'r') => {
    const w = cardWidth(box.W);
    if (side === 'l') return Math.max(box.W * EDGE, img ? img.left - w - 70 : 0);
    return Math.min(box.W - box.W * EDGE - w, img ? img.left + img.width + 70 : box.W);
  };
  const headSide = placed.some((x) => x.p.anchor === 'head') ? kick : null;
  const rulerSide: 'l' | 'r' = headSide === 'l' ? 'r' : headSide === 'r' ? 'l' : other;
  const ruler =
    img && facts.height
      ? { x: rulerSide === 'l' ? img.left - 14 : img.left + img.width + 14, top: img.top, bottom: img.top + img.height }
      : null;

  return (
    <div ref={root} className={`pp-stage ${facts.combine ? 'combine' : ''} ${className ?? ''}`}>
      <div className="beam" />
      <div className="bignum">{bigText}</div>
      <div className="vname">{name}</div>
      <div className="pitch-wrap" aria-hidden="true">
        <div ref={pitch} className="pitch">
          <svg viewBox={`${(facts.primary?.x ?? PITCH_W / 2) - PITCH_W / 2} ${(facts.primary?.y ?? PITCH_H / 2) - PITCH_H / 2} ${PITCH_W} ${PITCH_H}`}>
            <defs>
              <radialGradient id={gradId.current}>
                <stop offset="0" stopColor="#c4f47e" stopOpacity=".75" />
                <stop offset=".6" stopColor="#a6e35a" stopOpacity=".22" />
                <stop offset="1" stopColor="#a6e35a" stopOpacity="0" />
              </radialGradient>
            </defs>
            <rect x="0" y="0" width={PITCH_W} height={PITCH_H} fill="#17331b" opacity=".85" />
            {[0, 104, 208, 312, 416].map((x) => (
              <rect key={x} x={x} width="52" height={PITCH_H} fill="#fff" opacity=".035" />
            ))}
            <g fill="none" stroke="#c4f47e" strokeOpacity=".55" strokeWidth="2">
              <rect x="10" y="10" width="500" height="280" />
              <line x1="260" y1="10" x2="260" y2="290" />
              <circle cx="260" cy="150" r="42" />
              <rect x="10" y="80" width="70" height="140" />
              <rect x="10" y="118" width="24" height="64" />
              <rect x="440" y="80" width="70" height="140" />
              <rect x="486" y="118" width="24" height="64" />
              <path d="M80 122 A30 30 0 0 1 80 178" />
              <path d="M440 122 A30 30 0 0 0 440 178" />
            </g>
            {facts.primary && <ellipse cx={facts.primary.x} cy={facts.primary.y} rx="92" ry="68" fill={`url(#${gradId.current})`} />}
            {facts.secondary.map((s) => (
              <g key={s.code} className="spot">
                <circle cx={s.x} cy={s.y} r="15" fill="#d6fa9e" fillOpacity=".22" stroke="#c4f47e" strokeOpacity=".7" strokeWidth="1.5" />
                <text x={s.x} y={s.y + 5}>{s.code}</text>
              </g>
            ))}
            {facts.primary && (
              <g className="spot main">
                <circle cx={facts.primary.x - 66} cy={facts.primary.y + 8} r="17" fill="#0c2a12" stroke="#c4f47e" strokeWidth="2" />
                <text x={facts.primary.x - 66} y={facts.primary.y + 14}>{facts.primary.code}</text>
              </g>
            )}
          </svg>
        </div>
      </div>
      <div ref={hero} className="hero">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img ref={photo} className="p" src={src} alt="" draggable={false} />
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img className="refl" src={src} alt="" draggable={false} />
      </div>

      {img && (
        <svg className="pp-lines" viewBox={`0 0 ${box.W} ${box.H}`} aria-hidden="true">
          {ruler && (
            <g className="ruler">
              <line x1={ruler.x} y1={ruler.top} x2={ruler.x} y2={ruler.bottom} />
              {[0.2, 0.4, 0.6, 0.8].map((f) => (
                <line key={f} x1={ruler.x - 4} x2={ruler.x + 4} y1={ruler.top + f * (ruler.bottom - ruler.top)} y2={ruler.top + f * (ruler.bottom - ruler.top)} />
              ))}
              <line className="cap" x1={ruler.x - 9} x2={ruler.x + 9} y1={ruler.top} y2={ruler.top} />
            </g>
          )}
          {placed.map(({ p, pt, side, y }) =>
            pt ? (
              <g key={p.key} className={p.tone}>
                <polyline points={leader(pt, side, y + 24, box.W, cardX(side))} />
                <circle cx={pt.x} cy={pt.y} r="4" className="dot" />
                <circle cx={pt.x} cy={pt.y} r="10" className="halo" />
              </g>
            ) : null,
          )}
        </svg>
      )}

      {ruler && facts.height && (
        <div className={`pp-pin ruler-label ${facts.heightLead ? '' : 'small'}`} style={{ left: Math.max(8, Math.min(box.W - 90, ruler.x - 22)), top: Math.max(42, ruler.top - (facts.heightLead ? 54 : 34)) }}>
          {facts.heightLead && <span className="k">{t('Chiều cao')}</span>}
          <b className="v">
            {facts.height}
            <small>cm</small>
          </b>
        </div>
      )}

      {img &&
        placed.map(({ p, side, y }) => <Pin key={p.key} pin={p} x={cardX(side)} y={y} width={cardWidth(box.W)} t={t} tv={tv} />)}

      {facts.chips.length > 0 && (
        <div className="pp-hchips">
          {facts.chips.map((c) => (
            <span key={c.text} className={`chip ${c.ok ? 'ok' : ''}`}>
              {t(c.text, tv(c.vars))}
            </span>
          ))}
        </div>
      )}
      <div className="hint">
        <IconDrag />
        {t('Kéo để xoay')}
      </div>
      {children}
    </div>
  );
}

/** Elbow line from the body point to the inner edge of its card. */
function leader(pt: Pt, side: 'l' | 'r', y: number, W: number, cardX: number): string {
  const edge = side === 'l' ? cardX + cardWidth(W) : cardX;
  const elbow = side === 'l' ? Math.max(edge + 10, Math.min(pt.x - 18, edge + 40)) : Math.min(edge - 10, Math.max(pt.x + 18, edge - 40));
  return `${pt.x},${pt.y} ${elbow},${y} ${edge},${y}`;
}

function Pin({
  pin,
  x,
  y,
  width,
  t,
  tv,
}: {
  pin: HeroPin;
  x: number;
  y: number;
  width: number;
  t: ReturnType<typeof useT>;
  tv: (v?: Record<string, string | number>) => Record<string, string | number> | undefined;
}) {
  return (
    <div className={`pp-pin ${pin.tone} ${pin.star ? 'star' : ''}`} style={{ left: x, top: y, width }}>
      <span className="k">{t(pin.label, tv(pin.labelVars))}</span>
      <b className="v">
        {pin.key === 'foot' ? t(pin.value) : pin.value}
        {pin.unit && <small>{pin.unit}</small>}
      </b>
      {pin.level != null && (
        <span className="lvl" role="img" aria-label={`${pin.level}/5`}>
          {[1, 2, 3, 4, 5].map((i) => (
            <i key={i} className={i <= pin.level! ? 'on' : ''} />
          ))}
        </span>
      )}
      {pin.sub && <span className={`sub ${pin.trend ?? ''}`}>{pin.star ? '⚡ ' : ''}{t(pin.sub, tv(pin.subVars))}</span>}
    </div>
  );
}
