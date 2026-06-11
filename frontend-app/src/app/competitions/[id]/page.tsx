"use client";

export const dynamic = "force-dynamic";

import LandingFooter from "@/components/landing/LandingFooter";
import MobileNav from "@/components/layout/MobileNav";
import TopBar from "@/components/layout/TopBar";
import TopUserCard from "@/components/layout/TopUserCard";
import {
  CompetitionDetail,
  CompetitionNews,
  competitionService,
  CompetitionSponsor,
} from "@/services/competition.service";
import Image from "next/image";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";

import PlayersSection from "@/components/players/PlayersSection";

const REGION_LABELS: Record<string, string> = {
  HANOI_NORTH: "Hà Nội & Miền Bắc",
  DANANG_CENTRAL: "Đà Nẵng & Miền Trung",
  HCMC_SOUTH: "TP HCM & Miền Nam",
};

const STAGE_STATUS_LABELS: Record<
  string,
  { label: string; className: string }
> = {
  UPCOMING: { label: "Sắp diễn ra", className: "bg-blue-100 text-blue-800" },
  ACTIVE: { label: "Đang diễn ra", className: "bg-green-100 text-green-800" },
  COMPLETED: { label: "Đã kết thúc", className: "bg-gray-100 text-gray-600" },
};

const COMPETITION_STATUS_LABELS: Record<
  string,
  { label: string; className: string }
> = {
  DRAFT: { label: "Nháp", className: "bg-white/10" },
  REGISTRATION_OPEN: {
    label: "Đang mở đăng ký",
    className: "bg-white/20",
  },
  REGIONAL_AUDITION: {
    label: "Vòng tuyển trạch",
    className: "bg-yellow-500/30 border border-yellow-400",
  },
  SELECTING_TOP30: {
    label: "Chọn TOP 30",
    className: "bg-orange-500/30 border border-orange-400",
  },
  TRAINING_PHASE: {
    label: "Giai đoạn huấn luyện",
    className: "bg-purple-500/30 border border-purple-400",
  },
  FINAL_PHASE: {
    label: "Chung kết",
    className: "bg-red-500/30 border border-red-400",
  },
  COMPLETED: {
    label: "Đã hoàn thành",
    className: "bg-white/10 border border-white/30",
  },
};

