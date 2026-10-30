'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import PlayerStage from '@/components/pp/PlayerStage';
import Radar from '@/components/pp/Radar';
import { IconArrow, IconClose, IconHex, IconNext, IconPrev } from '@/components/pp/icons';
import { useT } from '@/i18n/I18nProvider';
import { averageOf, FOOT_LABEL, initials, POS_INFO, splitName, type StatSet } from '@/lib/players/stats';
import type { PlayerView } from '@/lib/players/view';
import { followService } from '@/services/follow.service';
import { storage } from '@/lib/storage';

/** Stat bars counting up under the radar. */
function Bars({ set, avg, profile }: { set: StatSet; avg: number[] | null; profile: boolean }) {
  const t = useT();
  const [shown, setShown] = useState(false);
  const [n, setN] = useState(0);
  useEffect(() => {
    setShown(false);
    const r = requestAnimationFrame(() => requestAnimationFrame(() => setShown(true)));
    const t0 = performance.now();
    let raf = 0;
    const step = (now: number) => {
      const k = Math.min(1, (now - t0) / 900);
      setN(1 - Math.pow(1 - k, 3));
      if (k < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => {
      cancelAnimationFrame(r);
      cancelAnimationFrame(raf);
    };
  }, [set]);
  return (
    <div className="pp-bars">
      {set.labels.map((l, j) => (
        <div key={set.keys[j]} className={`pp-bar ${profile ? 'auto' : ''}`}>
          <span className="pp-mute">{t(l)}</span>
          <span className="t">
            <i style={{ ['--w' as string]: shown ? set.values[j] / 100 : 0 }} />
            {avg && <u style={{ left: `${avg[j]}%` }} />}
          </span>
          <b>{Math.round(set.values[j] * n)}</b>
        </div>
      ))}
    </div>
  );
}

export default function PlayerDrawer({
  players,
  index,
  onIndex,
  onClose,
}: {
  players: PlayerView[];
  index: number;
  onIndex: (i: number) => void;
  onClose: () => void;
}) {
  const t = useT();
  const router = useRouter();
  const p = players[index];
  const [kind, setKind] = useState<'pro' | 'profile'>(p.pro ? 'pro' : 'profile');
  const [following, setFollowing] = useState<boolean | null>(null);
  const closeRef = useRef<HTMLButtonElement>(null);

  // a new player starts on council stats when they exist, else on profile stats
  useEffect(() => {
    setKind(p.pro ? 'pro' : 'profile');
    setFollowing(null);
    if (storage.getToken()) followService.isFollowing(p.userid).then(setFollowing).catch(() => setFollowing(null));
  }, [p]);

  useEffect(() => {
    const last = document.activeElement as HTMLElement | null;
    document.body.style.overflow = 'hidden';
    closeRef.current?.focus();
    return () => {
      document.body.style.overflow = '';
      last?.focus?.();
    };
  }, []);

  const go = (d: number) => onIndex((index + d + players.length) % players.length);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowRight') go(1);
      if (e.key === 'ArrowLeft') go(-1);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  const usePro = kind === 'pro' && !!p.pro;
  const set = usePro ? p.pro! : p.profile;
  const sameGroup = players.filter((x) => x.group === p.group);
  const avg = averageOf(usePro ? sameGroup.flatMap((x) => (x.pro && x.pro.values.length === p.pro!.values.length ? [x.pro] : [])) : sameGroup.map((x) => x.profile));
  const { given, family } = splitName(p.name);
  const pos = p.group ? POS_INFO[p.group] : null;

  const toggleFollow = async () => {
    if (!storage.getToken()) {
      router.push("/auth/login");
      return;
    }
    try {
      if (following) await followService.unfollowUser(p.userid);
      else await followService.followUser(p.userid);
      setFollowing(!following);
    } catch {
      // the button keeps its state; the user can try again
    }
  };

  return (
    <div className="pp-dr" role="dialog" aria-modal="true" aria-labelledby="pp-dr-name">
      <div className="pp-dr-scrim" onClick={onClose} />
      <div className="pp-dr-panel">
        <div className="pp-dr-top">
          <button ref={closeRef} className="pp-icb" onClick={onClose} aria-label={t('Đóng')}>
            <IconClose />
          </button>
          <span className="sp" />
          <button className="pp-icb" onClick={() => go(-1)} aria-label={t('Cầu thủ trước')} disabled={players.length < 2}>
            <IconPrev />
          </button>
          <span className="pp-hud pp-mute">
            {index + 1} / {players.length}
          </span>
          <button className="pp-icb" onClick={() => go(1)} aria-label={t('Cầu thủ sau')} disabled={players.length < 2}>
            <IconNext />
          </button>
        </div>
        <div className="pp-dr-body">
          <div className="pp-dr-stage">
            <PlayerStage
              image={p.fullBody}
              bigText={String(p.ovr || '')}
              name={given}
              keys={set.keys}
              values={set.values}
              profile={!usePro}
              enterKey={p.id}
            />
          </div>
          <div className="pp-dr-info">
            <div className="pp-idhead">
              <div className="pp-idav of-cut">
                <span className="clip">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  {p.avatar ? <img src={p.avatar} alt="" /> : <span className="in">{initials(p.name)}</span>}
                </span>
              </div>
              <h2 className="pp-disp" id="pp-dr-name">
                {given}
                {family && <small>{family}</small>}
              </h2>
              <div className={`pp-ovrpill of-cut ${p.pro ? '' : 'auto'}`}>
                <b>{p.ovr}</b>
                <span className="pp-hud pp-mute" style={{ fontSize: 9 }}>
                  {p.pro ? t('Điểm') : t('Hồ sơ')}
                </span>
              </div>
            </div>
            <div className="pp-pills">
              {pos && <span className="pp-pill ok">{t(pos.label)}</span>}
              {p.province && <span className="pp-pill">{p.province}</span>}
              {p.club && <span className="pp-pill">{p.club}</span>}
              {p.verified && <span className="pp-pill gold">{t('Đã xác minh')}</span>}
            </div>
            <div className="pp-facts">
              {(
                [
                  [p.age ?? '--', t('Tuổi')],
                  [p.height ?? '--', 'cm'],
                  [p.weight ?? '--', 'kg'],
                  [p.foot ? (p.foot === 'both' ? '2' : t(FOOT_LABEL[p.foot] ?? p.foot).slice(0, 1)) : '--', t('Chân')],
                ] as const
              ).map(([b, s], k) => (
                <div key={k} className="of-cut">
                  <b>{b}</b>
                  <span>{s}</span>
                </div>
              ))}
            </div>
            <div className="pp-panel of-cut pp-radarbox">
              <div className="pp-radarhead">
                <span className="pp-hud">{t('Hexagon chỉ số')}</span>
                <div className="pp-seg" role="group" aria-label={t('Loại chỉ số')}>
                  <button aria-pressed={kind === 'pro'} onClick={() => setKind('pro')}>
                    {t('Chuyên môn')}
                  </button>
                  <button aria-pressed={kind === 'profile'} onClick={() => setKind('profile')}>
                    {t('Hồ sơ')}
                  </button>
                </div>
              </div>
              {kind === 'pro' && !p.pro ? (
                <div className="pp-empty">
                  <IconHex />
                  <b>{t('Chưa có chỉ số chuyên môn')}</b>
                  {t('Hội đồng sẽ chấm ở vòng tuyển trạch. Trong lúc chờ, bấm "Hồ sơ" để xem chỉ số hồ sơ.')}
                </div>
              ) : (
                <>
                  <Radar values={set.values} average={avg} labels={set.labels.map((l) => t(l))} title={t('Biểu đồ 6 chỉ số')} />
                  <div className="pp-legend">
                    <span>
                      <i />
                      {given}
                    </span>
                    {avg && (
                      <span>
                        <i className="avg" />
                        {t('TB cùng vị trí')}
                      </span>
                    )}
                  </div>
                  <p className="pp-note">
                    {usePro
                      ? t('Hội đồng chuyên môn và thiết bị đo chấm ở vòng tuyển trạch.')
                      : t('Chỉ số hồ sơ tự tính từ thông tin cầu thủ khai báo, highlight và thành tích.')}
                  </p>
                </>
              )}
            </div>
            {!(kind === 'pro' && !p.pro) && <Bars set={set} avg={avg} profile={!usePro} />}
            <div className="pp-ctas">
              <Link className="pp-btn pp-btn-lime of-cut" href={`/profile/${p.userid}?from=players`}>
                {t('Xem hồ sơ đầy đủ')} <IconArrow />
              </Link>
              <button className="pp-btn pp-btn-ghost of-cut" onClick={toggleFollow}>
                {following ? t('Đang theo dõi') : t('Theo dõi')}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
