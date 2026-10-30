// Which main tab (header and bottom bar) is on: news is both the /news pages and `?tab=news` of a competition.
export type NavSection = 'profile' | 'competitions' | 'news' | null;

export function navSection(pathname: string, tab: string | null): NavSection {
  if (pathname === '/' || pathname.startsWith('/profile')) return 'profile';
  if (pathname.includes('/news') || (pathname.startsWith('/competitions') && tab === 'news')) return 'news';
  if (pathname.startsWith('/competitions')) return 'competitions';
  return null;
}

/** News of the current competition opens as the "Tin tức" tab of its page. */
export const newsHrefOf = (competitionId: number) => `/competitions/${competitionId}?tab=news`;
