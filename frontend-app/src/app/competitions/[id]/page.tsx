"use client";

export const dynamic = 'force-dynamic';

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import TopUserCard from "@/components/layout/TopUserCard";
import TopBar from "@/components/layout/TopBar";
import MobileNav from "@/components/layout/MobileNav";
import LandingFooter from "@/components/landing/LandingFooter";
import {
  competitionService,
  CompetitionDetail,
  CompetitionNews,
  CompetitionSponsor,
  LeaderboardEntry,
} from "@/services/competition.service";

const ITEMS_PER_PAGE = 10;

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

const REGION_LABELS: Record<string, string> = {
  HANOI_NORTH: "Hà Nội & Phía Bắc",
  DANANG_CENTRAL: "Đà Nẵng & Miền Trung",
  HCMC_SOUTH: "TP HCM & Miền Nam",
};

const STAGE_STATUS_LABELS: Record<string, { label: string; className: string }> = {
  UPCOMING:  { label: "Sắp diễn ra",  className: "bg-blue-100 text-blue-800" },
  ACTIVE:    { label: "Đang diễn ra", className: "bg-green-100 text-green-800" },
  COMPLETED: { label: "Đã kết thúc",  className: "bg-gray-100 text-gray-600" },
};

function SponsorBanner({ sponsor }: { sponsor: CompetitionSponsor }) {
  const img = sponsor.bannerImageUrl || sponsor.logoUrl;
  if (!img) return null;
  return (
    <a href={sponsor.websiteUrl || "#"} target="_blank" rel="noopener noreferrer" className="block">
      <div className="relative w-full h-24 md:h-32">
        <Image src={img} alt={sponsor.name} fill className="object-cover" />
      </div>
    </a>
  );
}

