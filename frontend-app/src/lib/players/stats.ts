// Pure helpers of the player pages: which six stats a player shows, the overall number, positions and initials.
// "Pro" stats are the council's hexagon (pac sho pas dri def phy); "profile" stats are computed from the
// player's own profile (FIT EXP SKL PRF ACH HLT) and are shown until the council has scored the player.

export interface StatAttribute {
  attributeKey: string;
  attributeName?: string;
  attributeValue: number | null;
  isHexagon?: boolean;
  isGoalKeeper?: boolean;
  isSynthetic?: boolean | null;
}

export type StatKind = 'pro' | 'profile';

export interface StatSet {
  keys: string[];
  labels: string[];
  values: number[];
}

export const PRO_LABELS: Record<string, string> = {
  pac: 'Tốc độ',
  sho: 'Sút',
  pas: 'Chuyền',
  dri: 'Rê bóng',
  def: 'Phòng thủ',
  phy: 'Sức mạnh',
};

export const PROFILE_KEYS = ['FIT', 'EXP', 'SKL', 'PRF', 'ACH', 'HLT'];
export const PROFILE_LABELS: Record<string, string> = {
  FIT: 'Thể chất',
  EXP: 'Kinh nghiệm',
  SKL: 'Kỹ năng',
  PRF: 'Hoàn thiện',
  ACH: 'Thành tích',
  HLT: 'Highlight',
};

export type PosGroup = 'FW' | 'MF' | 'DF' | 'GK';

export const POS_GROUP: Record<string, PosGroup> = {
  striker: 'FW',
  midfielder: 'MF',
  defender: 'DF',
  centerback: 'DF',
  goalkeeper: 'GK',
};

/** Short code and label (Vietnamese source text, translated by the caller). */
export const POS_INFO: Record<PosGroup, { code: string; label: string }> = {
  FW: { code: 'TĐ', label: 'Tiền đạo' },
  MF: { code: 'TV', label: 'Tiền vệ' },
  DF: { code: 'HV', label: 'Hậu vệ' },
  GK: { code: 'TM', label: 'Thủ môn' },
};

export function posGroup(positions?: string[] | null): PosGroup | null {
  const first = positions?.find((p) => POS_GROUP[p.trim()]);
  return first ? POS_GROUP[first.trim()] : null;
}

const clamp = (v: number) => Math.max(0, Math.min(100, Math.round(v)));

/** The council's six hexagon stats, or null when the council has not scored the player yet. */
export function proStats(attributes: StatAttribute[] | null | undefined, goalkeeper: boolean): StatSet | null {
  const hex = (attributes ?? []).filter((a) => a.isHexagon && !a.isSynthetic);
  const own = hex.filter((a) => !!a.isGoalKeeper === goalkeeper);
  const six = (own.length >= 6 ? own : hex).slice(0, 6);
  if (six.length < 3 || !six.some((a) => a.attributeValue != null)) return null;
  return {
    keys: six.map((a) => a.attributeKey),
    labels: six.map((a) => PRO_LABELS[a.attributeKey.toLowerCase()] ?? a.attributeName ?? a.attributeKey),
    values: six.map((a) => clamp(a.attributeValue ?? 0)),
  };
}

/** The six profile stats; missing ones count as 0 so the hexagon always has six corners. */
export function profileStats(stats: StatAttribute[] | null | undefined): StatSet {
  const byKey = new Map((stats ?? []).map((a) => [a.attributeKey.toUpperCase(), a.attributeValue]));
  return {
    keys: PROFILE_KEYS,
    labels: PROFILE_KEYS.map((k) => PROFILE_LABELS[k]),
    values: PROFILE_KEYS.map((k) => clamp(byKey.get(k) ?? 0)),
  };
}

export function overall(set: StatSet | null): number {
  if (!set || set.values.length === 0) return 0;
  return Math.round(set.values.reduce((a, b) => a + b, 0) / set.values.length);
}

/** Average of each corner over several stat sets with the same keys (the dashed "same position" line). */
export function averageOf(sets: StatSet[]): number[] | null {
  if (sets.length === 0) return null;
  const n = sets[0].values.length;
  const same = sets.filter((s) => s.values.length === n);
  return Array.from({ length: n }, (_, i) => Math.round(same.reduce((a, s) => a + s.values[i], 0) / same.length));
}

export function initials(name?: string | null): string {
  const words = (name ?? '').trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return '?';
  const last = words.slice(-2);
  return last.map((w) => w[0]).join('').toUpperCase();
}

/** Vietnamese names: the given name is the last word(s); shown big, the family name small. */
// Common Vietnamese family names, compared without accents and case.
const FAMILY_NAMES = new Set(
  'nguyen tran le pham hoang huynh phan vu vo dang bui do ho ngo duong ly truong dinh lam mai trinh doan luong ta cao chau ha to quach thai luu kieu la tang van giang lai khuc mac ong tieu thach ton nghiem chu au duong'.split(' '),
);

function plain(word: string): string {
  return word.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/gi, 'd').toLowerCase();
}

export function isFamilyName(word: string): boolean {
  return FAMILY_NAMES.has(plain(word));
}

export function splitName(name?: string | null): { given: string; family: string } {
  const words = (name ?? '').trim().split(/\s+/).filter(Boolean);
  if (words.length <= 1) return { given: words[0] ?? '', family: '' };
  // Vietnamese names put the family name first ("Trương Thắng"), but some people type it last ("Thắng Trương");
  // when only the last word is a family name, the first word is the name people are called by
  if (isFamilyName(words[words.length - 1]) && !isFamilyName(words[0])) {
    return { given: words[0], family: words.slice(1).join(' ') };
  }
  return { given: words[words.length - 1], family: words.slice(0, -1).join(' ') };
}

export function ageFrom(dob?: string | null, now: Date = new Date()): number | null {
  if (!dob) return null;
  const d = new Date(dob);
  if (Number.isNaN(d.getTime())) return null;
  let age = now.getFullYear() - d.getFullYear();
  const m = now.getMonth() - d.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < d.getDate())) age -= 1;
  return age;
}

export const FOOT_LABEL: Record<string, string> = { left: 'Trái', right: 'Phải', both: 'Cả hai' };
