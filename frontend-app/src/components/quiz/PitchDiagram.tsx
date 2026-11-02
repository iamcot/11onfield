'use client';

import { useRef, type PointerEvent as ReactPointerEvent } from 'react';
import type { Diagram } from '@/lib/quiz/diagram';
import { useI18n } from '@/i18n/I18nProvider';

/**
 * Football pitch drawn from a question's diagram JSON (coordinates 0..100, our team attacks to the right).
 * Read-only for players; with `onMove` the admin editor can drag players, the ball and arrow ends.
 * Motion uses only opacity and transform, and stops under prefers-reduced-motion.
 */
export type DragTarget = { kind: 'player' | 'ball' | 'from' | 'to'; index: number };

const W = 105;
const H = 68;
const sx = (x: number) => (x * W) / 100;
const sy = (y: number) => (y * H) / 100;

const ARROW = {
  run: { color: '#FFFFFF', dash: '1.6 1.2', width: 0.5 },
  pass: { color: '#FFD64D', dash: undefined, width: 0.55 },
  shot: { color: '#FF6B4A', dash: undefined, width: 0.8 },
  dribble: { color: '#A6E35A', dash: '0.4 0.8', width: 0.6 },
} as const;

export default function PitchDiagram({
  diagram,
  onMove,
  selected,
  onSelect,
  className = '',
  animate = true,
}: {
  diagram: Diagram;
  onMove?: (target: DragTarget, x: number, y: number) => void;
  selected?: DragTarget | null;
  onSelect?: (target: DragTarget | null) => void;
  className?: string;
  animate?: boolean;
}) {
  const { t } = useI18n();
  const svg = useRef<SVGSVGElement>(null);
  const drag = useRef<DragTarget | null>(null);
  const editable = !!onMove;

  function toPitch(e: ReactPointerEvent) {
    const el = svg.current;
    const m = el?.getScreenCTM();
    if (!el || !m) return null;
    const p = el.createSVGPoint();
    p.x = e.clientX;
    p.y = e.clientY;
    const q = p.matrixTransform(m.inverse());
    const clamp = (v: number) => Math.round(Math.max(0, Math.min(100, v)) * 10) / 10;
    return { x: clamp((q.x * 100) / W), y: clamp((q.y * 100) / H) };
  }
  const grab = (t: DragTarget) => (e: ReactPointerEvent) => {
    if (!editable) return;
    e.stopPropagation();
    (e.target as Element).setPointerCapture?.(e.pointerId);
    drag.current = t;
    onSelect?.(t);
  };
  const isSel = (t: DragTarget) => !!selected && selected.kind === t.kind && selected.index === t.index;

  const arrows = diagram.arrows || [];
  const players = diagram.players || [];
  const zones = diagram.zones || [];

  return (
    <svg
      ref={svg}
      viewBox={`-2 -2 ${W + 4} ${H + 4}`}
      className={`block w-full select-none touch-none ${className}`}
      role="img"
      aria-label={t('Sơ đồ tình huống trên sân')}
      onPointerMove={(e) => {
        if (!drag.current || !onMove) return;
        const p = toPitch(e);
        if (p) onMove(drag.current, p.x, p.y);
      }}
      onPointerUp={() => (drag.current = null)}
      onPointerLeave={() => (drag.current = null)}
      onPointerDown={() => editable && onSelect?.(null)}
    >
      <defs>
        {Object.entries(ARROW).map(([k, a]) => (
          <marker key={k} id={`qa-${k}`} viewBox="0 0 10 10" refX="8" refY="5" markerWidth="4" markerHeight="4" orient="auto-start-reverse">
            <path d="M0 0 L10 5 L0 10 z" fill={a.color} />
          </marker>
        ))}
      </defs>
      {/* grass with mowing stripes */}
      <rect x={-2} y={-2} width={W + 4} height={H + 4} fill="#1E6B3A" rx={1.5} />
      {Array.from({ length: 10 }, (_, i) => (
        <rect key={i} x={(i * W) / 10} y={0} width={W / 10} height={H} fill={i % 2 ? '#227541' : '#1F6E3C'} />
      ))}
      <g fill="none" stroke="rgba(255,255,255,0.75)" strokeWidth={0.35}>
        <rect x={0} y={0} width={W} height={H} />
        <line x1={W / 2} y1={0} x2={W / 2} y2={H} />
        <circle cx={W / 2} cy={H / 2} r={9.15} />
        <rect x={0} y={(H - 40.3) / 2} width={16.5} height={40.3} />
        <rect x={W - 16.5} y={(H - 40.3) / 2} width={16.5} height={40.3} />
        <rect x={0} y={(H - 18.3) / 2} width={5.5} height={18.3} />
        <rect x={W - 5.5} y={(H - 18.3) / 2} width={5.5} height={18.3} />
        <path d={`M16.5 ${H / 2 - 7.3} A9.15 9.15 0 0 1 16.5 ${H / 2 + 7.3}`} />
        <path d={`M${W - 16.5} ${H / 2 - 7.3} A9.15 9.15 0 0 0 ${W - 16.5} ${H / 2 + 7.3}`} />
        <rect x={-1.6} y={H / 2 - 3.66} width={1.6} height={7.32} stroke="rgba(255,255,255,0.9)" />
        <rect x={W} y={H / 2 - 3.66} width={1.6} height={7.32} stroke="rgba(255,255,255,0.9)" />
      </g>
      <circle cx={W / 2} cy={H / 2} r={0.4} fill="rgba(255,255,255,0.8)" />
      <circle cx={11} cy={H / 2} r={0.35} fill="rgba(255,255,255,0.8)" />
      <circle cx={W - 11} cy={H / 2} r={0.35} fill="rgba(255,255,255,0.8)" />
      <text x={W - 1} y={H - 1.2} textAnchor="end" fontSize={2.4} fill="rgba(255,255,255,0.55)" fontWeight={600}>
        {t('HƯỚNG TẤN CÔNG →')}
      </text>

      {zones.map((z, i) => (
        <g key={`z${i}`}>
          <rect x={sx(z.x)} y={sy(z.y)} width={sx(z.w)} height={sy(z.h)} fill="rgba(255,214,77,0.18)" stroke="rgba(255,214,77,0.8)" strokeWidth={0.3} strokeDasharray="1 0.8" rx={0.8} />
          {z.label && (
            <text x={sx(z.x) + 1} y={sy(z.y) + 3} fontSize={2.6} fill="#FFE694" fontWeight={700}>
              {z.label}
            </text>
          )}
        </g>
      ))}

      {arrows.map((a, i) => {
        const s = ARROW[a.kind] || ARROW.run;
        return (
          <g key={`a${i}`} className={animate ? 'motion-safe:animate-[quizFade_0.5s_ease-out_both]' : ''} style={animate ? { animationDelay: `${0.25 + i * 0.25}s` } : undefined}>
            <line
              x1={sx(a.from[0])}
              y1={sy(a.from[1])}
              x2={sx(a.to[0])}
              y2={sy(a.to[1])}
              stroke={s.color}
              strokeWidth={s.width}
              strokeDasharray={s.dash}
              strokeLinecap="round"
              markerEnd={`url(#qa-${a.kind})`}
            />
            {editable && (
              <>
                <circle cx={sx(a.from[0])} cy={sy(a.from[1])} r={1.2} fill={isSel({ kind: 'from', index: i }) ? '#FFD64D' : 'rgba(255,255,255,0.35)'} className="cursor-grab" onPointerDown={grab({ kind: 'from', index: i })} />
                <circle cx={sx(a.to[0])} cy={sy(a.to[1])} r={1.2} fill={isSel({ kind: 'to', index: i }) ? '#FFD64D' : 'rgba(255,255,255,0.35)'} className="cursor-grab" onPointerDown={grab({ kind: 'to', index: i })} />
              </>
            )}
          </g>
        );
      })}

      {players.map((p, i) => {
        const own = p.team !== 'opp';
        const tg = { kind: 'player' as const, index: i };
        return (
          <g key={`p${i}`} transform={`translate(${sx(p.x)} ${sy(p.y)})`} className={editable ? 'cursor-grab' : ''} onPointerDown={grab(tg)}>
            {p.me && (
              <circle r={3.4} fill="none" stroke="#FFD64D" strokeWidth={0.45} className={animate ? 'origin-center motion-safe:animate-[quizPulse_1.6s_ease-in-out_infinite]' : ''} style={{ transformBox: 'fill-box' }} />
            )}
            <circle r={2.1} fill={own ? '#A6E35A' : '#E8590C'} stroke={isSel(tg) ? '#FFFFFF' : own ? '#0B2419' : '#5A1E05'} strokeWidth={isSel(tg) ? 0.6 : 0.35} />
            {p.label && (
              <text y={0.9} textAnchor="middle" fontSize={2.3} fontWeight={800} fill={own ? '#0B2419' : '#FFFFFF'}>
                {p.label}
              </text>
            )}
            {p.me && (
              <text y={-3.9} textAnchor="middle" fontSize={2.3} fontWeight={800} fill="#FFD64D">
                {t('BẠN')}
              </text>
            )}
          </g>
        );
      })}

      {diagram.ball && (
        <g transform={`translate(${sx(diagram.ball.x)} ${sy(diagram.ball.y)})`} className={editable ? 'cursor-grab' : ''} onPointerDown={grab({ kind: 'ball', index: 0 })}>
          <circle r={1.05} fill="#FFFFFF" stroke={isSel({ kind: 'ball', index: 0 }) ? '#FFD64D' : '#0B2419'} strokeWidth={0.3} />
          <circle r={0.38} fill="#0B2419" />
        </g>
      )}
    </svg>
  );
}
