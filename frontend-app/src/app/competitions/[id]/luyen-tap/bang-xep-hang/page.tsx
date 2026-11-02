"use client";

export const dynamic = "force-dynamic";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import TopBar from "@/components/layout/TopBar";
import TopUserCard from "@/components/layout/TopUserCard";
import MobileNav from "@/components/layout/MobileNav";
import BoardList from "@/components/quiz/BoardList";
import "@/components/pp/pp.css";
import "@/components/quiz/quiz.css";
import { useI18n } from "@/i18n/I18nProvider";
import { quizService, type Board } from "@/services/quiz.service";

type Type = "week" | "month" | "all";

/** Quiz leaderboard: this week, this month or all time; everyone or only this competition's contestants. */
export default function QuizBoardPage() {
  const { t } = useI18n();
  const params = useParams();
  const search = useSearchParams();
  const router = useRouter();
  const competitionId = parseInt(params.id as string);
  const type: Type = (["week", "month", "all"] as const).find((x) => x === search.get("type")) || "week";
  const scoped = search.get("scope") === "giai";
  const [board, setBoard] = useState<Board | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    setBoard(null);
    setError("");
    quizService.board(type, scoped ? competitionId : undefined).then(setBoard).catch((e) => setError(e?.message || t("Không tải được bảng xếp hạng")));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [type, scoped, competitionId]);

  const go = (nextType: Type, nextScoped: boolean) =>
    router.replace(`/competitions/${competitionId}/luyen-tap/bang-xep-hang?type=${nextType}${nextScoped ? "&scope=giai" : ""}`, { scroll: false });

  return (
    <div className="pp min-h-screen pt-16 pb-24 md:pb-8">
      <TopBar />
      <TopUserCard />
      <section className="pp-wrap" style={{ maxWidth: 820 }}>
        <div style={{ display: "flex", justifyContent: "space-between", gap: 8, paddingTop: 16 }}>
          <Link href={`/competitions/${competitionId}/luyen-tap`} className="qz-link">← {t("Luyện tập")}</Link>
        </div>
        <div className="qz">
          <h1 className="pp-disp" style={{ fontSize: "clamp(34px, 8vw, 56px)", margin: 0 }}>{t("Bảng xếp hạng")}</h1>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            <div className="pp-seg" role="group" aria-label={t("Thời gian")}>
              {([["week", "Tuần này"], ["month", "Tháng này"], ["all", "Mọi lúc"]] as const).map(([k, l]) => (
                <button key={k} type="button" aria-pressed={type === k} onClick={() => go(k, scoped)}>{t(l)}</button>
              ))}
            </div>
            <div className="pp-seg" role="group" aria-label={t("Phạm vi")}>
              <button type="button" aria-pressed={!scoped} onClick={() => go(type, false)}>{t("Tất cả")}</button>
              <button type="button" aria-pressed={scoped} onClick={() => go(type, true)}>{t("Thí sinh giải này")}</button>
            </div>
          </div>
          <p className="pp-mute" style={{ margin: 0, fontSize: 13 }}>
            {type === "all" ? t("Xếp theo hạng rồi số sao hiện có.") : t("Xếp theo số sao kiếm được trong kỳ (sao được trừ đi sao mất).")}
            {board ? ` ${t("{n} người chơi.", { n: board.total })}` : ""}
          </p>
          {error && <p className="err">{error}</p>}
          {!board && !error && <div className="pp-spin" />}
          {board && <BoardList rows={board.top} me={board.me} mode={type} />}
        </div>
      </section>
      <MobileNav />
    </div>
  );
}
