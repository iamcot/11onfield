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
            // an attribute, not a class: React rewrites className on re-render and would drop it
            e.target.setAttribute('data-in', '');
            io.unobserve(e.target);
          }
        });
      },
      { rootMargin: '0px 0px -8% 0px', threshold: 0.12 }
    );
    const watch = (scope: ParentNode) => scope.querySelectorAll('[data-reveal]:not([data-in])').forEach((n) => io.observe(n));
    watch(el);
    // sections that render later (API data) still need to be revealed
    const mo = new MutationObserver(() => watch(el));
    mo.observe(el, { childList: true, subtree: true });

    // Scroll/pointer vars go on the few elements that read them, never on the root:
    // a custom property changed on the root restyles every descendant each frame (scroll jank).
    const bg = el.querySelector<HTMLElement>('.of-bg');
    const touch = window.matchMedia('(hover: none)').matches;
    const onPointer = (e: PointerEvent) => {
      const spot = (e.target as HTMLElement).closest?.('.of-spot') as HTMLElement | null;
      if (spot) {
        const r = spot.getBoundingClientRect();
        spot.style.setProperty('--px', `${e.clientX - r.left}px`);
        spot.style.setProperty('--py', `${e.clientY - r.top}px`);
      }
      if (!reduced && e.pointerType === 'mouse' && bg) {
        bg.style.setProperty('--of-mx', ((e.clientX / window.innerWidth) * 2 - 1).toFixed(3));
        bg.style.setProperty('--of-my', ((e.clientY / window.innerHeight) * 2 - 1).toFixed(3));
      }
    };

    let raf = 0;
    const onScroll = () => {
      if (raf) return;
      raf = requestAnimationFrame(() => {
        raf = 0;
        const max = document.documentElement.scrollHeight - window.innerHeight;
        const y = window.scrollY;
        const progress = max > 0 ? (y / max).toFixed(4) : '0';
        el.querySelectorAll<HTMLElement>('.of-header-progress').forEach((n) => n.style.setProperty('--of-progress', progress));
        // background parallax is skipped on touch: moving the photo under blurred layers is costly there
        if (!reduced && !touch && bg) bg.style.setProperty('--of-sy', Math.min(1, y / (window.innerHeight * 2)).toFixed(4));
      });
    };

    onScroll();
    el.addEventListener('pointermove', onPointer, { passive: true });
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      io.disconnect();
      mo.disconnect();
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
      // rounded so React skips re-renders while the value is unchanged
      setP(Math.round(Math.max(0, Math.min(1, (start - r.top) / span)) * 100) / 100);
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
