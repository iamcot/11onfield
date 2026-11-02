"use client";

export const dynamic = "force-dynamic";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import TopBar from "@/components/layout/TopBar";
import TopUserCard from "@/components/layout/TopUserCard";
import MobileNav from "@/components/layout/MobileNav";
import PitchDiagram from "@/components/quiz/PitchDiagram";
import RankCard from "@/components/quiz/RankCard";
import QuizTab from "@/components/quiz/QuizTab";
import "@/components/pp/pp.css";
import "@/components/quiz/quiz.css";
import { useI18n } from "@/i18n/I18nProvider";
import { storage } from "@/lib/storage";
import { GROUP_LABELS, LETTERS, LEVEL_LABELS, REPORT_REASONS, clockOffset, timeLeft } from "@/lib/quiz/play";
import {
  quizService, type MockExam, type MockResult, type QuizAnswer, type QuizMe, type QuizQuestionView, type QuizStatus,
} from "@/services/quiz.service";

type Mode = "rank" | "practice" | "mock";
type View = "lobby" | "question" | "mock" | "mockResult";

/** Play page of the football quiz: lobby, one timed question at a time (rank or topic practice) and the mock exam. */
export default function QuizPlayPage() {
  const { t } = useI18n();
  const params = useParams();
  const search = useSearchParams();
  const router = useRouter();
  const competitionId = parseInt(params.id as string);
  const base = `/competitions/${competitionId}/luyen-tap`;
  // no mode in the address = the hub (rank, the three ways to play, weekly board); a mode = its set-up and play screens
  const chosen = (["rank", "practice", "mock"] as const).find((m) => m === search.get("mode")) ?? null;
  const mode: Mode = chosen || "rank";
  // read after mount: the server render has no token, so deciding during render breaks hydration
  const [signedIn, setSignedIn] = useState<boolean | null>(null);

  const [status, setStatus] = useState<QuizStatus | null>(null);
  const [me, setMe] = useState<QuizMe | null>(null);
  const [view, setView] = useState<View>("lobby");
  const [q, setQ] = useState<QuizQuestionView | null>(null);
  const [ans, setAns] = useState<QuizAnswer | null>(null);
  const [picked, setPicked] = useState<number | null>(null);
  const [topic, setTopic] = useState<string>("");
  const [level, setLevel] = useState<number | null>(null);
  const [mock, setMock] = useState<MockExam | null>(null);
  const [mockAns, setMockAns] = useState<number[]>([]);
  const [mockAt, setMockAt] = useState(0);
  const [mockRes, setMockRes] = useState<MockResult | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [toast, setToast] = useState("");
  const [now, setNow] = useState(Date.now());
  const offset = useRef(0);
  const away = useRef(false);

  const toHub = () => router.push(base);
  const autoStarted = useRef(false);
  // any link to the hub (back link, main menu) leaves the current screen
  useEffect(() => {
    if (chosen) return;
    autoStarted.current = false;
    setView("lobby"); setQ(null); setAns(null); setMock(null); setMockRes(null); setError("");
  }, [chosen]);
  const say = (m: string) => { setToast(m); setTimeout(() => setToast(""), 3500); };

  const loadMe = useCallback(async () => {
    const m = await quizService.me();
    offset.current = clockOffset(m.serverNow);
    setMe(m);
    return m;
  }, []);

  useEffect(() => {
    quizService.status().then(setStatus).catch(() => setStatus(null));
    const has = !!storage.getToken();
    setSignedIn(has);
    if (!has) return;
    loadMe()
      .then((m) => {
        if (m.open) { setQ(m.open); setView("question"); }
        if (!topic && m.topics.length) setTopic(m.topics[0].key);
      })
      .catch((e) => setError(e?.message || t("Không tải được dữ liệu")));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // clock for the countdowns; a hidden page while a question is open counts as "away"
  useEffect(() => {
    const tick = setInterval(() => setNow(Date.now()), 250);
    const vis = () => { if (document.hidden && view === "question" && !ans) away.current = true; };
    document.addEventListener("visibilitychange", vis);
    return () => { clearInterval(tick); document.removeEventListener("visibilitychange", vis); };
  }, [view, ans]);

  async function start(m: "rank" | "practice") {
    setBusy(true);
    setError("");
    try {
      const next = await quizService.start(m, m === "practice" ? topic : undefined, m === "practice" ? level ?? undefined : undefined);
      offset.current = clockOffset(next.serverNow);
      away.current = false;
      setQ(next);
      setAns(null);
      setPicked(null);
      setView("question");
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  const answer = useCallback(async (option: number) => {
    if (!q || ans || busy) return;
    setBusy(true);
    setPicked(option);
    try {
      const r = await quizService.answer(q.attemptId, option, away.current);
      setAns(r);
      if (r.mode === "rank") loadMe().catch(() => {});
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }, [q, ans, busy, loadMe]);

  // time up: tell the server, which grades it as a timeout
  const left = q ? timeLeft(q.issuedAt, q.expiresAt, offset.current, now) : null;
  useEffect(() => {
    if (view === "question" && q && !ans && !busy && left && left.seconds === 0) answer(-1);
  }, [view, q, ans, busy, left, answer]);

  async function startMock() {
    setBusy(true);
    setError("");
    try {
      const m = await quizService.mockStart();
      offset.current = clockOffset(m.serverNow);
      setMock(m);
      setMockAns(m.items.map(() => -1));
      setMockAt(0);
      setMockRes(null);
      setView("mock");
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  // the hub's "Leo hạng" and "Đề thi thử" cards go straight into play; only topic practice asks for a topic first
  useEffect(() => {
    if (!me || view !== "lobby" || autoStarted.current) return;
    if (chosen === "rank") { autoStarted.current = true; start("rank"); }
    if (chosen === "mock") { autoStarted.current = true; startMock(); }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [me, view, chosen]);

  const submitMock = useCallback(async () => {
    if (!mock || busy) return;
    setBusy(true);
    try {
      const r = await quizService.mockSubmit(mock.mockId, mockAns);
      setMockRes(r);
      setMockAt(0);
      setView("mockResult");
      window.scrollTo({ top: 0 });
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }, [mock, mockAns, busy]);
  const mockLeft = mock ? Math.max(0, Math.ceil((mock.deadline - (now + offset.current)) / 1000)) : 0;
  useEffect(() => {
    if (view === "mock" && mock && mockLeft === 0 && !busy) submitMock();
  }, [view, mock, mockLeft, busy, submitMock]);

  async function report(reason: string) {
    if (!q) return;
    try {
      const r = await quizService.report(q.questionId, reason);
      say(r.reported ? t("Đã gửi báo lỗi, cảm ơn bạn!") : t("Bạn đã báo lỗi câu này rồi"));
    } catch (e) {
      say((e as Error).message);
    }
  }

  // ---------- render ----------
  const shell = (children: React.ReactNode, wide = false) => (
    <div className="pp min-h-screen pt-16 pb-24 md:pb-8">
      <TopBar />
      <TopUserCard />
      <section className="pp-wrap" style={{ maxWidth: wide ? 1180 : 820 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8, paddingTop: 16 }}>
          {chosen
            ? <Link href={base} className="qz-link">← {t("Luyện tập")}</Link>
            : <Link href={`/competitions/${competitionId}`} className="qz-link">← {t("Về trang giải")}</Link>}
          <Link href={`${base}/bang-xep-hang`} className="qz-link">{t("Bảng xếp hạng")}</Link>
        </div>
        {children}
      </section>
      {toast && <div className="pp-toast" role="status">{toast}</div>}
      <MobileNav />
    </div>
  );

  if (signedIn === null) return shell(<div className="pp-spin" />);
  if (status && !status.visible) {
    return shell(<div className="pp-empty" style={{ paddingTop: 60 }}><b>{t("Tính năng luyện tập đang tạm tắt")}</b>{t("Quay lại sau nhé.")}</div>);
  }
  // the hub; an unanswered question left open still comes back first
  if (!chosen && view === "lobby") {
    return shell(status ? <div style={{ paddingTop: 12 }}><QuizTab competitionId={competitionId} status={status} /></div> : <div className="pp-spin" />);
  }
  if (!signedIn) {
    return shell(
      <div className="qz"><div className="qz-card of-cut" style={{ display: "grid", gap: 10, justifyItems: "start" }}>
        <p style={{ margin: 0 }}>{t("Đăng nhập để luyện tập và lên bảng xếp hạng.")}</p>
        <Link href={`/auth/login?redirect=${encodeURIComponent(`${base}?mode=${mode}`)}`} className="pp-btn pp-btn-lime of-cut">{t("Đăng nhập")}</Link>
      </div></div>
    );
  }
  if (!me) return shell(error ? <p className="err" style={{ marginTop: 20 }}>{error}</p> : <div className="pp-spin" />);

  // ----- one question (rank or practice) -----
  if (view === "question" && q) {
    const low = !!left && left.seconds <= 5 && !ans;
    const cls = (i: number) => {
      if (!ans) return picked === i ? "picked" : "";
      if (i === ans.correctOption) return "right";
      return ans.chosen === i ? "wrong" : "";
    };
    return shell(
      <div className="qz qz-q">
        <div className="qz-top">
          <span className="pp-hud pp-mute">
            {q.mode === "rank" ? t("Leo hạng") : t("Luyện tập")} · {t(q.topicLabel)} · {t(LEVEL_LABELS[q.difficulty])}
          </span>
          {!ans && left && <span className={`qz-sec ${low ? "low" : ""}`} aria-live="off">{left.seconds}s</span>}
        </div>
        {!ans && left && (
          <div className={`qz-timer ${low ? "low" : ""}`} role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(left.share * 100)}>
            <i style={{ transform: `scaleX(${left.share})`, transition: "transform 0.25s linear" }} />
          </div>
        )}
        {/* picture first, then the question right above its answers, so nothing needs scrolling back */}
        <div className={`qz-stage ${q.diagram || q.mediaUrl ? "has-media" : ""}`}>
        {q.diagram && <div className="qz-pitch of-cut"><PitchDiagram diagram={q.diagram} /></div>}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        {!q.diagram && q.mediaUrl && <img src={q.mediaUrl} alt="" className="qz-media" />}
        <div className="qz-side">
        <div className="qz-qcard of-cut"><p className="qz-body">{q.body}</p></div>
        <div className="qz-opts" role="group" aria-label={t("Các đáp án")}>
          {q.options.map((o, i) => (
            <button key={i} type="button" className={`qz-opt of-cut ${cls(i)}`} disabled={!!ans || busy} onClick={() => answer(i)}>
              <span className="k">{LETTERS[i]}</span>
              <span>{o}</span>
            </button>
          ))}
        </div>
        </div>
        </div>
        {error && <p className="err">{error}</p>}
        {ans && (
          <>
            <div className={`qz-verdict ${ans.correct ? "ok" : "no"}`} role="status">
              <b>{ans.correct ? t("Chính xác!") : ans.outcome === "timeout" ? t("Hết giờ") : t("Chưa đúng")}</b>
              {ans.mode === "rank" && ans.after && (
                <span className="pp-mute" style={{ fontSize: 14 }}>
                  {ans.correct ? t("+1 sao") : ans.before && ans.after.stars < ans.before.stars ? t("−1 sao") : ans.guardLost ? t("Mất lượt giữ hạng") : ""}
                  {ans.streak && ans.streak >= 3 ? ` · ${t("chuỗi {n} câu đúng", { n: ans.streak })}` : ""}
                </span>
              )}
            </div>
            {ans.rankedUp && ans.after && (
              <div className="qz-up of-cut"><span className="pp-hud">{t("Lên hạng")}</span><b>{t(ans.after.rankLabel)}</b></div>
            )}
            {ans.rankedDown && ans.after && <p className="err" style={{ margin: 0 }}>{t("Rớt xuống hạng {r}. Cố lên!", { r: t(ans.after.rankLabel) })}</p>}
            {ans.flagged && <p className="pp-mute" style={{ margin: 0, fontSize: 13 }}>{t("Câu này trả lời quá nhanh hoặc lúc rời trang nên không tính vào bảng xếp hạng.")}</p>}
            {ans.explanation && <div className="qz-explain">💡 {ans.explanation}</div>}
            {ans.mode === "rank" && me && (
              <RankCard rank={me.rank} rankLabel={me.rankLabel} stars={me.stars} starsPerRank={me.starsPerRank} guard={me.guard} ranks={me.ranks} popStar={ans.correct} />
            )}
            <div className="qz-actions">
              <button type="button" className="pp-btn pp-btn-lime of-cut" disabled={busy} onClick={() => start(q.mode)}>{t("Câu tiếp")} →</button>
              <button type="button" className="pp-btn pp-btn-ghost of-cut" onClick={toHub}>{t("Về sảnh")}</button>
            </div>
            <details>
              <summary className="qz-link" style={{ cursor: "pointer" }}>{t("Báo câu hỏi sai")}</summary>
              <div className="pp-chips" style={{ marginTop: 8, flexWrap: "wrap" }}>
                {REPORT_REASONS.map((r) => <button key={r.key} type="button" className="pp-chip" onClick={() => report(r.key)}>{t(r.label)}</button>)}
              </div>
            </details>
          </>
        )}
      </div>,
      !!(q.diagram || q.mediaUrl)
    );
  }

  // ----- mock exam -----
  if (view === "mock" && mock) {
    const item = mock.items[mockAt];
    const done = mockAns.filter((a) => a >= 0).length;
    const mm = `${Math.floor(mockLeft / 60)}:${String(mockLeft % 60).padStart(2, "0")}`;
    return shell(
      <div className="qz qz-q">
        <div className="qz-mock-bar of-cut">
          <span className="pp-hud">{t("Câu {n}/{m}", { n: mockAt + 1, m: mock.items.length })} · {t("đã làm {n}", { n: done })}</span>
          <span className={`qz-sec ${mockLeft <= 60 ? "low" : ""}`}>{mm}</span>
        </div>
        <span className="pp-hud pp-mute">{t(GROUP_LABELS[item.group] || item.group)} · {t(item.topicLabel)}</span>
        <div className={`qz-stage ${item.diagram ? "has-media" : ""}`}>
        {item.diagram && <div className="qz-pitch of-cut"><PitchDiagram diagram={item.diagram} /></div>}
        <div className="qz-side">
        <div className="qz-qcard of-cut"><p className="qz-body">{item.body}</p></div>
        <div className="qz-opts">
          {item.options.map((o, i) => (
            <button key={i} type="button" className={`qz-opt of-cut ${mockAns[mockAt] === i ? "picked" : ""}`}
              onClick={() => { setMockAns((a) => a.map((x, k) => (k === mockAt ? i : x))); if (mockAt < mock.items.length - 1) setTimeout(() => setMockAt((k) => k + 1), 250); }}>
              <span className="k">{LETTERS[i]}</span><span>{o}</span>
            </button>
          ))}
        </div>
        </div>
        </div>
        <div className="qz-dots" aria-label={t("Chuyển câu")}>
          {mock.items.map((_, k) => (
            <button key={k} type="button" className={mockAns[k] >= 0 ? "done" : ""} aria-current={k === mockAt} onClick={() => setMockAt(k)}>{k + 1}</button>
          ))}
        </div>
        {error && <p className="err">{error}</p>}
        <div className="qz-actions">
          <button type="button" className="pp-btn pp-btn-ghost of-cut" disabled={mockAt === 0} onClick={() => setMockAt((k) => k - 1)}>← {t("Trước")}</button>
          <button type="button" className="pp-btn pp-btn-ghost of-cut" disabled={mockAt >= mock.items.length - 1} onClick={() => setMockAt((k) => k + 1)}>{t("Sau")} →</button>
          <button type="button" className="pp-btn pp-btn-lime of-cut" disabled={busy} onClick={submitMock} style={{ marginLeft: "auto" }}>
            {t("Nộp bài")}{done < mock.items.length ? ` (${t("còn {n} câu", { n: mock.items.length - done })})` : ""}
          </button>
        </div>
      </div>,
      !!item.diagram
    );
  }

  if (view === "mockResult" && mock && mockRes) {
    const item = mock.items[mockAt];
    const rv = mockRes.review.find((r) => r.index === mockAt);
    return shell(
      <div className="qz">
        <div className="qz-card of-cut" style={{ display: "grid", gap: 12 }}>
          <span className="pp-hud pp-mute">{t("Kết quả đề thi thử")}</span>
          <div style={{ display: "flex", alignItems: "baseline", gap: 10 }}>
            <span className="qz-score">{mockRes.score}/{mockRes.total}</span>
            <span className="pp-mute">{mockRes.percent}%</span>
          </div>
          <div className="qz-groups">
            {mockRes.groups.map((g) => (
              <div key={g.group} className="qz-gbar">
                <b style={{ fontSize: 13 }}>{t(GROUP_LABELS[g.group] || g.group)}</b>
                <span><i style={{ width: `${g.percent}%` }} /></span>
                <small>{g.right}/{g.total}</small>
              </div>
            ))}
          </div>
          {mockRes.late && <p className="pp-mute" style={{ margin: 0, fontSize: 13 }}>{t("Nộp sau khi hết giờ.")}</p>}
        </div>
        <span className="pp-hud pp-mute">{t("Xem lại từng câu")}</span>
        <div className="qz-dots">
          {mockRes.review.map((r) => (
            <button key={r.index} type="button" className={r.correct ? "right" : "wrong"} aria-current={r.index === mockAt} onClick={() => setMockAt(r.index)}>{r.index + 1}</button>
          ))}
        </div>
        {item && rv && (
          <div className="qz-q">
            <div className={`qz-stage ${item.diagram ? "has-media" : ""}`}>
            {item.diagram && <div className="qz-pitch of-cut"><PitchDiagram diagram={item.diagram} animate={false} /></div>}
            <div className="qz-side">
            <div className="qz-qcard of-cut"><p className="qz-body">{item.body}</p></div>
            <div className="qz-opts">
              {item.options.map((o, i) => (
                <div key={i} className={`qz-opt of-cut ${i === rv.correctOption ? "right" : rv.chosen === i ? "wrong" : ""}`}>
                  <span className="k">{LETTERS[i]}</span><span>{o}</span>
                </div>
              ))}
            </div>
            </div>
            </div>
            {rv.chosen < 0 && <p className="pp-mute" style={{ margin: 0, fontSize: 13 }}>{t("Bạn bỏ trống câu này.")}</p>}
            {rv.explanation && <div className="qz-explain">💡 {rv.explanation}</div>}
          </div>
        )}
        <div className="qz-actions">
          <button type="button" className="pp-btn pp-btn-lime of-cut" disabled={busy} onClick={startMock}>{t("Làm đề khác")}</button>
          <button type="button" className="pp-btn pp-btn-ghost of-cut" onClick={toHub}>{t("Về sảnh")}</button>
        </div>
      </div>,
      true
    );
  }

  // ----- set-up: topic practice picks a topic and level; rank and mock start by themselves -----
  const groups = Object.keys(GROUP_LABELS).filter((g) => me.topics.some((x) => x.group === g));
  return shell(
    <div className="qz">
      {status?.testing && <span className="qz-test" style={{ justifySelf: "start" }}>{t("Đang thử · chỉ quản trị thấy")}</span>}
      {mode !== "practice" && !error && <div className="pp-spin" />}
      {mode === "practice" && (
        <div className="qz-card of-cut" style={{ display: "grid", gap: 12 }}>
          <h1 className="pp-disp" style={{ fontSize: "clamp(28px, 6vw, 40px)", margin: 0 }}>{t("Luyện theo chủ đề")}</h1>
          {groups.map((g) => (
            <div key={g} style={{ display: "grid", gap: 6 }}>
              <span className="pp-hud pp-mute">{t(GROUP_LABELS[g])}</span>
              <div className="qz-topics">
                {me.topics.filter((x) => x.group === g).map((x) => (
                  <button key={x.key} type="button" className="pp-chip" aria-pressed={topic === x.key} onClick={() => setTopic(x.key)}>{t(x.label)}</button>
                ))}
              </div>
            </div>
          ))}
          <span className="pp-hud pp-mute">{t("Độ khó")}</span>
          <div className="qz-topics">
            <button type="button" className="pp-chip" aria-pressed={level === null} onClick={() => setLevel(null)}>{t("Trộn")}</button>
            {[1, 2, 3, 4, 5].map((d) => <button key={d} type="button" className="pp-chip" aria-pressed={level === d} onClick={() => setLevel(d)}>{t(LEVEL_LABELS[d])}</button>)}
          </div>
          <p className="pp-mute" style={{ margin: 0, fontSize: 13 }}>{t("Luyện tập không mất sao và không giới hạn số câu.")}</p>
          <button type="button" className="pp-btn pp-btn-lime of-cut" style={{ justifySelf: "start" }} disabled={busy || !topic} onClick={() => start("practice")}>{t("Bắt đầu")} →</button>
        </div>
      )}

      {error && <p className="err">{error}</p>}
    </div>
  );
}
