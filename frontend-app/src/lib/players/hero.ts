// What the player stage shows around the photo. The radar next to it already shows the 0 to 100 scores, so the
// stage shows real football facts instead: where the player plays, their body, and, once the Combine test results
// are public, the measured numbers pinned to the body part that produced them.
//
// Before public test results: only what the player entered (height, weight + BMI, preferred foot, positions, age).
// With public test results: up to three tests (jump at the head, sprint at the thigh, shot at the preferred foot),
// the body facts step back (height becomes a small ruler label, weight + BMI a chip), positions stay on the pitch.

import type { CombineData } from '@/services/user.service';
import { FOOT_LABEL, POS_GROUP } from './stats';

export type HeroAnchor = 'head' | 'thigh' | 'foot';

/** A card on the stage. Texts are Vietnamese source strings; the stage translates them with `vars`. */
export interface HeroPin {
  key: string;
  /** Body part the card points to; null is a card without a leader line. */
  anchor: HeroAnchor | null;
  label: string;
  labelVars?: Record<string, string | number>;
  value: string;
  unit?: string;
  sub?: string;
  subVars?: Record<string, string | number>;
  /** 'up' / 'down' colours the sub line as better / worse than average. */
  trend?: 'up' | 'down';
  tone: 'lime' | 'gold';
  /** The player's strongest test. */
  star?: boolean;
  /** Level 1 to 5 of a test. */
  level?: number;
}

export interface HeroChip {
  text: string;
  vars?: Record<string, string | number>;
  ok?: boolean;
}

export interface HeroSpot {
  x: number;
  y: number;
}

export interface HeroFacts {
  /** Preferred foot (left, right, both), for which foot the card points to on a standing photo. */
  foot: string | null;
  /** True when public Combine results are shown. */
  combine: boolean;
  /** Height for the ruler; `heightLead` shows it as a full card ("Chiều cao") instead of a small label. */
  height: number | null;
  heightLead: boolean;
  pins: HeroPin[];
  chips: HeroChip[];
  /** Pitch spots (520 x 300 pitch, own goal on the left). */
  primary: HeroSpot | null;
  secondary: HeroSpot[];
}

export interface HeroInput {
  height?: number | null;
  weight?: number | null;
  foot?: string | null;
  age?: number | null;
  positions?: string[] | null;
  secondaryPosition?: string | null;
  combine?: CombineData | null;
}

export const POSITION_LABEL: Record<string, string> = {
  striker: 'Tiền đạo',
  midfielder: 'Tiền vệ',
  defender: 'Hậu vệ',
  centerback: 'Trung vệ',
  goalkeeper: 'Thủ môn',
};

/** Where each position stands on a 520 x 300 pitch, own goal on the left. */
const SPOT: Record<string, HeroSpot> = {
  goalkeeper: { x: 38, y: 150 },
  centerback: { x: 112, y: 150 },
  defender: { x: 140, y: 64 },
  midfielder: { x: 262, y: 150 },
  striker: { x: 418, y: 150 },
};

type Test = NonNullable<CombineData['tests']>[number];

const FIND: Record<'sprint' | 'jump' | 'shot', RegExp> = {
  sprint: /sprint|tốc độ|30\s*m/i,
  jump: /jump|bật|nhảy/i,
  shot: /shot|sút|dứt điểm|shoot/i,
};

function findTest(tests: Test[], kind: keyof typeof FIND): Test | undefined {
  return tests.find((r) => FIND[kind].test(r.key)) ?? tests.find((r) => FIND[kind].test(r.name));
}

/** Test results everyone may see: sent, and not only because the viewer owns the profile. */
export function publicTests(combine?: CombineData | null): Test[] {
  if (!combine?.tests?.length || combine.ownerOnly?.includes('TEST_RESULTS')) return [];
  return combine.tests;
}

/** Splits "4,18 s" into "4,18" and "s"; "7/10" and "7:42" have no unit. */
export function splitValue(v: string): { value: string; unit?: string } {
  const m = v.trim().match(/^([\d.,:/]+)\s*([^\d\s].*)?$/);
  return m ? { value: m[1], unit: m[2]?.trim() || undefined } : { value: v.trim() };
}