function CountdownBadge({
  stages,
  competitionStatus,
}: {
  stages: CompetitionDetail["stages"];
  competitionStatus: string;
}) {
  const now = Date.now();

  // For registration/draft/completed — show status directly, skip stage logic
  const statusOverride = ["REGISTRATION_OPEN", "DRAFT", "COMPLETED"].includes(
    competitionStatus,
  );

  const activeStage = statusOverride
    ? null
    : (stages.find((s) => s.status === "ACTIVE") ?? null);

  const nextStage =
    !activeStage && !statusOverride
      ? [...stages]
          .filter(
            (s) =>
              s.status === "UPCOMING" && new Date(s.stageDate).getTime() > now,
          )
          .sort(
            (a, b) =>
              new Date(a.stageDate).getTime() - new Date(b.stageDate).getTime(),
          )[0]
      : null;

  const [countdown, setCountdown] = useState("");

  useEffect(() => {
    if (!nextStage) return;
    const target = new Date(nextStage.stageDate).getTime();
    const tick = () => {
      const diff = target - Date.now();
      if (diff <= 0) {
        setCountdown("Đã bắt đầu");
        return;
      }
      const d = Math.floor(diff / 86400000);
      const h = Math.floor((diff % 86400000) / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      setCountdown(
        `${d} ngày ${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`,
      );
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
  const statusInfo = COMPETITION_STATUS_LABELS[competitionStatus];
  if (statusInfo) {
    return (
      <div
        className={`inline-flex items-center gap-2 px-4 py-2 rounded ${statusInfo.className}`}
      >
        <span className="font-semibold">{statusInfo.label}</span>
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
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [competitionData, newsData, sponsorsData] = await Promise.all([
          competitionService.getCompetitionById(competitionId),
          competitionService.getNews(competitionId),
          competitionService.getSponsors(competitionId),
        ]);
        setCompetition(competitionData);
        setNews(newsData);
        setSponsors(sponsorsData);
      } catch (error) {
        console.error("Error fetching competition:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [competitionId]);

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
  const sp = (pos: string) =>
    sponsors.filter((s) => s.adPosition === pos && s.isActive !== false);
  const sidebarFeatured = sp("SIDEBAR_FEATURED")[0] ?? null;
  const bannersBelow = sp("BANNER_BELOW_STAGES").slice(0, 2);

  // News sections
  const featuredNews = news.filter((n) => n.isFeatured);
  const latestFeatured = featuredNews[0] ?? null;
  const moreFeatured = featuredNews.slice(1, 4);
  const recentNews = news.slice(0, 3);

  // Stages — active stage first, then next 2 upcoming
  const activeStage =
    competition.stages.find((s) => s.status === "ACTIVE") ?? null;
  const nextUpcoming = competition.stages
    .filter((s) => s.status === "UPCOMING")
    .slice(0, activeStage ? 2 : 3);
  const upcomingStages = activeStage
    ? [activeStage, ...nextUpcoming]
    : nextUpcoming;

  const formatDate = (d: string) => new Date(d).toLocaleDateString("vi-VN");

  return (
    <div className="min-h-screen bg-gray-50 pt-16">
      <TopBar />
      <TopUserCard />

      {/* Hero */}
      <div className="bg-gradient-to-r from-green-700 to-green-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4">
          <h1 className="text-4xl font-bold mb-3">{competition.title}</h1>
          {competition.description && (
            <p className="text-lg mb-4 text-white/80 max-w-2xl">
              {competition.description}
            </p>
          )}
          <div className="flex flex-wrap items-center gap-4">
            <div className="bg-white/20 px-4 py-2 rounded">
              <span className="font-semibold">
                {competition.participantCount} người tham gia
              </span>
            </div>
            <div className="bg-white/20 px-4 py-2 rounded">
              <span className="font-semibold">5 vòng tuyển chọn</span>
            </div>
            <CountdownBadge
              stages={competition.stages}
              competitionStatus={competition.status}
            />
            {competition.status === "REGISTRATION_OPEN" && (
              <Link
                href="/auth/register"
                className="inline-flex items-center gap-2 font-bold px-6 py-2.5 rounded-md text-white transition-all duration-200 hover:scale-105"
                style={{
                  background: "rgb(5, 30, 15)",
                  border: "2px solid #00ff50",
                  boxShadow: "0 0 14px 4px rgba(0,255,80,0.65), inset 0 0 8px rgba(0,255,80,0.15)",
                  textShadow: "0 0 8px rgba(0,255,80,0.8)",
                }}
              >
                Đăng ký ngay →
              </Link>
            )}
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
                <Link
                  href={`/competitions/${competitionId}/news/${latestFeatured.id}`}
                  className="block mb-4"
                >
                  <div className="flex flex-col sm:flex-row gap-4 bg-white rounded-lg shadow overflow-hidden hover:shadow-md transition">
                    <div className="relative w-full sm:w-[60%] shrink-0 aspect-video">
                      {latestFeatured.thumbnail ? (
                        <Image
                          src={latestFeatured.thumbnail}
                          alt={latestFeatured.title}
                          fill
                          className="object-cover"
                        />
                      ) : (
                        <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                          <span className="text-gray-400 text-sm">
                            Không có ảnh
                          </span>
                        </div>
                      )}
                    </div>
                    <div className="flex-1 p-4 flex flex-col justify-start">
                      <h2 className="font-bold text-lg mb-2 line-clamp-4">
                        {latestFeatured.title}
                      </h2>
                      {latestFeatured.shortContent && (
                        <p className="text-gray-600 text-sm line-clamp-5">
                          {latestFeatured.shortContent}
                        </p>
                      )}
                    </div>
                  </div>
                </Link>
              )}
              {moreFeatured.length > 0 && (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {moreFeatured.map((article) => (
                    <Link
                      key={article.id}
                      href={`/competitions/${competitionId}/news/${article.id}`}
                      className="block"
                    >
                      <div className="bg-white rounded-lg shadow overflow-hidden hover:shadow-md transition">
                        <div className="aspect-video relative">
                          {article.thumbnail ? (
                            <Image
                              src={article.thumbnail}
                              alt={article.title}
                              fill
                              className="object-cover"
                            />
                          ) : (
                            <div className="w-full h-full bg-gray-200" />
                          )}
                        </div>
                        <div className="p-2">
                          <h4 className="font-semibold text-sm line-clamp-2">
                            {article.title}
                          </h4>
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
                <a
                  href={sidebarFeatured.websiteUrl || "#"}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block bg-white rounded-lg shadow overflow-hidden h-full hover:shadow-md transition"
                >
                  <div className="relative w-full h-full min-h-[200px]">
                    {(sidebarFeatured.bannerImageUrl ||
                      sidebarFeatured.logoUrl) && (
                      <Image
                        src={
                          sidebarFeatured.bannerImageUrl ||
                          sidebarFeatured.logoUrl
                        }
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
                <div
                  key={stage.id}
                  className="bg-white p-5 rounded-lg shadow hover:shadow-md transition"
                >
                  <div className="text-xs text-gray-500 mb-1">
                    Giai đoạn {stage.stageNumber}
                  </div>
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
                          <span
                            className={`inline-block px-2 py-0.5 rounded text-xs ${s.className}`}
                          >
                            {s.label}
                          </span>
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
              <a
                key={sp2.id}
                href={sp2.websiteUrl || "#"}
                target="_blank"
                rel="noopener noreferrer"
                className="block bg-white rounded-lg shadow overflow-hidden hover:shadow-md transition"
              >
                <div className="relative w-full h-24 md:h-32">
                  {(sp2.bannerImageUrl || sp2.logoUrl) && (
                    <Image
                      src={sp2.bannerImageUrl || sp2.logoUrl}
                      alt={sp2.name}
                      fill
                      className="object-cover"
                    />
                  )}
                </div>
              </a>
            ))}
          </div>
        )}

        {/* Players section */}
        <div className="mb-12">
          <PlayersSection />
        </div>

        {/* Tin tức mới nhất */}
        {recentNews.length > 0 && (
          <div className="mb-12">
            <div className="flex items-start justify-between mb-6">
              <div>
                <h3 className="text-2xl font-bold text-gray-900">Tin tức mới nhất</h3>
                <p className="text-sm text-gray-500 mt-1">Cập nhật lịch tuyển trạch, hậu trường chương trình và câu chuyện cầu thủ</p>
              </div>
              <Link href={`/competitions/${competitionId}/news`} className="text-green-700 hover:underline text-sm font-bold whitespace-nowrap ml-4 mt-1">
                Xem tất cả tin tức →
              </Link>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {recentNews.map((article) => (
                <Link key={article.id} href={`/competitions/${competitionId}/news/${article.id}`} className="block bg-white rounded-lg shadow overflow-hidden hover:shadow-md transition">
                  <div className="aspect-video relative">
                    {article.thumbnail ? (
                      <Image src={article.thumbnail} alt={article.title} fill className="object-cover" />
                    ) : (
                      <div className="w-full h-full bg-gray-200" />
                    )}
                  </div>
                  <div className="p-4">
                    <p className="text-xs text-gray-400 mb-2">{formatDate(article.publishedAt)}</p>
                    <h4 className="font-bold mb-2 line-clamp-2">{article.title}</h4>
                    {article.shortContent && (
                      <p className="text-sm text-gray-600 line-clamp-2 mb-3">{article.shortContent}</p>
                    )}
                    <span className="text-green-700 text-sm font-bold">Đọc tiếp →</span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>

      <LandingFooter />
      <MobileNav />
    </div>
  );
}
