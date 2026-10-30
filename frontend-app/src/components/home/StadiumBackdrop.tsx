'use client';

import { useEffect, useRef } from 'react';

type Mote = { x: number; y: number; r: number; vy: number; vx: number; ph: number; tw: number; gold: boolean };

function useParticles(ref: React.RefObject<HTMLCanvasElement>) {
  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    // Desktop only: on phones and tablets the motes cost more than they add (CoT, 2026-10-30)
    if (window.matchMedia('(hover: none)').matches) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let w = 0;
    let h = 0;
    let raf = 0;
    let motes: Mote[] = [];
    const dpr = Math.min(window.devicePixelRatio || 1, 1.5);

    // pre-rendered glow sprites: building a radial gradient per mote per frame is costly on phones
    const sprite = (c: string) => {
      const s = document.createElement('canvas');
      s.width = s.height = 32;
      const sc = s.getContext('2d')!;
      const g = sc.createRadialGradient(16, 16, 0, 16, 16, 16);
      g.addColorStop(0, `rgba(${c},1)`);
      g.addColorStop(1, `rgba(${c},0)`);
      sc.fillStyle = g;
      sc.fillRect(0, 0, 32, 32);
      return s;
    };
    const goldSprite = sprite('243,223,175');
    const limeSprite = sprite('214,250,170');

    const spawn = (anywhere: boolean): Mote => ({
      x: Math.random() * w,
      y: anywhere ? Math.random() * h : h + 10,
      r: 0.5 + Math.random() * 1.8,
      vy: 0.12 + Math.random() * 0.42,
      vx: (Math.random() - 0.5) * 0.15,
      ph: Math.random() * Math.PI * 2,
      tw: 0.01 + Math.random() * 0.03,
      gold: Math.random() < 0.65,
    });

    const resize = () => {
      const nw = window.innerWidth;
      // mobile browsers fire resize while the URL bar slides during a swipe: size to the tallest
      // viewport once and only respawn when the width really changes
      const nh = Math.max(window.innerHeight, h);
      if (nw === w && nh === h) return;
      const widthChanged = nw !== w;
      w = nw;
      h = nh;
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      if (widthChanged) {
        const count = w < 768 ? 22 : 70;
        motes = Array.from({ length: count }, () => spawn(true));
      }
    };

    const frame = () => {
      ctx.clearRect(0, 0, w, h);
      ctx.globalCompositeOperation = 'lighter';
      for (const m of motes) {
        m.ph += m.tw;
        m.y -= m.vy;
        m.x += m.vx + Math.sin(m.ph) * 0.12;
        if (m.y < -10 || m.x < -10 || m.x > w + 10) Object.assign(m, spawn(false));
        ctx.globalAlpha = 0.25 + 0.55 * (0.5 + 0.5 * Math.sin(m.ph * 2));
        const d = m.r * 8;
        ctx.drawImage(m.gold ? goldSprite : limeSprite, m.x - d / 2, m.y - d / 2, d, d);
      }
      ctx.globalAlpha = 1;
      raf = requestAnimationFrame(frame);
    };

    // Paused while the page is hidden or the user is typing: on phones the full-screen canvas redrawn every
    // frame competes with the keyboard and makes typed characters show up late.
    let typing = false;
    const run = () => {
      cancelAnimationFrame(raf);
      if (!document.hidden && !typing) raf = requestAnimationFrame(frame);
    };
    const onVisibility = run;
    const isField = (t: EventTarget | null) => t instanceof HTMLElement && t.matches('input, textarea, select, [contenteditable]');
    const onFocusIn = (e: FocusEvent) => {
      if (isField(e.target)) { typing = true; run(); }
    };
    const onFocusOut = (e: FocusEvent) => {
      if (isField(e.target) && !isField(e.relatedTarget)) { typing = false; run(); }
    };

    resize();
    raf = requestAnimationFrame(frame);
    window.addEventListener('resize', resize);
    document.addEventListener('visibilitychange', onVisibility);
    document.addEventListener('focusin', onFocusIn);
    document.addEventListener('focusout', onFocusOut);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', resize);
      document.removeEventListener('visibilitychange', onVisibility);
      document.removeEventListener('focusin', onFocusIn);
      document.removeEventListener('focusout', onFocusOut);
    };
  }, [ref]);
}

export default function StadiumBackdrop() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  useParticles(canvasRef);

  return (
    <div className="of-bg" aria-hidden="true">
      <div className="of-bg-photo" />
      <div className="of-bg-light">
        <span className="of-src of-src--l" />
        <span className="of-src of-src--r" />
        <span className="of-beam of-beam--l">
          <i />
        </span>
        <span className="of-beam of-beam--r">
          <i />
        </span>
        <span className="of-beam of-beam--core of-beam--l">
          <i />
        </span>
        <span className="of-beam of-beam--core of-beam--r">
          <i />
        </span>
      </div>
      <div className="of-haze of-haze--a" />
      <div className="of-haze of-haze--b" />
      <div className="of-bg-shade" />
      <canvas ref={canvasRef} className="of-particles" />
    </div>
  );
}
