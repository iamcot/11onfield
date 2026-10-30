'use client';

import { useEffect, useRef, type ReactNode } from 'react';
import { fxEnabled } from '@/lib/fx';
import { useT } from '@/i18n/I18nProvider';
import { IconDrag } from './icons';

export const FIGURE_IMG = '/images/players/figure-line.webp';

interface Props {
  /** Full-body cut-out; null shows the drawn figure. */
  image: string | null;
  bigText: string;
  name: string;
  keys: string[];
  values: number[];
  /** Profile stats are blue, council stats lime. */
  profile: boolean;
  /** Changing it replays the entrance animation (a new player in the drawer). */
  enterKey?: string | number;
  className?: string;
  children?: ReactNode;
}

/**
 * The 2.5D stage of the drawer and the profile: the player on a lit floor, six stat chips orbiting around, drag to
 * spin. 60 fps on phones: every frame only writes transform and opacity, sparkles are one pre-drawn sprite on a canvas
 * (1x pixel ratio on touch screens), and the loop stops while the stage is off screen or the tab is hidden.
 */
export default function PlayerStage({ image, bigText, name, keys, values, profile, enterKey, className, children }: Props) {
  const t = useT();
  const root = useRef<HTMLDivElement>(null);
  const hero = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const r1 = useRef<SVGEllipseElement>(null);
  const r2 = useRef<SVGEllipseElement>(null);
  const orbs = useRef<(HTMLDivElement | null)[]>([]);
  const gradId = useRef(`pp-fl-${Math.random().toString(36).slice(2, 8)}`);

  useEffect(() => {
    const el = root.current;
    const cv = canvas.current;
    if (!el || !cv) return;
    const ctx = cv.getContext('2d');
    if (!ctx) return;
    const touch = window.matchMedia('(hover: none)').matches;
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const s = { angle: 0, vel: 0.18, tilt: 0, drag: false, lx: 0, W: 0, H: 0, raf: 0, visible: false };
    let parts: { x: number; y: number; v: number; s: number }[] = [];

    const sprite = document.createElement('canvas');
    sprite.width = sprite.height = 16;
    const sg = sprite.getContext('2d')!;
    const gr = sg.createRadialGradient(8, 8, 0, 8, 8, 8);
    gr.addColorStop(0, 'rgba(214,250,158,1)');
    gr.addColorStop(1, 'rgba(214,250,158,0)');
    sg.fillStyle = gr;
    sg.fillRect(0, 0, 16, 16);

    const size = () => {
      const r = el.getBoundingClientRect();
      if (!r.width) return;
      s.W = r.width;
      s.H = r.height;
      const d = touch ? 1 : Math.min(1.5, window.devicePixelRatio || 1);
      cv.width = Math.round(r.width * d);
      cv.height = Math.round(r.height * d);
      ctx.setTransform(d, 0, 0, d, 0, 0);
      parts = Array.from({ length: touch ? 16 : 34 }, () => ({ x: Math.random() * r.width, y: Math.random() * r.height, v: 0.2 + Math.random() * 0.6, s: 2 + Math.random() * 4 }));
    };

    const paint = () => {
      if (!s.W) {
        size();
        if (!s.W) return;
      }
      if (!s.drag) {
        s.vel += (0.18 - s.vel) * 0.03;
        if (!reduce) s.angle += s.vel;
      }
      s.tilt += (Math.max(-1, Math.min(1, s.vel / 6)) * 14 - s.tilt) * 0.08;
      if (hero.current) hero.current.style.transform = `translateX(-50%) rotateY(${(s.tilt + Math.sin((s.angle * Math.PI) / 180) * 6).toFixed(2)}deg)`;
      const R = Math.min(s.W * 0.42, 260);
      const cy = s.H * 0.48;
      const count = orbs.current.length || 1;
      orbs.current.forEach((o, j) => {
        if (!o) return;
        const a = ((s.angle + (j * 360) / count) * Math.PI) / 180;
        const x = Math.sin(a) * R;
        const z = Math.cos(a);
        const y = cy + (j % 2 ? -1 : 1) * s.H * 0.12 + (j - 2.5) * 6;
        const k = 0.72 + (0.28 * (z + 1)) / 2;
        o.style.transform = `translate3d(calc(-50% + ${x.toFixed(1)}px),calc(-50% + ${y.toFixed(1)}px),0) scale(${k.toFixed(3)})`;
        o.style.opacity = (0.3 + (0.7 * (z + 1)) / 2).toFixed(2);
        o.style.zIndex = z > 0 ? '14' : '5';
      });
      if (r1.current) r1.current.style.transform = `rotate(${(s.angle * 0.25).toFixed(1)}deg)`;
      if (r2.current) r2.current.style.transform = `rotate(${(-s.angle * 0.18).toFixed(1)}deg)`;
      ctx.clearRect(0, 0, s.W, s.H);
      if (fxEnabled() && !reduce) {
        ctx.globalCompositeOperation = 'lighter';
        ctx.globalAlpha = 0.6;
        for (const p of parts) {
          p.y -= p.v;
          if (p.y < 0) {
            p.y = s.H;
            p.x = Math.random() * s.W;
          }
          ctx.drawImage(sprite, p.x - p.s, p.y - p.s, p.s * 2, p.s * 2);
        }
        ctx.globalAlpha = 1;
      }
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
    const ro = new ResizeObserver(size);
    ro.observe(el);
    paint();

    return () => {
      stop();
      io.disconnect();
      ro.disconnect();
      el.removeEventListener('pointerdown', down);
      el.removeEventListener('pointermove', move);
      el.removeEventListener('pointerup', up);
      el.removeEventListener('pointercancel', up);
      document.removeEventListener('visibilitychange', onVis);
    };
  }, []);

  // replay the entrance when the player changes
  useEffect(() => {
    const el = root.current;
    if (!el) return;
    el.classList.remove('enter');
    void el.offsetWidth;
    el.classList.add('enter');
  }, [enterKey]);

  const src = image || FIGURE_IMG;
  orbs.current.length = keys.length;

  return (
    <div ref={root} className={`pp-stage ${className ?? ''}`}>
      <div className="beam" />
      <div className="bignum">{bigText}</div>
      <div className="vname">{name}</div>
      <div className="floor">
        <svg viewBox="0 0 300 100" aria-hidden="true">
          <defs>
            <radialGradient id={gradId.current}>
              <stop offset="0" stopColor="#c4f47e" stopOpacity=".45" />
              <stop offset="1" stopColor="#c4f47e" stopOpacity="0" />
            </radialGradient>
          </defs>
          <ellipse cx="150" cy="50" rx="150" ry="50" fill={`url(#${gradId.current})`} />
          <ellipse ref={r1} className="r1" cx="150" cy="50" rx="138" ry="44" fill="none" stroke="#a6e35a" strokeWidth="1.6" strokeDasharray="2 9" />
          <ellipse ref={r2} className="r2" cx="150" cy="50" rx="112" ry="35" fill="none" stroke="#e3c27e" strokeOpacity=".7" strokeWidth="1" strokeDasharray="40 14 4 14" />
          <ellipse cx="150" cy="50" rx="78" ry="24" fill="none" stroke="#c4f47e" strokeOpacity=".9" strokeWidth="2" />
        </svg>
      </div>
      <div ref={hero} className="hero">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img className="p" src={src} alt="" draggable={false} />
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img className="refl" src={src} alt="" draggable={false} />
      </div>
      <canvas ref={canvas} />
      <div aria-hidden="true">
        {keys.map((k, j) => (
          <div key={k} ref={(n) => { orbs.current[j] = n; }} className={`pp-orb ${profile ? 'auto' : ''}`}>
            <div>
              <b>{values[j]}</b>
              <span>{k.toUpperCase()}</span>
            </div>
          </div>
        ))}
      </div>
      <div className="hint">
        <IconDrag />
        {t('Kéo để xoay')}
      </div>
      {children}
    </div>
  );
}
