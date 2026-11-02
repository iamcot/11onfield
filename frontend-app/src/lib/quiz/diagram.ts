/** Pitch diagram of a quiz question (same shape as the backend's QuizDiagram). Coordinates 0..100. */
export type ArrowKind = 'run' | 'pass' | 'shot' | 'dribble';
export interface DiagramPlayer { team: 'own' | 'opp'; x: number; y: number; label?: string; me?: boolean }
export interface DiagramArrow { kind: ArrowKind; from: [number, number]; to: [number, number] }
export interface DiagramZone { x: number; y: number; w: number; h: number; label?: string }
export interface Diagram {
  players: DiagramPlayer[];
  ball?: { x: number; y: number } | null;
  arrows?: DiagramArrow[];
  zones?: DiagramZone[];
}

export const MAX_PLAYERS = 22;
export const MAX_ARROWS = 12;
export const MAX_ZONES = 6;
export const ARROW_LABELS: Record<ArrowKind, string> = { run: 'Chạy chỗ', pass: 'Chuyền', shot: 'Sút', dribble: 'Dẫn bóng' };

const clamp = (v: unknown) => {
  const n = typeof v === 'number' && Number.isFinite(v) ? v : 0;
  return Math.round(Math.max(0, Math.min(100, n)) * 10) / 10;
};
const point = (v: unknown): [number, number] | null =>
  Array.isArray(v) && v.length === 2 && typeof v[0] === 'number' && typeof v[1] === 'number' ? [clamp(v[0]), clamp(v[1])] : null;

/** Mirrors the server's sanitize: unknown fields dropped, numbers clamped, lists capped; null when no player. */
export function cleanDiagram(input: unknown): Diagram | null {
  if (!input || typeof input !== 'object') return null;
  const d = input as Record<string, unknown>;
  let me = false;
  const players: DiagramPlayer[] = [];
  for (const raw of Array.isArray(d.players) ? d.players : []) {
    if (players.length >= MAX_PLAYERS) break;
    const p = raw as Record<string, unknown>;
    if (typeof p?.x !== 'number' || typeof p?.y !== 'number') continue;
    const row: DiagramPlayer = { team: p.team === 'opp' ? 'opp' : 'own', x: clamp(p.x), y: clamp(p.y) };
    const label = typeof p.label === 'string' ? p.label.replace(/[<>]/g, '').trim().slice(0, 3) : '';
    if (label) row.label = label;
    if (p.me === true && !me) { row.me = true; me = true; }
    players.push(row);
  }
  if (!players.length) return null;
  const out: Diagram = { players, arrows: [], zones: [] };
  const b = d.ball as Record<string, unknown> | undefined;
  if (b && typeof b.x === 'number' && typeof b.y === 'number') out.ball = { x: clamp(b.x), y: clamp(b.y) };
  for (const raw of Array.isArray(d.arrows) ? d.arrows : []) {
    if (out.arrows!.length >= MAX_ARROWS) break;
    const a = raw as Record<string, unknown>;
    const from = point(a?.from), to = point(a?.to);
    if (!from || !to) continue;
    const kind = (['run', 'pass', 'shot', 'dribble'] as const).find((k) => k === a.kind) || 'run';
    out.arrows!.push({ kind, from, to });
  }
  for (const raw of Array.isArray(d.zones) ? d.zones : []) {
    if (out.zones!.length >= MAX_ZONES) break;
    const z = raw as Record<string, unknown>;
    if ([z?.x, z?.y, z?.w, z?.h].some((v) => typeof v !== 'number')) continue;
    const x = clamp(z.x), y = clamp(z.y);
    const zone: DiagramZone = { x, y, w: Math.min(clamp(z.w), 100 - x), h: Math.min(clamp(z.h), 100 - y) };
    if (typeof z.label === 'string' && z.label.trim()) zone.label = z.label.replace(/[<>]/g, '').trim().slice(0, 30);
    out.zones!.push(zone);
  }
  return out;
}

/** A starting diagram for a new situation question: the player, one team-mate, one opponent and the ball. */
export function starterDiagram(): Diagram {
  return {
    players: [
      { team: 'own', x: 55, y: 45, label: '8', me: true },
      { team: 'own', x: 72, y: 25, label: '9' },
      { team: 'opp', x: 62, y: 42, label: '4' },
    ],
    ball: { x: 56.5, y: 46 },
    arrows: [{ kind: 'pass', from: [56, 46], to: [71, 26] }],
    zones: [],
  };
}
