// Which main tab (header and bottom bar) is on: news is both the /news pages and `?tab=news` of a competition.
export type NavSection = 'profile' | 'competitions' | 'news' | 'events' | 'quiz' | null;

export function navSection(pathname: string, tab: string | null): NavSection {
  if (pathname === '/' || pathname.startsWith('/profile')) return 'profile';
  if (pathname.includes('/news') || (pathname.startsWith('/competitions') && tab === 'news')) return 'news';
  if (pathname.startsWith('/competitions') && (pathname.includes('/luyen-tap') || tab === 'quiz')) return 'quiz';
  if (pathname.startsWith('/competitions')) return 'competitions';
  if (pathname.startsWith('/events')) return 'events';
  return null;
}

/** News of the current competition opens as the "Tin tức" tab of its page. */
export const newsHrefOf = (competitionId: number) => `/competitions/${competitionId}?tab=news`;

/** Practice of a competition: the play page under it. */
export const quizHrefOf = (competitionId: number) => `/competitions/${competitionId}/luyen-tap`;

/** Competition id in a /competitions/{id}/... path, used when there is no current competition. */
export function competitionIdInPath(pathname: string): number | null {
  const m = /^\/competitions\/(\d+)/.exec(pathname);
  return m ? Number(m[1]) : null;
}
