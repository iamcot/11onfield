"use client";

export const dynamic = "force-dynamic";

import HomeFooter from "@/components/home/HomeFooter";
import MobileNav from "@/components/layout/MobileNav";
import TopBar from "@/components/layout/TopBar";
import TopUserCard from "@/components/layout/TopUserCard";
import { IconPrev } from "@/components/pp/icons";
import "@/components/pp/pp.css";
import { useI18n } from "@/i18n/I18nProvider";
import { competitionService, CompetitionNews } from "@/services/competition.service";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";

export default function NewsDetailPage() {
  const { t, intlLocale } = useI18n();
  const params = useParams();
  const competitionId = parseInt(params.id as string);
  const newsId = parseInt(params.newsId as string);

  const [news, setNews] = useState<CompetitionNews | null>(null);
  const [related, setRelated] = useState<CompetitionNews[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    competitionService
      .getNews(competitionId)
      .then((all) => {
        setNews(all.find((n) => n.id === newsId) ?? null);
        setRelated(all.filter((n) => n.id !== newsId).slice(0, 3));
      })
      .catch(() => setNews(null))
      .finally(() => setLoading(false));
    window.scrollTo(0, 0);
  }, [competitionId, newsId]);

  const date = (s: string) =>
    new Date(s).toLocaleDateString(intlLocale, { year: "numeric", month: "long", day: "numeric", hour: "2-digit", minute: "2-digit" });
  const back = `/competitions/${competitionId}?tab=news`;

  return (
    <div className="pp min-h-screen pt-16 pb-20 md:pb-0">
      <TopBar />
      <TopUserCard />
      <div className="pp-wrap">
        {loading ? (
          <div className="pp-spin" />
        ) : !news ? (
          <div className="pp-empty" style={{ paddingTop: 80 }}>
            <b>{t("Không tìm thấy tin tức")}</b>
            <Link href={back} className="pp-back">
              <IconPrev />
              {t("Tất cả tin tức")}
            </Link>
          </div>
        ) : (
          <article className="pp-article">
            <Link href={back} className="pp-back">
              <IconPrev />
              {t("Tất cả tin tức")}
            </Link>
            {news.isFeatured && (
              <div>
                <span className="pp-ncat">{t("Nổi bật")}</span>
              </div>
            )}
            <h1 className="pp-disp">{news.title}</h1>
            <span className="pp-mute" style={{ fontSize: 13 }}>
              {[news.publishedAt ? date(news.publishedAt) : null, news.authorName].filter(Boolean).join(" · ")}
            </span>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            {news.thumbnail && <img className="cover of-cut" src={news.thumbnail} alt="" />}
            <div className="body" dangerouslySetInnerHTML={{ __html: news.content }} />
            {related.length > 0 && (
              <>
                <h2 className="pp-disp" style={{ fontSize: 30, margin: "28px 0 12px" }}>
                  {t("Bài liên quan")}
                </h2>
                <div className="pp-ngrid">
                  {related.map((n) => (
                    <Link key={n.id} className="pp-ncard of-cut" href={`/competitions/${competitionId}/news/${n.id}`}>
                      <div className="im">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        {n.thumbnail && <img src={n.thumbnail} alt="" loading="lazy" />}
                      </div>
                      <div className="tx">
                        <h4>{n.title}</h4>
                      </div>
                    </Link>
                  ))}
                </div>
              </>
            )}
          </article>
        )}
      </div>
      <HomeFooter />
      <MobileNav />
    </div>
  );
}
