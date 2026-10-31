import type { CombineData } from '@/services/user.service';

/**
 * Stand-in Combine data while the scoring backend (task 2.4) is not live. The profile only uses it when
 * NEXT_PUBLIC_COMBINE_PLACEHOLDER=1 is set, never in production, and always in the shape of a viewer's access:
 * the raw tests belong to the owner, a guest gets the released public blocks only.
 */
export const COMBINE_PLACEHOLDER_ON = process.env.NEXT_PUBLIC_COMBINE_PLACEHOLDER === '1';

export function combinePlaceholder(owner: boolean): CombineData {
  return {
    stageTitle: 'Vòng khu vực HCM',
    source: 'Scouting Combine · Vòng khu vực HCM',
    hex: [
      { key: 'pac', value: 82 },
      { key: 'sho', value: 71 },
      { key: 'pas', value: 64 },
      { key: 'dri', value: 76 },
      { key: 'def', value: 58 },
      { key: 'phy', value: 69 },
    ],
    total: 41.5,
    totalMax: 60,
    grade: 'B+',
    groups: [
      { key: 'body', label: 'Thể hình', score: 7, max: 10 },
      { key: 'fitness', label: 'Thể lực', score: 8, max: 10 },
      { key: 'skill', label: 'Kỹ thuật', score: 14, max: 20 },
      { key: 'duel', label: 'Đối kháng', score: 12, max: 20 },
      { key: 'mind', label: 'Tâm lý', score: 15, max: 20 },
      { key: 'image', label: 'Hình ảnh', score: 11, max: 20 },
    ],
    ...(owner
      ? {
          tests: [
            { key: 'sprint', name: 'Sprint 30 m', value: '4,18 s', level: 5, vsAverage: 0.12 },
            { key: 'run', name: 'Chạy 2.000 m', value: '7:42', level: 3, vsAverage: -0.05 },
            { key: 'jump', name: 'Bật cao', value: '58 cm', level: 3, vsAverage: 0.02 },
            { key: 'shot', name: 'Dứt điểm (trúng đích)', value: '7/10', level: 4, vsAverage: 0.09 },
            { key: 'agility', name: 'Agility', value: '12,4 s', level: 2, vsAverage: -0.08 },
          ],
          ownerOnly: ['TEST_RESULTS'],
        }
      : {}),
  };
}
