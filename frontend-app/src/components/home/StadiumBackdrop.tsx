'use client';

import { useEffect, useRef } from 'react';

type Mote = { x: number; y: number; r: number; vy: number; vx: number; ph: number; tw: number; gold: boolean };

function useParticles(ref: React.RefObject<HTMLCanvasElement>) {
  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let w = 0;
    let h = 0;
    let raf = 0;
    let motes: Mote[] = [];
    const dpr = Math.min(window.devicePixelRatio || 1, 1.5);

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
      w = window.innerWidth;
      h = window.innerHeight;
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const count = w < 768 ? 38 : 80;
      motes = Array.from({ length: count }, () => spawn(true));
    };

    const frame = () => {
      ctx.clearRect(0, 0, w, h);
      ctx.globalCompositeOperation = 'lighter';
      for (const m of motes) {
        m.ph += m.tw;
        m.y -= m.vy;
        m.x += m.vx + Math.sin(m.ph) * 0.12;
        if (m.y < -10 || m.x < -10 || m.x > w + 10) Object.assign(m, spawn(false));
        const a = 0.25 + 0.55 * (0.5 + 0.5 * Math.sin(m.ph * 2));
        const g = ctx.createRadialGradient(m.x, m.y, 0, m.x, m.y, m.r * 4);
        const c = m.gold ? '243,223,175' : '214,250,170';
        g.addColorStop(0, `rgba(${c},${a})`);
        g.addColorStop(1, `rgba(${c},0)`);
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(m.x, m.y, m.r * 4, 0, Math.PI * 2);
        ctx.fill();
      }
      raf = requestAnimationFrame(frame);
    };

    const onVisibility = () => {
      cancelAnimationFrame(raf);
      if (!document.hidden) raf = requestAnimationFrame(frame);
    };

    resize();
    raf = requestAnimationFrame(frame);
    window.addEventListener('resize', resize);
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', resize);
      document.removeEventListener('visibilitychange', onVisibility);
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
