'use client';

import { useEffect, useState } from 'react';

/** Wires the page-wide effects: scroll reveal, pointer spotlight, background parallax, header progress. */
export function usePageEffects(root: React.RefObject<HTMLDivElement>) {
  useEffect(() => {
    const el = root.current;
    if (!el) return;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add('is-in');
            io.unobserve(e.target);
          }
        });
      },
      { rootMargin: '0px 0px -8% 0px', threshold: 0.12 }
    );
    el.querySelectorAll('[data-reveal]').forEach((n) => io.observe(n));

    const onPointer = (e: PointerEvent) => {
      const spot = (e.target as HTMLElement).closest?.('.of-spot') as HTMLElement | null;
      if (spot) {
        const r = spot.getBoundingClientRect();
        spot.style.setProperty('--px', `${e.clientX - r.left}px`);
        spot.style.setProperty('--py', `${e.clientY - r.top}px`);
      }
      if (!reduced && e.pointerType === 'mouse') {
        el.style.setProperty('--of-mx', ((e.clientX / window.innerWidth) * 2 - 1).toFixed(3));
        el.style.setProperty('--of-my', ((e.clientY / window.innerHeight) * 2 - 1).toFixed(3));
      }
    };

    let raf = 0;
    const onScroll = () => {
      if (raf) return;
      raf = requestAnimationFrame(() => {
        raf = 0;
        const max = document.documentElement.scrollHeight - window.innerHeight;
        const y = window.scrollY;
        el.style.setProperty('--of-progress', max > 0 ? (y / max).toFixed(4) : '0');
        if (!reduced) el.style.setProperty('--of-sy', Math.min(1, y / (window.innerHeight * 2)).toFixed(4));
      });
    };

    onScroll();
    el.addEventListener('pointermove', onPointer, { passive: true });
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      io.disconnect();
      el.removeEventListener('pointermove', onPointer);
      window.removeEventListener('scroll', onScroll);
      cancelAnimationFrame(raf);
    };
  }, [root]);
}

/** 0..1 progress of an element through the viewport, used by scroll-filled rails. */
export function useScrollProgress(ref: React.RefObject<HTMLElement>) {
  const [p, setP] = useState(0);

  useEffect(() => {
    let raf = 0;
    const update = () => {
      raf = 0;
      const el = ref.current;
      if (!el) return;
      const r = el.getBoundingClientRect();
      const vh = window.innerHeight;
      const isDesktop = window.innerWidth >= 1024;
      // desktop: fill while the row crosses the middle; mobile: follow the list
      const start = vh * (isDesktop ? 0.85 : 0.7);
      const span = isDesktop ? vh * 0.45 : r.height;
      setP(Math.max(0, Math.min(1, (start - r.top) / span)));
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };
    update();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
      cancelAnimationFrame(raf);
    };
  }, [ref]);

  return p;
}
