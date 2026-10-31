'use client';

import { useEffect, useMemo, useState, type PointerEvent as ReactPointerEvent } from 'react';
import Radar from '@/components/pp/Radar';
import { IconCards, IconList, IconPitch, IconSearch } from '@/components/pp/icons';
import { useT } from '@/i18n/I18nProvider';
import { FOOT_LABEL, initials, POS_INFO, splitName } from '@/lib/players/stats';
import { formation, toPlayerView, type PlayerView } from '@/lib/players/view';
import { playerService } from '@/services/player.service';
import PlayerDrawer from './PlayerDrawer';

type View = 'list' | 'card' | 'pitch';

const PAGE = 24;
const FILTERS: { id: string; label: string; positions: string[] }[] = [
  { id: 'all', label: 'Tất cả', positions: [] },
  { id: 'FW', label: 'Tiền đạo', positions: ['striker'] },
  { id: 'MF', label: 'Tiền vệ', positions: ['midfielder'] },
  { id: 'DF', label: 'Hậu vệ', positions: ['defender', 'centerback'] },
  { id: 'GK', label: 'Thủ môn', positions: ['goalkeeper'] },
];

function Avatar({ p }: { p: PlayerView }) {
  return (
    <span className="clip">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      {p.avatar ? <img src={p.avatar} alt="" loading="lazy" /> : <span className="in">{initials(p.name)}</span>}
    </span>
  );
}

function PosTag({ p }: { p: PlayerView }) {
  const t = useT();
  if (!p.group) return null;
  return <span className={`pp-pos ${p.group === 'GK' ? 'gk' : ''}`}>{t(POS_INFO[p.group].code)}</span>;
}

/** Shown next to the name of someone the jury put in the published Top 30. */
export function Top30Badge() {
  return <span className="pp-t30b" aria-label="Top 30"><span>TOP 30</span></span>;
}

