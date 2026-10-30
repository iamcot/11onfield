'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useI18n } from '@/i18n/I18nProvider';
import type { CompetitionNews } from '@/services/competition.service';

export const NEWS_PER_PAGE = 12;

/** Featured post on top, then a grid of 12 per page (picture on top, text below) with page buttons. */
export default function NewsTab({ competitionId, news }: { competitionId: number; news: CompetitionNews[] }) {
  const { t, intlLocale } = useI18n();
  const [page, setPage] = useState(1);
  if (news.length === 0) {
    return (
      <div className="pp-empty">
        <b>{t('Chưa có tin tức')}</b>
        {t('Tin tức của giải sẽ được đăng ở đây.')}
      </div>
    );
  }
  const featured = news.find((n) => n.isFeatured) ?? news[0];
  const rest = news.filter((n) => n.id !== featured.id);
  const pages = Math.max(1, Math.ceil(rest.length / NEWS_PER_PAGE));
  const items = rest.slice((page - 1) * NEWS_PER_PAGE, page * NEWS_PER_PAGE);
  const href = (n: CompetitionNews) => `/competitions/${competitionId}/news/${n.id}`;
  const date = (s: string) => (s ? new Date(s).toLocaleDateString(intlLocale, { day: '2-digit', month: '2-digit', year: 'numeric' }) : '');
  const goto = (p: number) => {
    setPage(p);
    document.getElementById('pp-news-grid')?.scrollIntoView({ block: 'start', behavior: 'smooth' });
  };

  return (
    <div className="pp-news">
      <Link className="pp-nfeat of-cut" href={href(featured)}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        {featured.thumbnail ? <img src={featured.thumbnail} alt="" /> : <img src="/images/home/stadium-bg.jpg" alt="" />}
        <div className="cap">
          <span className="pp-ncat">{t('Nổi bật')}</span>
          <h3 className="pp-disp">{featured.title}</h3>
          <span className="pp-mute" style={{ fontSize: 13 }}>
            {[date(featured.publishedAt), featured.authorName].filter(Boolean).join(' · ')}
          </span>
        </div>
      </Link>
      {items.length > 0 && (
        <div className="pp-ngrid" id="pp-news-grid" style={{ scrollMarginTop: 120 }}>
          {items.map((n) => (
            <Link key={n.id} className="pp-ncard of-cut" href={href(n)}>
              <div className="im">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                {n.thumbnail && <img src={n.thumbnail} alt="" loading="lazy" />}
              </div>
              <div className="tx">
                {n.isFeatured && <span className="pp-ncat">{t('Nổi bật')}</span>}
                <h4>{n.title}</h4>
                <span className="dt">{date(n.publishedAt)}</span>
              </div>
            </Link>
          ))}
        </div>
      )}
      {pages > 1 && (
        <nav className="pp-pager" aria-label={t('Trang')}>
          <button className="of-cut" onClick={() => goto(page - 1)} disabled={page === 1} aria-label={t('Trang trước')}>
            ‹
          </button>
          {Array.from({ length: pages }, (_, k) => (
            <button key={k} className="of-cut" onClick={() => goto(k + 1)} aria-current={k + 1 === page ? 'page' : undefined}>
              {k + 1}
            </button>
          ))}
          <button className="of-cut" onClick={() => goto(page + 1)} disabled={page === pages} aria-label={t('Trang sau')}>
            ›
          </button>
        </nav>
      )}
    </div>
  );
}
