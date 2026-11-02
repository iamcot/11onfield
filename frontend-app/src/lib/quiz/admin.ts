import type { Diagram } from './diagram';

/** Shapes of the admin quiz API (/api/admin/quiz/*). */
export interface QuizTopic { key: string; label: string; group: string; hint: string; withDiagram: boolean; sortOrder: number; active: boolean }
export interface OverviewCell {
  topic: string; topicLabel: string; group: string; difficulty: number;
  active: number; pending: number; hidden: number; served: number; correctRate: number | null; target: number; shortfall: number;
}
export interface Overview {
  pool: string;
  levels: Record<string, string>;
  cells: OverviewCell[];
  totals: { active: number; pending: number; hidden: number; reported: number; aiConfigured: boolean };
}
export interface QuizQuestion {
  id: number; topic: string; difficulty: number; pool: string; body: string; options: string[]; correct: number;
  explanation: string | null; mediaType: string; diagram: Diagram | null; mediaUrl: string | null;
  status: 'pending' | 'active' | 'hidden'; verified: number; reviewNote: string | null; reportCount: number;
  timesServed: number; timesCorrect: number; source: string; model: string | null; createdAt: string;
}
export interface GenResult { requested: number; returned: number; invalid: number; duplicates: number; saved: number; verifyFailed: number; error: string | null }
export interface SettingsField { key: string; label: string; def: number; min: number; max: number }

export const GROUP_LABELS: Record<string, string> = { knowledge: 'Kiến thức', thinking: 'Tư duy', situation: 'Tình huống' };
export const LEVELS: Record<number, string> = { 1: 'Rất dễ', 2: 'Dễ', 3: 'Vừa', 4: 'Khó', 5: 'Rất khó' };
export const STATUS_LABELS: Record<string, string> = { pending: 'Chờ duyệt', active: 'Đang dùng', hidden: 'Đã ẩn' };
export const LETTERS = ['A', 'B', 'C', 'D'];

/** Colour of an overview cell: red when empty, gold when short of the target, green when full. */
export function cellTone(c: Pick<OverviewCell, 'active' | 'target'>): 'red' | 'gold' | 'green' {
  if (c.active === 0) return 'red';
  return c.active >= c.target ? 'green' : 'gold';
}

/** What the blind AI check said about a question. */
export function verifiedLabel(v: number): { text: string; tone: 'green' | 'red' | 'gray' } {
  if (v > 0) return { text: 'AI kiểm tra khớp', tone: 'green' };
  if (v < 0) return { text: 'AI kiểm tra lệch', tone: 'red' };
  return { text: 'Chưa kiểm tra', tone: 'gray' };
}