export default function PlayersTab({ competitionId, finalOpen, total, top30 }: { competitionId: number; finalOpen: boolean; total?: number; top30?: Set<string> }) {
  const t = useT();
  const [view, setView] = useState<View>(finalOpen ? 'pitch' : 'list');
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [query, setQuery] = useState('');
  const [players, setPlayers] = useState<PlayerView[]>([]);
  const [page, setPage] = useState(0);
  const [pages, setPages] = useState(0);
  const [count, setCount] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState<number | null>(null);

  useEffect(() => setView(finalOpen ? 'pitch' : 'list'), [finalOpen]);

  useEffect(() => {
    const id = setTimeout(() => setQuery(search.trim()), 400);
    return () => clearTimeout(id);
  }, [search]);

  // first page again whenever the filters change; the pitch needs the whole squad in one go
  useEffect(() => {
    let live = true;
    setLoading(true);
    const positions = FILTERS.find((f) => f.id === filter)?.positions ?? [];
    playerService
      .getPlayers(0, view === 'pitch' ? 100 : PAGE, { search: query || undefined, positions, competitionId })
      .then((r) => {
        if (!live) return;
        setPlayers(r.data.map(toPlayerView));
        setPage(0);
        setPages(r.totalPages);
        setCount(r.total);
      })
      .catch(() => live && setPlayers([]))
      .finally(() => live && setLoading(false));
    return () => {
      live = false;
    };
  }, [competitionId, filter, query, view === 'pitch']); // eslint-disable-line react-hooks/exhaustive-deps

  const loadMore = () => {
    const positions = FILTERS.find((f) => f.id === filter)?.positions ?? [];
    setLoading(true);
    playerService
      .getPlayers(page + 1, PAGE, { search: query || undefined, positions, competitionId })
      .then((r) => {
        setPlayers((old) => [...old, ...r.data.map(toPlayerView)]);
        setPage(page + 1);
        setPages(r.totalPages);
      })
      .finally(() => setLoading(false));
  };

  const lineup = useMemo(() => (view === 'pitch' ? formation(players) : []), [players, view]);
  const order = view === 'pitch' ? lineup.map(([p]) => p) : players;

  const tilt = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (e.pointerType !== 'mouse') return;
    const c = (e.target as HTMLElement).closest<HTMLElement>('.pp-cc');
    if (!c) return;
    const r = c.getBoundingClientRect();
    c.style.setProperty('--ry', `${((e.clientX - r.left) / r.width - 0.5) * 20}deg`);
    c.style.setProperty('--rx', `${(0.5 - (e.clientY - r.top) / r.height) * 16}deg`);
  };
  const untilt = (e: ReactPointerEvent<HTMLDivElement>) => {
    const c = (e.target as HTMLElement).closest<HTMLElement>('.pp-cc');
    if (c && !c.contains(e.relatedTarget as Node)) {
      c.style.setProperty('--rx', '0deg');
      c.style.setProperty('--ry', '0deg');
    }
  };

  return (
    <div>
      <div className="pp-tools">
        <label className="pp-search of-cut">
          <IconSearch />
          <input type="search" value={search} onChange={(e) => setSearch(e.target.value)} placeholder={t('Tìm tên cầu thủ')} aria-label={t('Tìm tên cầu thủ')} autoComplete="off" />
        </label>
        <div className="pp-seg" role="group" aria-label={t('Kiểu xem')}>
          <button aria-pressed={view === 'list'} onClick={() => setView('list')}>
            <IconList />
            {t('Danh sách')}
          </button>
          <button aria-pressed={view === 'card'} onClick={() => setView('card')}>
            <IconCards />
            {t('Thẻ')}
          </button>
          {finalOpen && (
            <button aria-pressed={view === 'pitch'} onClick={() => setView('pitch')}>
              <IconPitch />
              {t('Đội hình 11')}
            </button>
          )}
        </div>
      </div>
      {view !== 'pitch' && (
        <div className="pp-chips" role="group" aria-label={t('Lọc')}>
          {FILTERS.map((f) => (
            <button key={f.id} className="pp-chip" aria-pressed={filter === f.id} onClick={() => setFilter(f.id)}>
              {t(f.label)}
            </button>
          ))}
        </div>
      )}
      {count !== null && view !== 'pitch' && (
        <p className="pp-count">{t('{n} cầu thủ', { n: (count ?? total ?? 0).toLocaleString() })}</p>
      )}

      {loading && players.length === 0 ? (
        <div className="pp-spin" aria-label={t('Đang tải...')} />
      ) : players.length === 0 ? (
        <p className="pp-mute" style={{ padding: '24px 0' }}>
          {t('Không có cầu thủ khớp bộ lọc.')}
        </p>
      ) : view === 'list' ? (
        <div className="pp-plist">
          {players.map((p, k) => {
            const { given, family } = splitName(p.name);
            const set = p.pro ?? p.profile;
            return (
              <button
                key={p.id}
                className={`pp-prow of-cut ${p.verified ? 'verified' : ''}`}
                style={{ animationDelay: `${Math.min(k % PAGE, 12) * 35}ms` }}
                onClick={() => setOpen(k)}
                aria-label={`${p.name}, ${p.ovr}`}
              >
                <span className="pp-av of-cut">
                  <Avatar p={p} />
                </span>
                <span className="pp-pname">
                  <b>
                    {given}
                    {family && <small className="pp-mute" style={{ fontSize: '.7em', marginLeft: 6 }}>{family}</small>}
                    {top30?.has(p.userid) && <Top30Badge />}
                  </b>
                  <span className="pp-pmeta">
                    <PosTag p={p} />
                    {p.verified && <span className="pp-pos ok">{t('Đã xác minh')}</span>}
                    <span>{[p.age != null ? t('{n} tuổi', { n: p.age }) : null, p.height ? `${p.height}cm` : null, p.province].filter(Boolean).join(' · ')}</span>
                  </span>
                </span>
                <span className="pp-pright">
                  <span className="pp-facts-in">
                    <span><b>{p.weight ?? '--'}</b><small>kg</small></span>
                    <span><b>{p.foot ? (p.foot === 'both' ? '2' : t(FOOT_LABEL[p.foot] ?? p.foot).slice(0, 1)) : '--'}</b><small>{t('Chân')}</small></span>
                  </span>
                  <span className="pp-minihex">
                    <Radar values={set.values} size={52} small />
                  </span>
                  <span className={`pp-ovrb ${p.pro ? '' : 'auto'}`}>
                    <b>{p.ovr}</b>
                    <small>{p.pro ? t('Điểm') : t('Hồ sơ')}</small>
                  </span>
                </span>
              </button>
            );
          })}
        </div>
      ) : view === 'card' ? (
        <div className="pp-grid" onPointerMove={tilt} onPointerOut={untilt}>
          {players.map((p, k) => (
            <button key={p.id} className="pp-ccard" style={{ animationDelay: `${Math.min(k % PAGE, 12) * 40}ms` }} onClick={() => setOpen(k)} aria-label={p.name}>
              <span className={`pp-cc of-glass-gold of-cut of-cut--lg of-cut--gold of-cut--b2 of-sweep ${p.verified ? 'of-run' : 'of-run-hover'}`}>
                <span className="hd">
                  <span>
                    <span className="code pp-gold">{p.group ? t(POS_INFO[p.group].code) : '--'}</span>
                    <span className="lbl">{p.group ? t(POS_INFO[p.group].label) : t('Vị trí')}</span>
                    <span className="ovr">
                      {p.ovr}
                      <small>{p.pro ? t('Điểm') : t('Hồ sơ')}</small>
                    </span>
                  </span>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img className="lg" src="/images/logo-white-small.png" alt="" />
                </span>
                {p.avatar ? (
                  <span className="face">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={p.avatar} alt="" loading="lazy" />
                  </span>
                ) : (
                  <span className="ini" aria-hidden="true">
                    {initials(p.name)}
                  </span>
                )}
                <span className="ft">
                  <span className="nm">{p.name}{top30?.has(p.userid) && <Top30Badge />}</span>
                  <span className="pp-rule" />
                  <span className="f4">
                    <span><b>{p.age ?? '--'}</b><small>{t('Tuổi')}</small></span>
                    <span><b>{p.foot ? t(FOOT_LABEL[p.foot] ?? p.foot) : '--'}</b><small>{t('Chân')}</small></span>
                    <span><b>{p.height ?? '--'}</b><small>{t('Cao')}</small></span>
                    <span><b>{p.weight ?? '--'}</b><small>{t('Nặng')}</small></span>
                  </span>
                  <span className="rg">{p.province ?? t('Chỉ số sẽ có sau vòng tuyển trạch')}</span>
                </span>
              </span>
            </button>
          ))}
        </div>
      ) : (
        <div className="pp-pitchwrap">
          <div className="pp-pitch">
            <svg className="lines" viewBox="0 0 68 88" preserveAspectRatio="none" fill="none" stroke="rgba(255,255,255,.55)" strokeWidth=".35" aria-hidden="true">
              <rect x="2" y="2" width="64" height="84" />
              <path d="M2 44h64" />
              <circle cx="34" cy="44" r="7.5" />
              <rect x="15" y="2" width="38" height="14" />
              <rect x="24" y="2" width="20" height="5" />
              <rect x="15" y="72" width="38" height="14" />
              <rect x="24" y="81" width="20" height="5" />
            </svg>
            {lineup.map(([p, x, y], k) => (
              <button key={p.id} className="pp-tok" style={{ left: `${x}%`, top: `${y}%` }} onClick={() => setOpen(k)} aria-label={p.name}>
                <span className="face">
                  <span className="disc">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    {p.avatar ? <img src={p.avatar} alt="" /> : <span className="in">{initials(p.name)}</span>}
                  </span>
                  <span className="ovr">{p.ovr}</span>
                </span>
                <span className="nm">{splitName(p.name).given}</span>
              </button>
            ))}
          </div>
          <p className="pp-pitchnote">{t('11 cầu thủ ra sân trận chung kết, xếp theo sơ đồ 4-3-3. Bấm vào cầu thủ để xem thẻ.')}</p>
        </div>
      )}

      {view !== 'pitch' && page + 1 < pages && (
        <div className="pp-more">
          <button className="pp-btn pp-btn-ghost of-cut" onClick={loadMore} disabled={loading}>
            {loading ? t('Đang tải...') : t('Xem thêm cầu thủ')}
          </button>
        </div>
      )}

      {open !== null && order[open] && <PlayerDrawer players={order} index={open} onIndex={setOpen} onClose={() => setOpen(null)} />}
    </div>
  );
}
