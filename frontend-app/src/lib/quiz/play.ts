/** Pure helpers of the player quiz screens. */

export const LETTERS = ['A', 'B', 'C', 'D'];

/** Server time minus browser time, so the countdown follows the server clock even when the phone's clock is off. */
export const clockOffset = (serverNow: number, localNow: number = Date.now()) => serverNow - localNow;

/** Seconds left on a question (never below 0) and the share of time left (0..1). */
export function timeLeft(issuedAt: number, expiresAt: number, offset: number, localNow: number = Date.now()) {
  const now = localNow + offset;
  const total = Math.max(1, expiresAt - issuedAt);
  const left = Math.max(0, expiresAt - now);
  return { seconds: Math.ceil(left / 1000), share: Math.min(1, left / total) };
}

/** First letter of the last word, for an avatar without a picture. */
export const initial = (name: string | null | undefined) => (name || '?').trim().split(/\s+/).pop()?.charAt(0).toUpperCase() || '?';

export const GROUP_LABELS: Record<string, string> = { knowledge: 'Kiến thức', thinking: 'Tư duy', situation: 'Tình huống' };
export const LEVEL_LABELS: Record<number, string> = { 1: 'Rất dễ', 2: 'Dễ', 3: 'Vừa', 4: 'Khó', 5: 'Rất khó' };

/** Reasons a player can give when reporting a question. */
export const REPORT_REASONS: { key: string; label: string }[] = [
  { key: 'wrong_answer', label: 'Đáp án đúng bị sai' },
  { key: 'unclear', label: 'Câu hỏi khó hiểu' },
  { key: 'diagram', label: 'Sơ đồ không khớp câu hỏi' },
  { key: 'other', label: 'Lỗi khác' },
];
