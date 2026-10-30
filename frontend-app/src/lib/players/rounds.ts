// Pure rules of the round rail on the competition page.

export interface RoundLike {
  stageNumber: number;
  stageDate: string;
  status: string; // UPCOMING | LIVE | COMPLETED (ACTIVE accepted from older data)
  stageType?: string;
}

const isOpen = (s: string) => s === 'LIVE' || s === 'ACTIVE';

export function sortRounds<T extends RoundLike>(rounds: T[]): T[] {
  return [...rounds].sort((a, b) => a.stageNumber - b.stageNumber || a.stageDate.localeCompare(b.stageDate));
}

/**
 * Index of the round to highlight: the live one, else the next upcoming, else the last one.
 * -1 when there are no rounds.
 */
export function activeRoundIndex(rounds: RoundLike[], now: number = Date.now()): number {
  if (rounds.length === 0) return -1;
  const live = rounds.findIndex((r) => isOpen(r.status));
  if (live >= 0) return live;
  const next = rounds.findIndex((r) => r.status === 'UPCOMING' && new Date(r.stageDate).getTime() >= now - 86400000);
  if (next >= 0) return next;
  const firstUpcoming = rounds.findIndex((r) => r.status === 'UPCOMING');
  return firstUpcoming >= 0 ? firstUpcoming : rounds.length - 1;
}

export type RoundState = 'done' | 'now' | 'next';

export function roundState(index: number, active: number, round: RoundLike): RoundState {
  if (round.status === 'COMPLETED' || index < active) return 'done';
  return index === active ? 'now' : 'next';
}

/** The final round ("11 ra sân") is the last FINAL_MATCH round, else simply the last round. */
export function finalRoundIndex(rounds: RoundLike[]): number {
  for (let i = rounds.length - 1; i >= 0; i -= 1) if (rounds[i].stageType === 'FINAL_MATCH') return i;
  return rounds.length - 1;
}

/** The pitch view ("Đội hình 11") only exists once the final round is open, or the competition is in its final phase. */
export function finalIsOpen(rounds: RoundLike[], competitionStatus?: string): boolean {
  if (competitionStatus === 'FINAL_PHASE') return true;
  const f = finalRoundIndex(rounds);
  return f >= 0 && isOpen(rounds[f].status);
}

/**
 * scrollLeft that puts the active card in the 2nd slot (1st when it is the first round). When two cards do not fit
 * (a phone), as much of the previous card shows as there is room for.
 */
export function railScroll(offsets: { left: number; width: number }[], active: number, viewport: number, gap: number): number {
  if (active <= 0 || !offsets[active]) return 0;
  const a = offsets[active];
  const prev = offsets[active - 1];
  const peek = Math.max(0, Math.min(prev.width + gap, viewport - a.width - gap));
  return Math.max(0, a.left - offsets[0].left - peek);
}
