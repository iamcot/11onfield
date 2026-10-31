'use client';

import Radar from '@/components/pp/Radar';
import { useT } from '@/i18n/I18nProvider';
import type { CombineData, VisibilitySetting } from '@/services/user.service';

const AXES = ['pac', 'sho', 'pas', 'dri', 'def', 'phy'];
const AXIS_LABEL: Record<string, string> = { pac: 'Tốc độ', sho: 'Sút', pas: 'Chuyền', dri: 'Rê bóng', def: 'Phòng thủ', phy: 'Sức mạnh' };
/** Test colour, level 1 to 5: grey, red, orange, yellow, blue. */
const LEVELS = [
  { name: 'Xám', color: '#9aa5a0' },
  { name: 'Đỏ', color: '#ff7a66' },
  { name: 'Cam', color: '#ffa94d' },
  { name: 'Vàng', color: '#f3dfaf' },
  { name: 'Xanh', color: '#6ec6ff' },
];

function OwnerTag() {
  const t = useT();
  return <span className="pp-pill pp-ownertag">{t('Chỉ bạn thấy')}</span>;
}

/** Switch where the owner chooses to show a group to everyone or keep it for themselves. */
function ShowSwitch({ setting, busy, onChange }: { setting: VisibilitySetting; busy: boolean; onChange: (level: 'PRIVATE' | 'PUBLIC') => void }) {
  const t = useT();
  if (!setting.ownerCanHide) return null;
  if (setting.adminMax !== 'PUBLIC') return <span className="pp-mute pp-sw-note">{t('Ban tổ chức chưa mở công khai')}</span>;
  const on = (setting.mine ?? setting.adminMax) === 'PUBLIC';
  return (
    <label className="pp-sw">
      <span>{on ? t('Công khai') : t('Chỉ mình tôi')}</span>
      <input type="checkbox" role="switch" checked={on} disabled={busy} onChange={() => onChange(on ? 'PRIVATE' : 'PUBLIC')} />
      <i aria-hidden="true" />
    </label>
  );
}

/** "Scouting Combine" card on the player page. Shows only the blocks the server sent. */
export default function CombineCard({
  data,
  owner,
  settings,
  busy,
  onVisibility,
}: {
  data: CombineData;
  owner: boolean;
  settings?: VisibilitySetting[];
  busy?: boolean;
  onVisibility?: (group: string, level: 'PRIVATE' | 'PUBLIC') => void;
}) {
  const t = useT();
  const mine = (g: string) => settings?.find((s) => s.dataGroup === g);
  const ownerOnly = (g: string) => owner && !!data.ownerOnly?.includes(g);
  const axes = AXES.map((k) => data.hex?.find((a) => a.key === k));
  const hasHex = !!data.hex?.length;
  const testSetting = mine('TEST_RESULTS');

  return (
    <div className="pp-panel of-cut pp-box pp-b-combine" id="combine">
      <h3>
        {t('Scouting Combine')}
        {data.grade && <span className="pp-grade">{data.grade}</span>}
      </h3>
      {data.source && <p className="pp-mute pp-csrc">{data.source}</p>}

      <div className="pp-cgrid">
        {hasHex && (
          <div className="pp-chex">
            <Radar values={axes.map((a) => a?.value ?? 0)} labels={AXES.map((k) => t(AXIS_LABEL[k]))} size={260} title={t('Biểu đồ 6 chỉ số')} />
            {axes.some((a) => !a) && <p className="pp-note">{t('Trục chưa có dữ liệu sẽ có sau khi có số liệu GPS và video.')}</p>}
          </div>
        )}

        {data.groups && (
          <div className="pp-cscore">
            {data.total != null && (
              <div className="pp-ctotal">
                <b>{data.total}</b>
                <span>/ {data.totalMax}</span>
              </div>
            )}
            {data.groups.map((g) => (
              <div key={g.key} className="pp-cbar">
                <span>{t(g.label)}</span>
                <div className="pp-pbar" role="img" aria-label={`${g.score}/${g.max}`}>
                  <i style={{ transform: `scaleX(${g.max ? Math.min(1, g.score / g.max) : 0})` }} />
                </div>
                <em>
                  {g.score}/{g.max}
                </em>
              </div>
            ))}
          </div>
        )}
      </div>

      {data.tests && (
        <div className="pp-ctests">
          <div className="pp-ctests-h">
            <span className="pp-hud">{t('Kết quả từng bài')}</span>
            <span className="pp-ctests-r">
              {ownerOnly('TEST_RESULTS') && <OwnerTag />}
              {owner && testSetting && onVisibility && <ShowSwitch setting={testSetting} busy={!!busy} onChange={(l) => onVisibility('TEST_RESULTS', l)} />}
            </span>
          </div>
          <ul>
            {data.tests.map((r) => {
              const lv = LEVELS[Math.min(5, Math.max(1, r.level)) - 1];
              return (
                <li key={r.key}>
                  <span className="n">{t(r.name)}</span>
                  <b>{r.value}</b>
                  <span className="pp-lv" style={{ color: lv.color, borderColor: lv.color }}>
                    {t(lv.name)}
                  </span>
                  {r.vsAverage != null && (
                    <span className={`pp-vs ${r.vsAverage >= 0 ? 'up' : 'down'}`} title={t('So với trung bình cùng vị trí')}>
                      {r.vsAverage >= 0 ? '▲' : '▼'} {Math.abs(Math.round(r.vsAverage * 100))}%
                    </span>
                  )}
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}
