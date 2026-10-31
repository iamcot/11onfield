import type { PlayerListItem } from '@/types/player';
import type { UserProfile } from '@/services/user.service';
import { ageFrom, overall, posGroup, proStats, profileStats, type PosGroup, type StatAttribute, type StatSet } from './stats';

/** What every view of a player (row, card, pitch token, drawer, profile) needs. */
export interface PlayerView {
  id: number;
  userid: string;
  name: string;
  avatar: string | null;
  fullBody: string | null;
  age: number | null;
  height: number | null;
  weight: number | null;
  foot: string | null;
  province: string | null;
  club?: string | null;
  group: PosGroup | null;
  verified: boolean;
  pro: StatSet | null;
  profile: StatSet;
  /** Council overall when scored, else the profile overall. */
  ovr: number;
}

export function toPlayerView(p: PlayerListItem & { club?: string | null }): PlayerView {
  const group = posGroup(p.positions);
  const pro = proStats(p.attributes as StatAttribute[] | undefined, group === 'GK');
  const profile = profileStats(p.profileStats as StatAttribute[] | undefined);
  return {
    id: p.id,
    userid: p.userid,
    name: p.fullName,
    avatar: p.avatar,
    fullBody: p.fullBodyPhoto ?? null,
    age: p.age,
    height: p.height,
    weight: p.weight,
    foot: p.preferredFoot,
    province: p.provinceName,
    club: p.club ?? null,
    group,
    verified: !!p.verified,
    pro,
    profile,
    ovr: overall(pro ?? profile),
  };
}

/** Same view from a full profile (the profile page, its share card and link preview). */
export function profileToView(p: UserProfile): PlayerView {
  return toPlayerView({
    id: p.id,
    userid: p.userid,
    fullName: p.fullName,
    avatar: p.avatar ?? null,
    age: ageFrom(p.dob),
    height: p.height ?? null,
    weight: p.weight ?? null,
    positions: p.positions ?? [],
    secondaryPosition: p.secondaryPosition ?? null,
    yearsOfExperience: p.yearsOfExperience ?? null,
    preferredFoot: p.preferredFoot ?? null,
    level: null,
    provinceName: p.address?.province?.name ?? null,
    academyId: null,
    followerCount: p.followersCount ?? 0,
    verified: !!p.verified,
    attributes: p.attributes as PlayerListItem['attributes'],
    profileStats: p.profileStats as PlayerListItem['profileStats'],
    fullBodyPhoto: p.fullBodyPhoto ?? null,
    club: p.club ?? null,
  });
}

const SLOTS: [PosGroup, number, number][] = [
  ['GK', 50, 90],
  ['DF', 14, 70],
  ['DF', 38, 74],
  ['DF', 62, 74],
  ['DF', 86, 70],
  ['MF', 24, 50],
  ['MF', 50, 54],
  ['MF', 76, 50],
  ['FW', 18, 25],
  ['FW', 50, 18],
  ['FW', 82, 25],
];

/**
 * 4-3-3 line-up: each slot takes the best player of its natural position first, then the gaps are filled with the
 * best players left. Returns [player, x%, y%] for every filled slot.
 */
export function formation(players: PlayerView[]): [PlayerView, number, number][] {
  const byScore = [...players].sort((a, b) => b.ovr - a.ovr);
  const used = new Set<number>();
  const pick: (PlayerView | undefined)[] = [];
  SLOTS.forEach(([pos], k) => {
    const p = byScore.find((x) => !used.has(x.id) && x.group === pos);
    if (p) {
      used.add(p.id);
      pick[k] = p;
    }
  });
  SLOTS.forEach((_, k) => {
    if (pick[k]) return;
    const p = byScore.find((x) => !used.has(x.id));
    if (p) {
      used.add(p.id);
      pick[k] = p;
    }
  });
  return SLOTS.flatMap(([, x, y], k) => (pick[k] ? [[pick[k]!, x, y] as [PlayerView, number, number]] : []));
}
