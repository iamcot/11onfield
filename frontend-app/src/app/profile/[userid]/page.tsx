"use client";

import HomeFooter from "@/components/home/HomeFooter";
import MobileNav from "@/components/layout/MobileNav";
import TopBar from "@/components/layout/TopBar";
import TopUserCard from "@/components/layout/TopUserCard";
import AchievementsBlock, { type TypedAchievement } from "@/components/player-profile/AchievementsBlock";
import { PhotoGuide } from "@/components/player-profile/Guides";
import HighlightsBlock from "@/components/player-profile/HighlightsBlock";
import FxToggle from "@/components/pp/FxToggle";
import { IconCamera, IconCheck, IconHex, IconPen, IconPrev, IconShare, IconUpload } from "@/components/pp/icons";
import PlayerStage from "@/components/pp/PlayerStage";
import Radar from "@/components/pp/Radar";
import "@/components/pp/pp.css";
import { useAuth } from "@/contexts/AuthContext";
import { useI18n } from "@/i18n/I18nProvider";
import { activeRoundIndex, finalRoundIndex, sortRounds } from "@/lib/players/rounds";
import {
  ageFrom,
  averageOf,
  FOOT_LABEL,
  initials,
  overall,
  POS_INFO,
  posGroup,
  proStats,
  profileStats,
  splitName,
  type StatAttribute,
} from "@/lib/players/stats";
import { toPlayerView } from "@/lib/players/view";
import { competitionService, type CompetitionDetail } from "@/services/competition.service";
import { eventService } from "@/services/event.service";
import { followService } from "@/services/follow.service";
import { mediaService, type MediaConfig } from "@/services/media.service";
import { playerService } from "@/services/player.service";
import { provinceService } from "@/services/province.service";
import { userService, type UserProfile } from "@/services/user.service";
import type { EventListItem } from "@/types/event";
import type { UserListItem } from "@/types/user";
import Link from "next/link";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";

type EditKey = "avatar" | "id" | "bio" | "body" | "info" | null;

const POSITION_OPTIONS = [
  { id: "striker", label: "Tiền đạo" },
  { id: "midfielder", label: "Tiền vệ" },
  { id: "defender", label: "Hậu vệ" },
  { id: "centerback", label: "Trung vệ" },
  { id: "goalkeeper", label: "Thủ môn" },
];

/** Panel with the owner's pencil in the top right corner; the pencil turns the block into its own small form. */
function Box({ id, className, title, extra, pencil, onEdit, children }: { id?: string; className: string; title: ReactNode; extra?: ReactNode; pencil?: boolean; onEdit?: () => void; children: ReactNode }) {
  const { t } = useI18n();
  return (
    <div className={`pp-panel of-cut pp-box ${className}`} id={id}>
      <h3>
        {title}
        {extra}
      </h3>
      {pencil && (
        <button className="pp-edit" onClick={onEdit} aria-label={t("Sửa")}>
          <IconPen />
        </button>
      )}
      {children}
    </div>
  );
}

function Actions({ onCancel, onSave, saving }: { onCancel: () => void; onSave: () => void; saving: boolean }) {
  const { t } = useI18n();
  return (
    <div className="pp-acts">
      <button className="pp-btn pp-btn-ghost pp-btn-sm of-cut" onClick={onCancel} disabled={saving}>
        {t("Hủy")}
      </button>
      <button className="pp-btn pp-btn-lime pp-btn-sm of-cut" onClick={onSave} disabled={saving}>
        {saving ? t("Đang lưu...") : t("Lưu")}
      </button>
    </div>
  );
}