function CountdownBadge({ stages }: { stages: CompetitionDetail["stages"] }) {
  const now = Date.now();
  // Find stage that is ACTIVE by DB or whose date has passed (most recent)
  const activeStage =
    stages.find((s) => s.status === "ACTIVE") ??
    [...stages]
      .filter((s) => new Date(s.stageDate).getTime() <= now)
      .sort((a, b) => new Date(b.stageDate).getTime() - new Date(a.stageDate).getTime())[0] ??
    null;

  const nextStage = !activeStage
    ? [...stages]
        .filter((s) => s.status === "UPCOMING" && new Date(s.stageDate).getTime() > now)
        .sort((a, b) => new Date(a.stageDate).getTime() - new Date(b.stageDate).getTime())[0]
    : null;

  const [countdown, setCountdown] = useState("");

  useEffect(() => {
    if (!nextStage) return;
    const target = new Date(nextStage.stageDate).getTime();
    const tick = () => {
      const diff = target - Date.now();
      if (diff <= 0) { setCountdown("Đã bắt đầu"); return; }
      const d = Math.floor(diff / 86400000);
      const h = Math.floor((diff % 86400000) / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      setCountdown(`${d} ngày ${h.toString().padStart(2,"0")}:${m.toString().padStart(2,"0")}:${s.toString().padStart(2,"0")}`);
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [nextStage]);

  if (activeStage) {
    return (
      <div className="inline-flex items-center gap-2 bg-green-500/30 border border-green-400 px-4 py-2 rounded">
        <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
        <span className="font-semibold">Đang diễn ra: {activeStage.title}</span>
      </div>
    );
  }
  if (nextStage) {
    return (
      <div className="inline-flex items-center gap-2 bg-white/20 px-4 py-2 rounded">
        <span className="font-mono font-bold text-lg">{countdown}</span>
        <span className="text-white/80">đến {nextStage.title}</span>
      </div>
    );
  }
  return null;
}

export default function CompetitionDetailPage() {
  const params = useParams();
  const competitionId = parseInt(params.id as string);

  const [competition, setCompetition] = useState<CompetitionDetail | null>(null);
  const [news, setNews] = useState<CompetitionNews[]>([]);
  const [sponsors, setSponsors] = useState<CompetitionSponsor[]>([]);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [inlineSponsors, setInlineSponsors] = useState<CompetitionSponsor[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [competitionData, newsData, sponsorsData, leaderboardData] = await Promise.all([
          competitionService.getCompetitionById(competitionId),
          competitionService.getNews(competitionId),
          competitionService.getSponsors(competitionId),
          competitionService.getLeaderboard(competitionId).catch(() => []),
        ]);
        setCompetition(competitionData);
        setNews(newsData);
        setSponsors(sponsorsData);
        setLeaderboard(leaderboardData.slice(0, 10));
        setInlineSponsors(shuffle(sponsorsData.filter((s) => s.adPosition === "INLINE_NEWS")));
      } catch (error) {
        console.error("Error fetching competition:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [competitionId]);

  const reshuffleInline = useCallback(() => {
    setInlineSponsors((prev) => shuffle(prev));
  }, []);

  useEffect(() => { reshuffleInline(); }, [currentPage, reshuffleInline]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-700" />
      </div>
    );
  }

  if (!competition) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Không tìm thấy cuộc thi</p>
      </div>
    );
  }

  // Sponsor helpers
  const sp = (pos: string) => sponsors.filter((s) => s.adPosition === pos && s.isActive !== false);
  const sidebarFeatured = sp("SIDEBAR_FEATURED")[0] ?? null;
  const bannersBelow = sp("BANNER_BELOW_STAGES").slice(0, 2);
  const sidebarAds = sp("SIDEBAR_AD").slice(0, 3);
  const bannersBottom = sp("BANNER_BOTTOM").slice(0, 3);

  // News sections
  const featuredNews = news.filter((n) => n.isFeatured);
  const latestFeatured = featuredNews[0] ?? null;
  const moreFeatured = featuredNews.slice(1, 4);
  const allNews = news;
  const totalPages = Math.ceil(allNews.length / ITEMS_PER_PAGE);
  const pageNews = allNews.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  // Stages — active stage first, then next 2 upcoming
  const activeStage = competition.stages.find((s) => s.status === "ACTIVE") ?? null;
  const nextUpcoming = competition.stages
    .filter((s) => s.status === "UPCOMING")
    .slice(0, activeStage ? 2 : 3);
  const upcomingStages = activeStage ? [activeStage, ...nextUpcoming] : nextUpcoming;

  const formatDate = (d: string) => new Date(d).toLocaleDateString("vi-VN");

  return (
    <div className="min-h-screen bg-gray-50 pt-16">
      <TopBar />
      <TopUserCard />

      {/* Sub-nav */}
      <div className="bg-white border-b sticky top-16 z-40">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center space-x-8 overflow-x-auto">
            <span className="py-4 px-2 font-bold text-gray-900 whitespace-nowrap shrink-0">{competition.title}</span>
            <div className="w-px h-6 bg-gray-300 shrink-0" />
            <Link href={`/competitions/${competitionId}`} className="py-4 px-2 border-b-2 border-green-700 text-green-700 font-medium whitespace-nowrap">Trang chủ</Link>
            <Link href={`/competitions/${competitionId}/news`} className="py-4 px-2 border-b-2 border-transparent hover:border-gray-300 whitespace-nowrap">Tin tức</Link>
            <Link href={`/competitions/${competitionId}/leaderboard`} className="py-4 px-2 border-b-2 border-transparent hover:border-gray-300 whitespace-nowrap">Bảng xếp hạng</Link>
          </div>
        </div>
      </div>

      {/* Hero */}
      <div className="bg-gradient-to-r from-green-700 to-green-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4">
          <h1 className="text-4xl font-bold mb-3">{competition.title}</h1>
          {competition.description && <p className="text-lg mb-4 text-white/80 max-w-2xl">{competition.description}</p>}
          <div className="flex flex-wrap items-center gap-4">
            <div className="bg-white/20 px-4 py-2 rounded">
              <span className="font-semibold">{competition.participantCount} người tham gia</span>
            </div>
            <div className="bg-white/20 px-4 py-2 rounded">
              <span className="font-semibold">{competition.stages.length} giai đoạn</span>
            </div>
            <CountdownBadge stages={competition.stages} />
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8 pb-20 md:pb-8">

        {/* Featured news + Sponsor [1] sidebar */}
        {(latestFeatured || moreFeatured.length > 0) && (
          <div className="flex flex-col md:flex-row gap-6 mb-8 md:items-stretch">
            {/* News column */}
            <div className="flex-1 min-w-0">
              {latestFeatured && (
                <Link href={`/competitions/${competitionId}/news/${latestFeatured.id}`} className="block mb-4">
                  <div className="flex flex-col sm:flex-row gap-4 bg-white rounded-lg shadow overflow-hidden hover:shadow-md transition">
                    <div className="relative w-full sm:w-[60%] shrink-0 aspect-video">
                      {latestFeatured.thumbnail ? (
                        <Image src={latestFeatured.thumbnail} alt={latestFeatured.title} fill className="object-cover" />
                      ) : (
                        <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                          <span className="text-gray-400 text-sm">Không có ảnh</span>
                        </div>
                      )}
                    </div>
                    <div className="flex-1 p-4 flex flex-col justify-start">
                      <h2 className="font-bold text-lg mb-2 line-clamp-4">{latestFeatured.title}</h2>
                      {latestFeatured.shortContent && (
                        <p className="text-gray-600 text-sm line-clamp-5">{latestFeatured.shortContent}</p>
                      )}
                    </div>
                  </div>
                </Link>
              )}
              {moreFeatured.length > 0 && (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {moreFeatured.map((article) => (
                    <Link key={article.id} href={`/competitions/${competitionId}/news/${article.id}`} className="block">
                      <div className="bg-white rounded-lg shadow overflow-hidden hover:shadow-md transition">
                        <div className="aspect-video relative">
                          {article.thumbnail ? (
                            <Image src={article.thumbnail} alt={article.title} fill className="object-cover" />
                          ) : (
                            <div className="w-full h-full bg-gray-200" />
                          )}
                        </div>
                        <div className="p-2">
                          <h4 className="font-semibold text-sm line-clamp-2">{article.title}</h4>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>

            {/* Sponsor [1] sidebar — hidden on mobile */}
            <div className="hidden md:block md:w-[30%] shrink-0">
              {sidebarFeatured ? (
                <a href={sidebarFeatured.websiteUrl || "#"} target="_blank" rel="noopener noreferrer"
                   className="block bg-white rounded-lg shadow overflow-hidden h-full hover:shadow-md transition">
                  <div className="relative w-full h-full min-h-[200px]">
                    {(sidebarFeatured.bannerImageUrl || sidebarFeatured.logoUrl) && (
                      <Image
                        src={sidebarFeatured.bannerImageUrl || sidebarFeatured.logoUrl}
                        alt={sidebarFeatured.name}
                        fill
                        className="object-cover"
                      />
                    )}
                  </div>
                </a>
              ) : (
                <div className="h-full min-h-[200px] border-2 border-dashed border-gray-200 rounded-lg flex items-center justify-center text-gray-300 text-sm">
                  Vị trí quảng cáo
                </div>
              )}
            </div>
          </div>
        )}

        {/* Upcoming stages */}
        {upcomingStages.length > 0 && (
          <div className="mb-6">
            <h3 className="text-xl font-bold mb-3">Lịch trình sắp tới</h3>
            <div className="grid md:grid-cols-3 gap-4">
              {upcomingStages.map((stage) => (
                <div key={stage.id} className="bg-white p-5 rounded-lg shadow hover:shadow-md transition">
                  <div className="text-xs text-gray-500 mb-1">Giai đoạn {stage.stageNumber}</div>
                  <h4 className="font-bold mb-2">{stage.title}</h4>
                  <div className="text-sm text-gray-600">
                    <div>📅 {formatDate(stage.stageDate)}</div>
                    {stage.stageTime && <div>🕐 {stage.stageTime}</div>}
                    <div className="flex flex-wrap gap-1 mt-2">
                      {stage.region && (
                        <span className="inline-block bg-green-100 text-green-800 px-2 py-0.5 rounded text-xs">
                          {REGION_LABELS[stage.region] ?? stage.region}
                        </span>
                      )}
                      {(() => {
                        const s = STAGE_STATUS_LABELS[stage.status];
                        return s ? (
                          <span className={`inline-block px-2 py-0.5 rounded text-xs ${s.className}`}>{s.label}</span>
                        ) : null;
                      })()}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Banner [2] below stages */}
        {bannersBelow.length > 0 && (
          <div className="mb-8 space-y-3">
            {bannersBelow.map((sp2) => (
              <a key={sp2.id} href={sp2.websiteUrl || "#"} target="_blank" rel="noopener noreferrer"
                 className="block bg-white rounded-lg shadow overflow-hidden hover:shadow-md transition">
                <div className="relative w-full h-24 md:h-32">
                  {(sp2.bannerImageUrl || sp2.logoUrl) && (
                    <Image src={sp2.bannerImageUrl || sp2.logoUrl} alt={sp2.name} fill className="object-cover" />
                  )}
                </div>
              </a>
            ))}
          </div>
        )}

        {/* News list + Sidebar */}
        {allNews.length > 0 && (
          <div className="flex flex-col md:flex-row gap-6 mb-8">
            {/* News list */}
            <div className="flex-1 min-w-0">
              <h3 className="text-xl font-bold mb-4">Tin tức mới nhất</h3>
              <div className="space-y-3">
                {pageNews.map((article, idx) => (
                  <div key={article.id}>
                    <Link href={`/competitions/${competitionId}/news/${article.id}`} className="block">
                      <div className="flex gap-3 hover:opacity-80 transition overflow-hidden">
                        <div className="relative w-[30%] shrink-0 aspect-video rounded-lg overflow-hidden">
                          {article.thumbnail ? (
                            <Image src={article.thumbnail} alt={article.title} fill className="object-cover" />
                          ) : (
                            <div className="w-full h-full bg-gray-100" />
                          )}
                        </div>
                        <div className="flex-1 flex flex-col justify-between py-1">
                          <div>
                            <h4 className="font-semibold mb-1 line-clamp-2">{article.title}</h4>
                            {article.shortContent && (
                              <p className="text-gray-500 text-sm line-clamp-2">{article.shortContent}</p>
                            )}
                          </div>
                          <p className="text-xs text-gray-400 mt-1">{formatDate(article.publishedAt)}</p>
                        </div>
                      </div>
                    </Link>
                    {/* Inline sponsor [3] after every 5 articles */}
                    {(idx + 1) % 5 === 0 && inlineSponsors.length > 0 && (
                      <div className="my-3">
                        <SponsorBanner sponsor={inlineSponsors[Math.floor((idx + 1) / 5 - 1) % inlineSponsors.length]} />
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex justify-center gap-2 mt-6">
                  <button
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="px-3 py-1 rounded bg-white border hover:bg-gray-50 disabled:opacity-40"
                  >
                    ‹
                  </button>
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                    <button
                      key={p}
                      onClick={() => setCurrentPage(p)}
                      className={`px-3 py-1 rounded border ${p === currentPage ? "bg-green-700 text-white border-green-700" : "bg-white hover:bg-gray-50"}`}
                    >
                      {p}
                    </button>
                  ))}
                  <button
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="px-3 py-1 rounded bg-white border hover:bg-gray-50 disabled:opacity-40"
                  >
                    ›
                  </button>
                </div>
              )}
            </div>

            {/* Sidebar — hidden on mobile */}
            <div className="hidden md:block md:w-[30%] shrink-0 space-y-4">
              {/* Top 10 */}
              <div className="bg-white rounded-lg shadow p-4">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-bold">🏆 Top 10</h4>
                  <Link href={`/competitions/${competitionId}/leaderboard`} className="text-xs text-green-700 hover:underline">Xem tất cả</Link>
                </div>
                {leaderboard.length === 0 ? (
                  <p className="text-sm text-gray-400 text-center py-4">Chưa có kết quả</p>
                ) : (
                  <div className="space-y-2">
                    {leaderboard.map((entry) => (
                      <Link key={entry.userId} href={`/profile/${entry.userProfileId}?from=leaderboard`}
                            className="flex items-center gap-2 hover:bg-gray-50 rounded p-1 transition">
                        <span className="text-xs font-bold text-gray-500 w-5 text-center">{entry.rank}</span>
                        {entry.avatar ? (
                          <div className="relative w-7 h-7 rounded-full overflow-hidden shrink-0">
                            <Image src={entry.avatar} alt={entry.fullName} fill className="object-cover" />
                          </div>
                        ) : (
                          <div className="w-7 h-7 rounded-full bg-gray-200 shrink-0" />
                        )}
                        <span className="text-sm truncate flex-1">{entry.fullName}</span>
                      </Link>
                    ))}
                  </div>
                )}
              </div>

              {/* Sidebar ads [4] */}
              {sidebarAds.map((sp4) => (
                <a key={sp4.id} href={sp4.websiteUrl || "#"} target="_blank" rel="noopener noreferrer"
                   className="block bg-white rounded-lg shadow overflow-hidden hover:shadow-md transition">
                  <div className="relative w-full h-32">
                    {(sp4.bannerImageUrl || sp4.logoUrl) && (
                      <Image src={sp4.bannerImageUrl || sp4.logoUrl} alt={sp4.name} fill className="object-cover" />
                    )}
                  </div>
                </a>
              ))}
            </div>
          </div>
        )}

        {/* Banner bottom [5] */}
        {bannersBottom.length > 0 && (
          <div className="space-y-3 mb-8">
            {bannersBottom.map((sp5) => (
              <a key={sp5.id} href={sp5.websiteUrl || "#"} target="_blank" rel="noopener noreferrer"
                 className="block bg-white rounded-lg shadow overflow-hidden hover:shadow-md transition">
                <div className="relative w-full h-24 md:h-32">
                  {(sp5.bannerImageUrl || sp5.logoUrl) && (
                    <Image src={sp5.bannerImageUrl || sp5.logoUrl} alt={sp5.name} fill className="object-cover" />
                  )}
                </div>
              </a>
            ))}
          </div>
        )}
      </div>

      <LandingFooter />
      <MobileNav />
    </div>
  );
}