export function bmi(height?: number | null, weight?: number | null): number | null {
  if (!height || !weight || height < 80 || weight < 15) return null;
  return Math.round((weight / (height / 100) ** 2) * 10) / 10;
}

const fmt1 = (n: number) => n.toLocaleString('vi-VN', { maximumFractionDigits: 1 });

function vsAvg(r: Test): Pick<HeroPin, 'sub' | 'subVars' | 'trend'> {
  if (r.vsAverage == null) return {};
  const n = Math.abs(Math.round(r.vsAverage * 100));
  return r.vsAverage >= 0 ? { sub: '▲ {n}% so với TB', subVars: { n }, trend: 'up' } : { sub: '▼ {n}% so với TB', subVars: { n }, trend: 'down' };
}

function testPin(key: string, anchor: HeroAnchor, label: string, r: Test, tone: HeroPin['tone'] = 'lime'): HeroPin {
  return { key, anchor, label, ...splitValue(r.value), ...vsAvg(r), tone, level: r.level };
}

export function heroFacts(p: HeroInput): HeroFacts {
  const height = p.height && p.height > 0 ? p.height : null;
  const weight = p.weight && p.weight > 0 ? p.weight : null;
  const footKey = p.foot && FOOT_LABEL[p.foot] ? p.foot : null;
  const tests = publicTests(p.combine);
  const sprint = findTest(tests, 'sprint');
  const jump = findTest(tests, 'jump');
  const shot = findTest(tests, 'shot');
  const combine = !!(sprint || jump || shot);

  const pins: HeroPin[] = [];
  if (jump) pins.push(testPin('jump', 'head', 'Bật cao', jump));
  if (sprint) pins.push(testPin('sprint', 'thigh', 'Sprint 30 m', sprint));

  if (shot) {
    const pin = testPin('shot', 'foot', footKey && footKey !== 'both' ? 'Chân {foot} · Lực sút' : 'Lực sút', shot, 'gold');
    pin.labelVars = footKey ? { foot: FOOT_LABEL[footKey] } : undefined;
    pins.push(pin);
  } else if (footKey) {
    pins.push({ key: 'foot', anchor: 'foot', label: 'Chân thuận', value: FOOT_LABEL[footKey], sub: footKey === 'both' ? 'Thuận cả hai chân' : undefined, tone: 'gold' });
  }

  // the strongest test glows
  const scored = pins.filter((x) => x.level != null);
  if (scored.length > 1) {
    const best = scored.reduce((a, b) => ((b.level ?? 0) > (a.level ?? 0) ? b : a));
    if (scored.filter((x) => x.level === best.level).length === 1) best.star = true;
  }

  const index = bmi(height, weight);
  const chips: HeroChip[] = [];
  const primaryId = (p.positions ?? []).map((x) => x.trim()).find((x) => POS_GROUP[x]);
  if (primaryId) chips.push({ text: POSITION_LABEL[primaryId], ok: true });
  const secondaryIds = Array.from(
    new Set([...(p.positions ?? []).map((x) => x.trim()), (p.secondaryPosition ?? '').trim()].filter((x) => SPOT[x] && x !== primaryId)),
  );
  if (secondaryIds.length) chips.push({ text: 'Phụ: {list}', vars: { list: secondaryIds.map((x) => POSITION_LABEL[x]).join(' · ') } });

  // weight: its own card until the sprint card takes the left side, then a chip
  if (weight && !sprint) {
    pins.push({ key: 'weight', anchor: null, label: 'Cân nặng', value: String(weight), unit: 'kg', sub: index ? 'BMI {n}' : undefined, subVars: index ? { n: fmt1(index) } : undefined, tone: 'lime' });
  } else if (weight) {
    chips.push(index ? { text: '{w} kg · BMI {n}', vars: { w: weight, n: fmt1(index) } } : { text: '{w} kg', vars: { w: weight } });
  }
  if (p.age != null && p.age > 0) chips.push({ text: '{n} tuổi', vars: { n: p.age } });

  return {
    foot: footKey,
    combine,
    height,
    heightLead: !jump,
    pins,
    chips,
    primary: primaryId ? SPOT[primaryId] : null,
    secondary: secondaryIds.map((x) => SPOT[x]),
  };
}