export default function UserProfilePage() {
  const { t, intlLocale } = useI18n();
  const { user: currentUser, isAuthenticated, setProfileCompletionChecked, refreshUser } = useAuth();
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const userid = params.userid as string;
  const cameFrom = searchParams.get("from");

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [editing, setEditing] = useState<EditKey>(null);
  const [form, setForm] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");
  const [toastText, setToastText] = useState("");
  const [kind, setKind] = useState<"pro" | "profile">("pro");
  const [avg, setAvg] = useState<{ pro: number[] | null; profile: number[] | null }>({ pro: null, profile: null });
  const [config, setConfig] = useState<MediaConfig | null>(null);
  const [competition, setCompetition] = useState<CompetitionDetail | null>(null);
  const [followers, setFollowers] = useState<UserListItem[]>([]);
  const [events, setEvents] = useState<EventListItem[]>([]);
  const [following, setFollowing] = useState(false);
  const [provinces, setProvinces] = useState<{ id: number; name: string }[]>([]);
  const [avatarBusy, setAvatarBusy] = useState(false);
  const [fullGuide, setFullGuide] = useState(false);
  const [fullBusy, setFullBusy] = useState(false);

  const owner = !!currentUser && currentUser.userid === userid;

  const toast = useCallback((text: string) => {
    setToastText(text);
    window.setTimeout(() => setToastText(""), 2400);
  }, []);

  const load = useCallback(async () => {
    try {
      const p = await userService.getUserByUserid(userid);
      setProfile(p);
      setNotFound(false);
    } catch {
      setNotFound(true);
    } finally {
      setLoading(false);
    }
  }, [userid]);

  useEffect(() => {
    setLoading(true);
    load();
    followService.getFollowers(userid).then(setFollowers).catch(() => setFollowers([]));
    eventService.getUserJoinedEvents(userid, 0, 6).then((r) => setEvents(r.data)).catch(() => setEvents([]));
    competitionService.getCurrentCompetition().then(setCompetition);
  }, [userid, load]);

  useEffect(() => {
    if (!owner) return;
    // the old global edit popup no longer opens by itself: the missions block shows what is missing
    setProfileCompletionChecked();
    mediaService.config().then(setConfig).catch(() => setConfig(null));
    provinceService.getAllProvinces().then(setProvinces).catch(() => setProvinces([]));
  }, [owner, setProfileCompletionChecked]);

  useEffect(() => {
    if (owner || !isAuthenticated) return;
    followService.isFollowing(userid).then(setFollowing).catch(() => setFollowing(false));
  }, [owner, isAuthenticated, userid]);

  const isPlayer = profile?.role === "PLAYER";
  const group = posGroup(profile?.positions);
  const pro = useMemo(() => proStats(profile?.attributes as StatAttribute[] | undefined, group === "GK"), [profile, group]);
  const prof = useMemo(() => profileStats(profile?.profileStats as StatAttribute[] | undefined), [profile]);

  useEffect(() => setKind(pro ? "pro" : "profile"), [pro]);

  // dashed "same position" line: the average of up to 60 players with the same main position
  useEffect(() => {
    const first = profile?.positions?.[0];
    if (!isPlayer || !first) return;
    playerService
      .getPlayers(0, 60, { positions: [first] })
      .then((r) => {
        const views = r.data.map(toPlayerView);
        setAvg({
          pro: averageOf(views.flatMap((v) => (v.pro ? [v.pro] : []))),
          profile: averageOf(views.map((v) => v.profile)),
        });
      })
      .catch(() => undefined);
  }, [isPlayer, profile?.positions]);

  const edit = (key: EditKey) => {
    if (!profile) return;
    setFormError("");
    setEditing(key);
    setForm({
      fullName: profile.fullName ?? "",
      position: profile.positions?.[0] ?? "",
      foot: profile.preferredFoot ?? "",
      dob: profile.dob ?? "",
      provinceId: profile.address?.province?.id ? String(profile.address.province.id) : "",
      bio: profile.bio ?? "",
      height: profile.height ? String(profile.height) : "",
      weight: profile.weight ? String(profile.weight) : "",
      club: profile.club ?? "",
      academy: profile.academy ?? "",
      school: profile.school ?? "",
      experience: profile.yearsOfExperience != null ? String(profile.yearsOfExperience) : "",
      secondary: profile.secondaryPosition ?? "",
      socials: (profile.socials ?? []).map((s) => s.url).join("\n"),
    });
  };
  const field = (k: string) => ({ value: form[k] ?? "", onChange: (e: { target: { value: string } }) => setForm((f) => ({ ...f, [k]: e.target.value })) });

  const save = async (key: EditKey) => {
    const num = (v: string) => (v.trim() ? Number(v) : undefined);
    let body: Record<string, unknown> = {};
    if (key === "id") {
      if (!form.fullName.trim()) return setFormError(t("Cần nhập họ tên"));
      body = { fullName: form.fullName.trim(), positions: form.position ? [form.position] : undefined, preferredFoot: form.foot || undefined, dob: form.dob || undefined, provinceId: form.provinceId ? Number(form.provinceId) : undefined };
    } else if (key === "bio") {
      body = { bio: form.bio.trim() };
    } else if (key === "body") {
      const h = num(form.height);
      const w = num(form.weight);
      if ((h !== undefined && (h < 100 || h > 230)) || (w !== undefined && (w < 25 || w > 150))) return setFormError(t("Chiều cao 100-230 cm, cân nặng 25-150 kg"));
      body = { height: h, weight: w };
    } else if (key === "info") {
      const socials = form.socials.split(/\s+/).map((s) => s.trim()).filter((s) => /^https?:\/\//i.test(s));
      body = { club: form.club.trim(), academy: form.academy.trim(), school: form.school.trim(), yearsOfExperience: num(form.experience), secondaryPosition: form.secondary, socials };
    }
    setSaving(true);
    try {
      await userService.updateProfile(body);
      await load();
      setEditing(null);
      toast(t("Đã lưu"));
      if (key === "id") refreshUser().catch(() => undefined);
    } catch (e) {
      setFormError((e as { message?: string })?.message || t("Có lỗi xảy ra. Vui lòng thử lại."));
    } finally {
      setSaving(false);
    }
  };

  const uploadAvatar = async (file?: File) => {
    if (!file) return;
    setAvatarBusy(true);
    try {
      await userService.uploadAvatar(file, true);
      await load();
      setEditing(null);
      toast(t("Đã tách nền ảnh đại diện"));
      refreshUser().catch(() => undefined);
    } catch (e) {
      toast((e as { message?: string })?.message || t("Có lỗi xảy ra. Vui lòng thử lại."));
    } finally {
      setAvatarBusy(false);
    }
  };

  const uploadFull = async (file?: File) => {
    if (!file) return;
    setFullGuide(false);
    setFullBusy(true);
    try {
      await mediaService.uploadFullBody(file);
      await load();
      toast(t("Đã tách nền ảnh toàn thân"));
    } catch (e) {
      toast((e as { message?: string })?.message || t("Có lỗi xảy ra. Vui lòng thử lại."));
    } finally {
      setFullBusy(false);
    }
  };

  const toggleFollow = async () => {
    if (!isAuthenticated) return router.push("/auth/login");
    try {
      if (following) await followService.unfollowUser(userid);
      else await followService.followUser(userid);
      setFollowing(!following);
      followService.getFollowers(userid).then(setFollowers).catch(() => undefined);
      load();
    } catch {
      toast(t("Có lỗi xảy ra. Vui lòng thử lại."));
    }
  };

  const share = async () => {
    const url = window.location.href.split("?")[0];
    try {
      if (navigator.share) await navigator.share({ title: profile?.fullName, url });
      else {
        await navigator.clipboard.writeText(url);
        toast(t("Đã chép link hồ sơ"));
      }
    } catch {
      // closed the share sheet
    }
  };

  const jump = (id: string) => document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });

  if (loading) {
    return (
      <div className="pp min-h-screen pt-16">
        <TopBar />
        <div className="pp-spin" />
      </div>
    );
  }
  if (notFound || !profile) {
    return (
      <div className="pp min-h-screen pt-16">
        <TopBar />
        <div className="pp-empty" style={{ paddingTop: 120 }}>
          <b>{t("Cầu thủ không tồn tại hoặc đã bị khoá")}</b>
          <Link href="/" className="pp-btn pp-btn-ghost of-cut">
            {t("Về trang chủ")}
          </Link>
        </div>
      </div>
    );
  }

  const { given, family } = splitName(profile.fullName);
  const age = ageFrom(profile.dob);
  const pos = group ? POS_INFO[group] : null;
  const usePro = kind === "pro" && !!pro;
  const set = usePro ? pro! : prof;
  const ovr = overall(pro ?? prof);
  const highlights = profile.highlights ?? [];
  const achievements: TypedAchievement[] = [
    ...(profile.individualAchievements ?? []).map((a) => ({ ...a, type: "INDIVIDUAL" as const })),
    ...(profile.teamAchievements ?? []).map((a) => ({ ...a, type: "TEAM" as const })),
    ...(profile.participantAchievements ?? []).map((a) => ({ ...a, type: "PARTICIPANT" as const })),
  ];
  const province = profile.address?.province?.name;

  // owner missions: what is still missing on the profile
  const tasks: [string, boolean, string, () => void][] = [
    [t("Ảnh đại diện không nền"), !!profile.avatar, "+ " + t("Hồ sơ"), () => { window.scrollTo({ top: 0, behavior: "smooth" }); edit("avatar"); }],
    [t("Ảnh toàn thân"), !!profile.fullBodyPhoto, "+ " + t("Hồ sơ"), () => { window.scrollTo({ top: 0, behavior: "smooth" }); setFullGuide(true); }],
    [t("Chiều cao, cân nặng, vị trí"), !!(profile.height && profile.weight && profile.positions?.length), "+ " + t("Thể chất"), () => { jump("body"); edit("body"); }],
    [t("Vài dòng giới thiệu"), !!profile.bio?.trim(), "+ " + t("Hồ sơ"), () => { jump("bio"); edit("bio"); }],
    [t("Thêm highlight"), highlights.length > 0, "+ " + t("Highlight"), () => jump("highlights")],
    [t("Thêm thành tích"), achievements.length > 0, "+ " + t("Thành tích"), () => jump("achievements")],
    [t("CLB, học viện, kinh nghiệm"), !!(profile.club || profile.academy || profile.yearsOfExperience), "+ " + t("Kinh nghiệm"), () => { jump("info"); edit("info"); }],
  ];
  const doneCount = tasks.filter((x) => x[1]).length;
  const percent = Math.round((doneCount / tasks.length) * 100);

  const rounds = sortRounds(competition?.stages ?? []);
  const active = activeRoundIndex(rounds);
  const finalIdx = finalRoundIndex(rounds);

  return (
    <div className="pp min-h-screen pt-16 pb-20 md:pb-0">
      <TopBar />
      <TopUserCard />

      <section className="pp-wrap pp-phero">
        <div className="pp-who">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
            {cameFrom ? (
              <button className="pp-back" onClick={() => router.back()}>
                <IconPrev />
                {t("Quay lại")}
              </button>
            ) : (
              <span />
            )}
            <FxToggle />
          </div>
          <div className="pp-idrow">
            <div className="pp-bigav">
              <span className="plate of-cut" />
              <span className="clip">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                {profile.avatar ? <img src={profile.avatar} alt={t("Ảnh đại diện của {n}", { n: profile.fullName })} /> : <span className="in">{initials(profile.fullName)}</span>}
              </span>
              {owner && (
                <button className="pp-edit" onClick={() => (editing === "avatar" ? setEditing(null) : edit("avatar"))} aria-label={t("Đổi ảnh đại diện")}>
                  <IconCamera />
                </button>
              )}
            </div>
            <div className="pp-idtext">
              <span className="pp-hud pp-live">
                {profile.verified && <i />}
                {[profile.verified ? t("Đã xác minh") : isPlayer ? t("Cầu thủ") : t("Thành viên"), competition ? t("Mùa {n}", { n: competition.season }) : null].filter(Boolean).join(" · ")}
              </span>
              <h1 className="pp-disp">
                {given}
                {family && <span className="o">{family}</span>}
              </h1>
            </div>
          </div>

          {editing === "avatar" && (
            <PhotoGuide kind="avatar">
              <div className="pp-acts">
                <button className="pp-btn pp-btn-ghost pp-btn-sm of-cut" onClick={() => setEditing(null)} disabled={avatarBusy}>
                  {t("Hủy")}
                </button>
                <label className="pp-btn pp-btn-lime pp-btn-sm of-cut pp-file">
                  {avatarBusy ? t("Đang tách nền...") : t("Chọn ảnh")}
                  <input type="file" accept="image/jpeg,image/png,image/webp" disabled={avatarBusy} onChange={(e) => uploadAvatar(e.target.files?.[0])} aria-label={t("Chọn ảnh đại diện")} />
                </label>
              </div>
            </PhotoGuide>
          )}

          <div className={`pp-idline ${owner ? "own" : ""}`}>
            {editing === "id" ? (
              <div className="pp-inline">
                <label>
                  {t("Họ và tên")}
                  <input {...field("fullName")} maxLength={100} />
                </label>
                <div className="pp-row2">
                  {isPlayer && (
                    <label>
                      {t("Vị trí")}
                      <select {...field("position")}>
                        <option value="">--</option>
                        {POSITION_OPTIONS.map((o) => (
                          <option key={o.id} value={o.id}>
                            {t(o.label)}
                          </option>
                        ))}
                      </select>
                    </label>
                  )}
                  {isPlayer && (
                    <label>
                      {t("Chân thuận")}
                      <select {...field("foot")}>
                        <option value="">--</option>
                        {Object.entries(FOOT_LABEL).map(([k, v]) => (
                          <option key={k} value={k}>
                            {t(v)}
                          </option>
                        ))}
                      </select>
                    </label>
                  )}
                </div>
                <div className="pp-row2">
                  <label>
                    {t("Ngày sinh")}
                    <input type="date" {...field("dob")} />
                  </label>
                  <label>
                    {t("Tỉnh/thành")}
                    <select {...field("provinceId")}>
                      <option value="">--</option>
                      {provinces.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>
                {formError && <p className="err">{formError}</p>}
                <Actions onCancel={() => setEditing(null)} onSave={() => save("id")} saving={saving} />
              </div>
            ) : (
              <div className="pp-pills">
                {pos && <span className="pp-pill ok">{t(pos.label)}</span>}
                {age != null && <span className="pp-pill">{t("{n} tuổi", { n: age })}</span>}
                {province && <span className="pp-pill">{province}</span>}
                {profile.preferredFoot && <span className="pp-pill">{t("Chân {n}", { n: t(FOOT_LABEL[profile.preferredFoot] ?? profile.preferredFoot).toLowerCase() })}</span>}
                {profile.verified && <span className="pp-pill gold">{t("Đã xác minh")}</span>}
              </div>
            )}
            {owner && editing !== "id" && (
              <button className="pp-edit" onClick={() => edit("id")} aria-label={t("Sửa thông tin cơ bản")}>
                <IconPen />
              </button>
            )}
          </div>

          <div className="pp-statrow">
            {isPlayer && (
              <div>
                <b>{ovr}</b>
                <span>{pro ? t("Điểm chuyên môn") : t("Điểm hồ sơ")}</span>
              </div>
            )}
            <div>
              <b>{(profile.followersCount ?? 0).toLocaleString()}</b>
              <span>{t("Người theo dõi")}</span>
            </div>
            {isPlayer && (
              <a href="#highlights" onClick={(e) => { e.preventDefault(); jump("highlights"); }}>
                <b>{highlights.length}</b>
                <span>{t("Highlight")}</span>
              </a>
            )}
            {isPlayer && (
              <a href="#achievements" onClick={(e) => { e.preventDefault(); jump("achievements"); }}>
                <b>{achievements.length}</b>
                <span>{t("Thành tích")}</span>
              </a>
            )}
          </div>
          <div className="pp-ctas" style={{ maxWidth: 520 }}>
            {!owner && (
              <button className="pp-btn pp-btn-lime of-cut" onClick={toggleFollow}>
                {following ? t("Đang theo dõi") : t("Theo dõi")}
              </button>
            )}
            <button className="pp-btn pp-btn-ghost of-cut" onClick={share}>
              <IconShare />
              {t("Chia sẻ hồ sơ")}
            </button>
          </div>
        </div>

        {isPlayer && (
          <div className="pp-pstage">
            <PlayerStage
              image={profile.fullBodyPhoto ?? null}
              bigText={String(ovr || "")}
              name={family || given}
              keys={set.keys}
              values={set.values}
              profile={!usePro}
              enterKey={profile.fullBodyPhoto ?? "figure"}
            >
              {fullBusy && <div className="scan" />}
              {owner && profile.fullBodyPhoto && !fullBusy && !fullGuide && (
                <button className="pp-edit" onClick={() => setFullGuide(true)} aria-label={t("Đổi ảnh toàn thân")}>
                  <IconPen />
                </button>
              )}
              {!profile.fullBodyPhoto && !fullBusy && !fullGuide && (
                <div className="upload">
                  {owner ? (
                    <>
                      <button className="pp-btn pp-btn-lime of-cut" onClick={() => setFullGuide(true)}>
                        <IconUpload />
                        {t("Tải ảnh toàn thân")}
                      </button>
                      <p>{t("Đứng thẳng, thấy từ đầu đến chân. Hệ thống tự tách nền.")}</p>
                    </>
                  ) : (
                    <p>{t("{n} chưa có ảnh toàn thân", { n: given })}</p>
                  )}
                </div>
              )}
              {owner && fullGuide && (
                <div className="pp-stage-guide">
                  <PhotoGuide kind="full">
                    <div className="pp-acts">
                      <button className="pp-btn pp-btn-ghost pp-btn-sm of-cut" onClick={() => setFullGuide(false)}>
                        {t("Hủy")}
                      </button>
                      <label className="pp-btn pp-btn-lime pp-btn-sm of-cut pp-file">
                        {t("Chọn ảnh")}
                        <input type="file" accept="image/jpeg,image/png,image/webp" onChange={(e) => uploadFull(e.target.files?.[0])} aria-label={t("Chọn ảnh toàn thân")} />
                      </label>
                    </div>
                  </PhotoGuide>
                </div>
              )}
            </PlayerStage>
          </div>
        )}
      </section>

      {isPlayer && rounds.length > 0 && competition && (
        <section className="pp-wrap">
          <div className="pp-panel of-cut pp-journey">
            <div style={{ display: "flex", justifyContent: "space-between", gap: 8, flexWrap: "wrap" }}>
              <span className="pp-hud">{t("Hành trình")}</span>
              <Link href={`/competitions/${competition.id}`} className="pp-hud pp-mute">
                {competition.title} ›
              </Link>
            </div>
            <div style={{ overflowX: "auto" }}>
              <div className="pp-rail" style={{ gridTemplateColumns: `repeat(${rounds.length}, minmax(72px, 1fr))`, minWidth: rounds.length * 72 }}>
                <span className="fill" style={{ width: `${rounds.length > 1 ? (84 * Math.max(0, active)) / (rounds.length - 1) : 0}%` }} />
                {rounds.map((r, i) => (
                  <div key={r.id} className={`pp-rstep ${i < active || r.status === "COMPLETED" ? "done" : i === active ? "now" : ""} ${i === finalIdx ? "gold" : ""}`}>
                    <i>{i < active || r.status === "COMPLETED" ? "✓" : i + 1}</i>
                    {r.title}
                  </div>
                ))}
              </div>
            </div>
            {active >= 0 && rounds[active] && (
              <div className="pp-jnext">
                <span>
                  {t("Vòng hiện tại")}: <b>{rounds[active].title}</b>
                </span>
                <span className="pp-mute">{new Date(rounds[active].stageDate).toLocaleDateString(intlLocale)}</span>
              </div>
            )}
          </div>
        </section>
      )}

      {isPlayer && (
        <div className="pp-anchors">
          <div className="pp-wrap">
            <div className="pp-tabs" style={{ paddingBlock: 10 }}>
              <button className="of-cut" onClick={() => jump("stats")}>{t("Tổng quan")}</button>
              <button className="of-cut" onClick={() => jump("highlights")}>
                {t("Highlight")}
                {highlights.length > 0 && <sup>{highlights.length}</sup>}
              </button>
              <button className="of-cut" onClick={() => jump("achievements")}>
                {t("Thành tích")}
                {achievements.length > 0 && <sup>{achievements.length}</sup>}
              </button>
              {events.length > 0 && <button className="of-cut" onClick={() => jump("events")}>{t("Sự kiện")}</button>}
            </div>
          </div>
        </div>
      )}

      <section className="pp-wrap pp-bento">
        {isPlayer && (
          <div className="pp-panel of-cut pp-box pp-b-radar" id="stats">
            <h3>
              {t("Chỉ số")}
              <span className="pp-seg" role="group" aria-label={t("Loại chỉ số")}>
                <button aria-pressed={kind === "pro"} onClick={() => setKind("pro")}>
                  {t("Chuyên môn")}
                </button>
                <button aria-pressed={kind === "profile"} onClick={() => setKind("profile")}>
                  {t("Hồ sơ")}
                </button>
              </span>
            </h3>
            {kind === "pro" && !pro ? (
              <div className="pp-empty">
                <IconHex />
                <b>{t("Chưa có chỉ số chuyên môn")}</b>
                {t("Hội đồng sẽ chấm ở vòng tuyển trạch. Trong lúc chờ, bấm \"Hồ sơ\" để xem chỉ số hồ sơ.")}
              </div>
            ) : (
              <>
                <Radar values={set.values} average={usePro ? avg.pro : avg.profile} labels={set.labels.map((l) => t(l))} title={t("Biểu đồ 6 chỉ số")} />
                <div className="pp-legend">
                  <span>
                    <i />
                    {given}
                  </span>
                  {(usePro ? avg.pro : avg.profile) && pos && (
                    <span>
                      <i className="avg" />
                      {t("TB {n}", { n: t(pos.label).toLowerCase() })}
                    </span>
                  )}
                </div>
                <p className="pp-note">
                  {usePro
                    ? t("Hội đồng chuyên môn và thiết bị đo chấm ở vòng tuyển trạch. Cầu thủ không tự sửa được.")
                    : t("Tự tính từ hồ sơ: điền thêm thông tin, highlight và thành tích để tăng.")}
                </p>
              </>
            )}
          </div>
        )}

        {owner && isPlayer && (
          <div className="pp-panel of-cut pp-box pp-b-mission">
            <h3>
              {t("Hoàn thiện hồ sơ")}
              <span className="pp-disp" style={{ fontSize: 28, color: "var(--lime-2)" }}>
                {percent}%
              </span>
            </h3>
            <div className="pp-pbar">
              <i style={{ transform: `scaleX(${percent / 100})` }} />
            </div>
            <div className="pp-tasks">
              {tasks.map(([label, done, xp, go]) => (
                <button key={label} className={`pp-task ${done ? "done" : ""}`} onClick={go}>
                  <span className="ck">{done && <IconCheck />}</span>
                  <span className="t">{label}</span>
                  {!done && <span className="xp">{xp}</span>}
                </button>
              ))}
            </div>
          </div>
        )}

        <Box id="bio" className="pp-b-bio" title={t("Giới thiệu")} pencil={owner && editing !== "bio"} onEdit={() => edit("bio")}>
          {editing === "bio" ? (
            <div className="pp-inline">
              <label>
                {t("Vài dòng về bạn")}
                <textarea {...field("bio")} maxLength={1000} />
              </label>
              {formError && <p className="err">{formError}</p>}
              <Actions onCancel={() => setEditing(null)} onSave={() => save("bio")} saving={saving} />
            </div>
          ) : (
            <p className="pp-bio">{profile.bio?.trim() || (owner ? t("Chưa có giới thiệu. Bấm cây bút để viết vài dòng về bạn.") : t("Chưa có giới thiệu."))}</p>
          )}
        </Box>

        {isPlayer && (
          <Box id="body" className="pp-b-body" title={t("Thể hình")} pencil={owner && editing !== "body"} onEdit={() => edit("body")}>
            {editing === "body" ? (
              <div className="pp-inline">
                <div className="pp-row2">
                  <label>
                    {t("Chiều cao (cm)")}
                    <input type="number" inputMode="numeric" {...field("height")} />
                  </label>
                  <label>
                    {t("Cân nặng (kg)")}
                    <input type="number" inputMode="numeric" {...field("weight")} />
                  </label>
                </div>
                {formError && <p className="err">{formError}</p>}
                <Actions onCancel={() => setEditing(null)} onSave={() => save("body")} saving={saving} />
              </div>
            ) : (
              <div className="pp-kv">
                <div><span className="pp-mute">{t("Chiều cao")}</span><b>{profile.height ? `${profile.height} cm` : "—"}</b></div>
                <div><span className="pp-mute">{t("Cân nặng")}</span><b>{profile.weight ? `${profile.weight} kg` : "—"}</b></div>
                <div><span className="pp-mute">{t("Chân thuận")}</span><b>{profile.preferredFoot ? t(FOOT_LABEL[profile.preferredFoot] ?? profile.preferredFoot) : "—"}</b></div>
                <div><span className="pp-mute">{t("Vị trí")}</span><b>{pos ? t(pos.label) : "—"}</b></div>
              </div>
            )}
          </Box>
        )}

        {isPlayer && (
          <Box id="info" className="pp-b-info" title={t("Thông tin bóng đá")} pencil={owner && editing !== "info"} onEdit={() => edit("info")}>
            {editing === "info" ? (
              <div className="pp-inline">
                <div className="pp-row2">
                  <label>
                    {t("CLB")}
                    <input {...field("club")} maxLength={200} />
                  </label>
                  <label>
                    {t("Học viện")}
                    <input {...field("academy")} maxLength={200} placeholder={t("Nếu có")} />
                  </label>
                </div>
                <div className="pp-row2">
                  <label>
                    {t("Số năm kinh nghiệm")}
                    <input type="number" inputMode="numeric" min={0} max={30} {...field("experience")} />
                  </label>
                  <label>
                    {t("Vị trí phụ")}
                    <select {...field("secondary")}>
                      <option value="">--</option>
                      {POSITION_OPTIONS.map((o) => (
                        <option key={o.id} value={o.id}>
                          {t(o.label)}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>
                <label>
                  {t("Trường")}
                  <input {...field("school")} maxLength={200} />
                </label>
                <label>
                  {t("Mạng xã hội (mỗi dòng một link)")}
                  <textarea {...field("socials")} placeholder="https://www.tiktok.com/@..." />
                </label>
                {formError && <p className="err">{formError}</p>}
                <Actions onCancel={() => setEditing(null)} onSave={() => save("info")} saving={saving} />
              </div>
            ) : (
              <>
                <div className="pp-kv">
                  <div><span className="pp-mute">{t("CLB")}</span><b>{profile.club || "—"}</b></div>
                  <div><span className="pp-mute">{t("Học viện")}</span><b>{profile.academy || "—"}</b></div>
                  <div><span className="pp-mute">{t("Kinh nghiệm")}</span><b>{profile.yearsOfExperience != null ? t("{n} năm", { n: profile.yearsOfExperience }) : "—"}</b></div>
                  <div><span className="pp-mute">{t("Vị trí phụ")}</span><b>{profile.secondaryPosition ? t(POSITION_OPTIONS.find((o) => o.id === profile.secondaryPosition)?.label ?? profile.secondaryPosition) : "—"}</b></div>
                  {profile.school && <div><span className="pp-mute">{t("Trường")}</span><b>{profile.school}</b></div>}
                </div>
                {(profile.socials?.length ?? 0) > 0 && (
                  <div className="pp-socials">
                    {profile.socials!.map((s) => (
                      <a key={s.id} href={s.url} target="_blank" rel="noopener noreferrer">
                        {s.platform || t("Link")}
                      </a>
                    ))}
                  </div>
                )}
              </>
            )}
          </Box>
        )}

        {isPlayer && <HighlightsBlock items={highlights} owner={owner} config={config} onChanged={load} toast={toast} />}
        {isPlayer && <AchievementsBlock items={achievements} owner={owner} onChanged={load} toast={toast} />}

        <Box className="pp-b-fans" title={t("Người theo dõi")} extra={<span className="pp-hud">{(profile.followersCount ?? followers.length).toLocaleString()}</span>}>
          {followers.length === 0 ? (
            <p className="pp-mute" style={{ margin: 0, fontSize: 13 }}>
              {t("Chưa có người theo dõi.")}
            </p>
          ) : (
            <div className="pp-fans">
              {followers.slice(0, 11).map((f) => (
                <Link key={f.userid} className="pp-fan" href={`/profile/${f.userid}?from=followers`} title={f.fullName}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  {f.avatar ? <img src={f.avatar} alt={f.fullName} /> : initials(f.fullName)}
                </Link>
              ))}
              {followers.length > 11 && <span className="pp-fan" style={{ background: "var(--lime)", color: "#0b2412" }}>+{followers.length - 11}</span>}
            </div>
          )}
        </Box>

        {events.length > 0 && (
          <Box id="events" className="pp-b-fans" title={t("Sự kiện đã tham gia")}>
            <div className="pp-kv">
              {events.map((ev) => (
                <div key={ev.id}>
                  <Link href={`/events/${ev.id}`} style={{ color: "var(--lime-2)" }}>
                    {ev.title}
                  </Link>
                  <b>{new Date(ev.startDate).toLocaleDateString(intlLocale)}</b>
                </div>
              ))}
            </div>
          </Box>
        )}
      </section>

      {toastText && (
        <div className="pp-toast" role="status">
          {toastText}
        </div>
      )}

      <HomeFooter />
      <MobileNav />
    </div>
  );
}
