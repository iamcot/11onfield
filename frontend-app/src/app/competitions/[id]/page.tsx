"use client";

export const dynamic = "force-dynamic";

import HomeFooter from "@/components/home/HomeFooter";
import MobileNav from "@/components/layout/MobileNav";
import TopBar from "@/components/layout/TopBar";
import TopUserCard from "@/components/layout/TopUserCard";
import NewsTab from "@/components/competition/NewsTab";
import PlayersTab from "@/components/competition/PlayersTab";
import Top30Tab from "@/components/competition/Top30Tab";
import RoundRail from "@/components/competition/RoundRail";
import "@/components/pp/pp.css";
import { useI18n } from "@/i18n/I18nProvider";
import { activeRoundIndex, finalIsOpen, sortRounds } from "@/lib/players/rounds";
import {
  CompetitionDetail,
  CompetitionNews,
  competitionService,
  CompetitionSponsor,
  type ParticipantStatus,
  type Top30,
} from "@/services/competition.service";
import { storage } from "@/lib/storage";
import Link from "next/link";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

const STATUS_LABELS: Record<string, string> = {
  DRAFT: "Sắp mở",
  REGISTRATION_OPEN: "Đang mở đăng ký",
  REGIONAL_AUDITION: "Vòng tuyển trạch",
  SELECTING_TOP30: "Chọn TOP 30",
  TRAINING_PHASE: "Giai đoạn huấn luyện",
  FINAL_PHASE: "Chung kết",
  COMPLETED: "Đã hoàn thành",
};

type Tab = "players" | "top30" | "news";

