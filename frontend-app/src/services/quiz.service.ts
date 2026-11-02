import { apiClient } from "@/lib/api-client";
import { storage } from "@/lib/storage";
import type { Diagram } from "@/lib/quiz/diagram";

/** Football quiz practice (/api/quiz/*). The right answer never reaches the browser before the answer is sent. */
export interface QuizStatus { enabled: boolean; visible: boolean; boardEnabled: boolean; testing: boolean }
export interface QuizTopicLite { key: string; label: string; group: string }
export interface QuizQuestionView {
  attemptId: number; questionId: number; mode: "rank" | "practice"; topic: string; topicLabel: string; difficulty: number;
  body: string; options: string[]; mediaType: string; diagram: Diagram | null; mediaUrl: string | null;
  issuedAt: number; expiresAt: number; serverNow: number;
}
export interface QuizMe {
  rank: number; rankKey: string; rankLabel: string; stars: number; starsPerRank: number; guard: boolean; lastRank: boolean;
  bestRank: number; bestRankLabel: string; streak: number; bestStreak: number; answered: number; correct: number;
  todayCount: number; dailyCap: number; seconds: number; mockSize: number; mockMinutes: number;
  ranks: string[]; topics: QuizTopicLite[]; open: QuizQuestionView | null; serverNow: number;
}
export interface RankView { rank: number; rankLabel: string; stars: number; guard: boolean }
export interface QuizAnswer {
  attemptId: number; questionId: number; mode: "rank" | "practice"; outcome: "correct" | "wrong" | "timeout";
  correct: boolean; chosen: number | null; correctOption: number; explanation: string | null; flagged: boolean;
  before?: RankView; after?: RankView; rankedUp?: boolean; rankedDown?: boolean; guardLost?: boolean; streak?: number;
}
export interface MockItem { index: number; questionId: number; topicLabel: string; group: string; body: string; options: string[]; mediaType: string; diagram: Diagram | null; mediaUrl: string | null }
export interface MockExam { mockId: number; startedAt: number; deadline: number; serverNow: number; finished: boolean; items: MockItem[] }
export interface MockResult {
  mockId: number; score: number; total: number; percent: number; late: boolean;
  groups: { group: string; right: number; total: number; percent: number }[];
  review: { index: number; chosen: number; correctOption: number; correct: boolean; explanation: string | null }[];
}
export interface BoardRow { userid: string; name: string; avatar: string | null; rankLabel: string; rank: number; stars: number; correct: number; answered: number; place: number }
export interface Board { type: string; period: string | null; total: number; top: BoardRow[]; me: BoardRow | null }

const auth = (): RequestInit => {
  const token = storage.getToken();
  return token ? { headers: { Authorization: `Bearer ${token}` } } : {};
};

export const quizService = {
  status: () => apiClient.get<QuizStatus>("/quiz/status", auth()),
  me: () => apiClient.get<QuizMe>("/quiz/me", auth()),
  start: (mode: "rank" | "practice", topic?: string, difficulty?: number) =>
    apiClient.post<QuizQuestionView>("/quiz/start", { mode, topic, difficulty }, auth()),
  answer: (attemptId: number, option: number, away: boolean) => apiClient.post<QuizAnswer>("/quiz/answer", { attemptId, option, away }, auth()),
  report: (questionId: number, reason: string, note?: string) => apiClient.post<{ reported: boolean }>(`/quiz/questions/${questionId}/report`, { reason, note }, auth()),
  mockStart: () => apiClient.post<MockExam>("/quiz/mock/start", {}, auth()),
  mockSubmit: (id: number, answers: number[]) => apiClient.post<MockResult>(`/quiz/mock/${id}/submit`, { answers }, auth()),
  board: (type: "week" | "month" | "all", competitionId?: number) =>
    apiClient.get<Board>(`/quiz/leaderboard?type=${type}${competitionId ? `&competitionId=${competitionId}` : ""}`, auth()),
};