export default function CompetitionDetailPage() {
  const { t } = useI18n();
  const params = useParams();
  const router = useRouter();
  const search = useSearchParams();
  const competitionId = parseInt(params.id as string);
  const wanted = search.get("tab");

  const [competition, setCompetition] = useState<CompetitionDetail | null>(null);
  const [news, setNews] = useState<CompetitionNews[]>([]);
  const [sponsors, setSponsors] = useState<CompetitionSponsor[]>([]);
  const [top30, setTop30] = useState<Top30 | null>(null);
  const [loading, setLoading] = useState(true);
  const [reg, setReg] = useState<ParticipantStatus | null>(null);
  const [joining, setJoining] = useState(false);
  const [joinError, setJoinError] = useState("");

  useEffect(() => {
    Promise.all([
      competitionService.getCompetitionById(competitionId),
      competitionService.getNews(competitionId).catch(() => []),
      competitionService.getSponsors(competitionId).catch(() => []),
      competitionService.getTop30(competitionId).catch(() => null),
    ])
      .then(([c, n, s, top]) => {
        setCompetition(c);
        setNews(n);
        setSponsors(s);
        setTop30(top?.published ? top : null);
      })
      .catch(() => setCompetition(null))
      .finally(() => setLoading(false));
    if (storage.getToken()) competitionService.checkRegistration(competitionId).then(setReg);
  }, [competitionId]);

  // a signed-in player who is not in this competition yet joins it here (sign-up already enrolls in the open one)
  const join = async () => {
    setJoining(true);
    setJoinError("");
    try {
      await competitionService.register(competitionId);
      setReg({ isRegistered: true, status: "REGISTERED" });
      setCompetition((c) => (c ? { ...c, participantCount: (c.participantCount ?? 0) + 1 } : c));
    } catch (e) {
      setJoinError((e as { message?: string })?.message || t("Có lỗi xảy ra. Vui lòng thử lại."));
    } finally {
      setJoining(false);
    }
  };

  const rounds = useMemo(() => sortRounds(competition?.stages ?? []), [competition]);
  const active = useMemo(() => activeRoundIndex(rounds), [rounds]);
  const finalOpen = useMemo(() => finalIsOpen(rounds, competition?.status), [rounds, competition]);

  // the ranking tab exists only once the jury has finalized the Top 30
  const tab: Tab = wanted === "news" ? "news" : wanted === "top30" && top30 ? "top30" : "players";

  const setTab = (next: Tab) => {
    const q = new URLSearchParams(search.toString());
    if (next === "players") q.delete("tab");
    else q.set("tab", next);
    router.replace(`/competitions/${competitionId}${q.toString() ? `?${q}` : ""}`, { scroll: false });
  };

  if (loading) {
    return (
      <div className="pp min-h-screen pt-16">
        <TopBar />
        <div className="pp-spin" />
      </div>
    );
  }

  if (!competition) {
    return (
      <div className="pp min-h-screen pt-16">
        <TopBar />
        <div className="pp-empty" style={{ paddingTop: 120 }}>
          <b>{t("Không tìm thấy cuộc thi")}</b>
          <Link href="/" className="pp-btn pp-btn-ghost of-cut">
            {t("Về trang chủ")}
          </Link>
        </div>
      </div>
    );
  }

  // the season label comes from the competition itself, never a hard-coded year
  const year = competition.competitionStartDate?.slice(0, 4) || competition.registrationStartDate?.slice(0, 4);
  const banners = sponsors
    .filter((s) => s.isActive !== false && (s.adPosition === "BANNER_BELOW_STAGES" || s.adPosition === "SIDEBAR_FEATURED"))
    .filter((s) => s.bannerImageUrl || s.logoUrl)
    .slice(0, 2);
  const signedIn = !!storage.getToken();
  const enrollable = competition.status === "REGISTRATION_OPEN" || competition.status === "REGIONAL_AUDITION";
  const joined = !!reg?.isRegistered && reg.status !== "WITHDRAWN";
  const live = active >= 0 && ["LIVE", "ACTIVE"].includes(rounds[active]?.status);

  return (
    <div className="pp min-h-screen pt-16 pb-20 md:pb-0">
      <TopBar />
      <TopUserCard />

      <section className="pp-wrap pp-chero">
        <div>
          <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
            <span className="pp-hud pp-live">
              {live && <i />}
              {[t("Mùa {n}", { n: competition.season }), year, t(STATUS_LABELS[competition.status] ?? competition.status)].filter(Boolean).join(" · ")}
            </span>
          </div>
          <h1 className="pp-disp">{competition.title}</h1>
          {competition.description && <p className="pp-desc">{competition.description}</p>}
          <div className="pp-cstats">
            <div>
              <b>{(competition.participantCount ?? 0).toLocaleString()}</b>
              <span>{t("người tham gia")}</span>
            </div>
            {rounds.length > 0 && (
              <div>
                <b>{rounds.length}</b>
                <span>{t("vòng thi")}</span>
              </div>
            )}
            {enrollable && !signedIn && (
              <Link href="/auth/register" className="pp-btn pp-btn-lime of-cut" style={{ alignSelf: "center" }}>
                {t("Đăng ký ngay →")}
              </Link>
            )}
            {enrollable && signedIn && reg && !joined && (
              <button className="pp-btn pp-btn-lime of-cut" style={{ alignSelf: "center" }} onClick={join} disabled={joining}>
                {joining ? t("Đang đăng ký...") : t("Đăng ký tham gia")}
              </button>
            )}
            {signedIn && joined && (
              <span className="pp-pill ok" style={{ alignSelf: "center" }}>
                ✓ {t("Bạn đã đăng ký cuộc thi này")}
              </span>
            )}
          </div>
          {joinError && <p className="err" style={{ marginTop: 8 }}>{joinError}</p>}
        </div>
        {rounds.length > 0 && <RoundRail rounds={rounds} active={active} />}
      </section>

      {banners.length > 0 && (
        <section className="pp-wrap" style={{ display: "grid", gap: 10, paddingTop: 16 }}>
          {banners.map((b) => (
            <a key={b.id} href={b.websiteUrl || "#"} target="_blank" rel="noopener noreferrer" className="of-cut" style={{ display: "block", ["--c" as string]: "14px" }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={b.bannerImageUrl || b.logoUrl} alt={b.name} style={{ width: "100%", height: "auto", maxHeight: 140, objectFit: "cover" }} />
            </a>
          ))}
        </section>
      )}

      <section className="pp-wrap">
        <div className="pp-tabs" role="tablist" aria-label={t("Nội dung giải")}>
          <button className="of-cut" role="tab" aria-selected={tab === "players"} onClick={() => setTab("players")}>
            {t("Cầu thủ")}
            {competition.participantCount > 0 && <sup>{competition.participantCount.toLocaleString()}</sup>}
          </button>
          {top30 && (
            <button className="of-cut" role="tab" aria-selected={tab === "top30"} onClick={() => setTab("top30")}>
              {t("Bảng xếp hạng")}
              <sup>{top30.players.length}</sup>
            </button>
          )}
          <button className="of-cut" role="tab" aria-selected={tab === "news"} onClick={() => setTab("news")}>
            {t("Tin tức")}
            {news.length > 0 && <sup>{news.length}</sup>}
          </button>
        </div>
        {tab === "players" && <PlayersTab competitionId={competition.id} finalOpen={finalOpen} total={competition.participantCount} />}
        {tab === "top30" && top30 && <Top30Tab top30={top30} />}
        {tab === "news" && <NewsTab competitionId={competitionId} news={news} />}
      </section>

      <HomeFooter />
      <MobileNav />
    </div>
  );
}
