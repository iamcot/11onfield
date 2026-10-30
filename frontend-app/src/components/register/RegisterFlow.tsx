'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useAnalytics } from '@/hooks/useAnalytics';
import { competitionService, type Stage } from '@/services/competition.service';
import { provinceService, type Province } from '@/services/province.service';
import type { RegisterData } from '@/types';
import { barlowCondensed, chakraPetch } from '../home/fonts';
import { usePageEffects } from '../home/effects';
import StadiumBackdrop from '../home/StadiumBackdrop';
import { ArrowRight, cssVars } from '../home/ui';
import '../home/home.css';
import { useT } from '@/i18n/I18nProvider';

type Region = NonNullable<RegisterData['selectedRegion']>;

const POSITIONS = [
  { id: 'striker', label: 'Tiền đạo', code: 'TĐ', x: 50, y: 16 },
  { id: 'midfielder', label: 'Tiền vệ', code: 'TV', x: 50, y: 40 },
  { id: 'defender', label: 'Hậu vệ', code: 'HV', x: 50, y: 64 },
  { id: 'goalkeeper', label: 'Thủ môn', code: 'TM', x: 50, y: 88 },
];
const FEET = [
  { id: 'left', label: 'Trái' },
  { id: 'right', label: 'Phải' },
  { id: 'both', label: 'Cả hai' },
];
const REGIONS: { id: Region; label: string }[] = [
  { id: 'HANOI_NORTH', label: 'Hà Nội & Miền Bắc' },
  { id: 'DANANG_CENTRAL', label: 'Đà Nẵng & Miền Trung' },
  { id: 'HCMC_SOUTH', label: 'TP HCM & Miền Nam' },
];
const CONSENTS = [
  { id: 'truthfulInfo', text: 'Tôi xác nhận thông tin cung cấp là đúng sự thật.' },
  { id: 'contactPermission', text: 'Tôi đồng ý cho BTC liên hệ qua SĐT/email đã đăng ký.' },
  { id: 'mediaUsage', text: 'Tôi đồng ý cho BTC sử dụng hình ảnh/video trong phạm vi chương trình.' },
  { id: 'healthConfirmation', text: 'Tôi xác nhận đủ sức khỏe tham gia hoạt động bóng đá.' },
  { id: 'availability', text: 'Nếu được chọn, tôi có thể sắp xếp tham gia vòng tuyển chọn/huấn luyện theo lịch BTC.' },
];
const PLAYER_STEPS = ['Tài khoản', 'Thông tin cá nhân', 'Hồ sơ cầu thủ', 'Khu vực tuyển trạch', 'Xác nhận & gửi'];
const FAN_STEPS = ['Tài khoản', 'Thông tin cá nhân', 'Xác nhận & gửi'];
// Season 1 eligibility (from the programme rules): born 2006–2011, i.e. 16–21.
const BIRTH_YEAR_MIN = 2006;
const BIRTH_YEAR_MAX = 2011;

const initial = {
  isPlayer: true,
  phone: '',
  password: '',
  confirmPassword: '',
  fullName: '',
  dob: '',
  provinceId: '',
  email: '',
  positions: [] as string[],
  preferredFoot: '',
  height: '',
  weight: '',
  region: '' as Region | '',
  terms: false,
  consents: {} as Record<string, boolean>,
};
type Form = typeof initial;
type Errors = Partial<Record<string, string>>;

function ageOf(dob: string) {
  if (!dob) return null;
  const d = new Date(dob);
  if (Number.isNaN(d.getTime())) return null;
  const now = new Date();
  let a = now.getFullYear() - d.getFullYear();
  if (now.getMonth() < d.getMonth() || (now.getMonth() === d.getMonth() && now.getDate() < d.getDate())) a--;
  return a;
}

function initials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return '11';
  return (parts.length > 1 ? parts[parts.length - 2][0] + parts[parts.length - 1][0] : parts[0].slice(0, 2)).toUpperCase();
}

function formatDate(d: string) {
  const [y, m, day] = d.split('T')[0].split('-');
  return day && m && y ? `${day}/${m}/${y}` : d;
}

/* ------------------------------------------------------------ fields */

function Field({ label, error, hint, children }: { label: string; error?: string; hint?: ReactNode; children: ReactNode }) {
  return (
    <label className="block">
      <span className="of-hud text-[10px] text-[color:var(--mute)]">{label}</span>
      <div className="mt-1">{children}</div>
      {error ? <span className="mt-1 block text-[12.5px] text-[#FF8A80]">{error}</span> : hint ? <span className="mt-1 block text-[12.5px] text-[#9FB0A6]">{hint}</span> : null}
    </label>
  );
}

function Check({ checked, onChange, children }: { checked: boolean; onChange: (v: boolean) => void; children: ReactNode }) {
  return (
    <label className="of-check flex cursor-pointer items-start gap-3 text-[14.5px] text-[#E2EAE4]">
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} />
      <span aria-hidden="true" className="of-check-box">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3}>
          <path d="M5 12.5l4.5 4.5L19 7.5" />
        </svg>
      </span>
      <span>{children}</span>
    </label>
  );
}

/* ------------------------------------------------------- pitch picker */

function PitchPicker({ value, onToggle }: { value: string[]; onToggle: (id: string) => void }) {
  const t = useT();
  return (
    <div className="of-pitch relative mx-auto aspect-[3/4] w-full max-w-[340px]">
      <svg viewBox="0 0 300 400" className="absolute inset-0 h-full w-full" aria-hidden="true">
        <defs>
          <pattern id="mow" width="300" height="50" patternUnits="userSpaceOnUse">
            <rect width="300" height="25" fill="rgba(166,227,90,.07)" />
          </pattern>
        </defs>
        <rect x="1" y="1" width="298" height="398" fill="url(#mow)" stroke="rgba(214,250,158,.55)" strokeWidth="2" />
        <line x1="1" y1="200" x2="299" y2="200" stroke="rgba(214,250,158,.45)" strokeWidth="1.5" />
        <circle cx="150" cy="200" r="40" fill="none" stroke="rgba(214,250,158,.45)" strokeWidth="1.5" />
        <rect x="75" y="1" width="150" height="60" fill="none" stroke="rgba(214,250,158,.45)" strokeWidth="1.5" />
        <rect x="75" y="339" width="150" height="60" fill="none" stroke="rgba(214,250,158,.45)" strokeWidth="1.5" />
        <rect x="115" y="1" width="70" height="22" fill="none" stroke="rgba(214,250,158,.35)" strokeWidth="1.5" />
        <rect x="115" y="377" width="70" height="22" fill="none" stroke="rgba(214,250,158,.35)" strokeWidth="1.5" />
      </svg>
      {POSITIONS.map((p) => {
        const idx = value.indexOf(p.id);
        const on = idx >= 0;
        return (
          <button
            key={p.id}
            type="button"
            aria-pressed={on}
            onClick={() => onToggle(p.id)}
            className={`of-pos ${on ? 'is-on' : ''}`}
            style={{ left: `${p.x}%`, top: `${p.y}%` }}
          >
            {t(p.label)}
            {idx === 0 && <span className="of-pos-tag">{t('Chính')}</span>}
          </button>
        );
      })}
    </div>
  );
}

/* --------------------------------------------------------- player card */

function PlayerCard({ form, done = false }: { form: Form; done?: boolean }) {
  const t = useT();
  const age = ageOf(form.dob);
  const pos = POSITIONS.find((p) => p.id === form.positions[0]);
  const foot = FEET.find((f) => f.id === form.preferredFoot);
  const region = REGIONS.find((r) => r.id === form.region);
  return (
    <div className={`of-card ${done ? 'is-done' : ''}`}>
      <div className="of-glass-gold of-cut of-cut--lg of-cut--gold of-cut--b2 of-run of-sweep relative aspect-[3/4] overflow-hidden p-5">
        <div className="flex items-start justify-between">
          <div>
            <div className="of-display of-gold text-[44px] leading-none">{pos?.code ?? '--'}</div>
            <div className="of-hud mt-1 text-[10px] text-[color:var(--gold-2)]">{pos ? t(pos.label) : t('Vị trí')}</div>
          </div>
          <Image src="/images/logo-color-small.png" alt="" width={44} height={44} className="h-11 w-11 object-contain opacity-90" />
        </div>
        <div className="of-display pointer-events-none absolute inset-x-0 top-[22%] text-center text-[140px] leading-none" style={{ color: 'transparent', WebkitTextStroke: '1.5px rgba(227,194,126,.55)' }} aria-hidden="true">
          {initials(form.fullName)}
        </div>
        <div className="absolute inset-x-5 bottom-5">
          <div className="of-display truncate text-[30px] text-white">{form.fullName.trim() || t('Tên của bạn')}</div>
          <div className="of-rule my-2" />
          <div className="grid grid-cols-4 gap-1 text-center">
            {[
              [t('Tuổi'), age ?? '--'],
              [t('Chân'), foot ? t(foot.label) : '--'],
              ['Cao', form.height ? `${form.height}` : '--'],
              [t('Nặng'), form.weight ? `${form.weight}` : '--'],
            ].map(([k, v]) => (
              <div key={k as string}>
                <div className="of-num text-[17px] text-white">{v}</div>
                <div className="of-hud text-[9px] text-[color:var(--gold-2)]">{k}</div>
              </div>
            ))}
          </div>
          <div className="of-hud mt-3 truncate text-center text-[10px] text-[#CFC6AE]">{region ? t(region.label) : t('Chỉ số sẽ có sau vòng tuyển trạch')}</div>
        </div>
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------- flow */

export default function RegisterFlow() {
  const t = useT();
  const rootRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  usePageEffects(rootRef);
  const { register } = useAuth();
  const { track } = useAnalytics();

  const [form, setForm] = useState<Form>(initial);
  const [errors, setErrors] = useState<Errors>({});
  const [step, setStep] = useState(0);
  const [done, setDone] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [apiError, setApiError] = useState('');
  const [provinces, setProvinces] = useState<Province[]>([]);
  const [stages, setStages] = useState<Stage[]>([]);

  useEffect(() => {
    provinceService.getAllProvinces().then(setProvinces).catch(() => setProvinces([]));
    competitionService.getCurrentCompetition().then((c) => setStages(c?.stages ?? []));
  }, []);

  const steps = form.isPlayer ? PLAYER_STEPS : FAN_STEPS;
  // map visible step index to the logical screen
  const screen = form.isPlayer ? ['account', 'personal', 'player', 'region', 'confirm'][step] : ['account', 'personal', 'confirm'][step];
  const age = ageOf(form.dob);
  const birthYear = form.dob ? new Date(form.dob).getFullYear() : null;
  const eligible = birthYear !== null && birthYear >= BIRTH_YEAR_MIN && birthYear <= BIRTH_YEAR_MAX;

  const set = <K extends keyof Form>(k: K, v: Form[K]) => {
    setForm((f) => ({ ...f, [k]: v }));
    if (errors[k as string]) setErrors((e) => ({ ...e, [k]: undefined }));
  };

  const stageFor = useMemo(
    () => (region: Region) =>
      stages.filter((s) => s.region === region && s.stageType === 'REGIONAL_AUDITION').sort((a, b) => a.stageDate.localeCompare(b.stageDate))[0],
    [stages]
  );

  const validate = (): Errors => {
    const e: Errors = {};
    if (screen === 'account') {
      if (!/^0\d{9}$/.test(form.phone)) e.phone = t('Số điện thoại gồm 10 chữ số, bắt đầu bằng 0');
      if (form.password.length < 8) e.password = t('Mật khẩu phải có ít nhất 8 ký tự');
      if (form.confirmPassword !== form.password) e.confirmPassword = t('Mật khẩu nhập lại không khớp');
    }
    if (screen === 'personal') {
      if (!form.fullName.trim()) e.fullName = t('Vui lòng nhập họ và tên');
      if (form.isPlayer && !form.dob) e.dob = t('Vui lòng chọn ngày sinh');
      if (form.email && !/^\S+@\S+\.\S+$/.test(form.email)) e.email = t('Email không hợp lệ');
    }
    if (screen === 'player') {
      if (!form.positions.length) e.positions = t('Chạm vào sân để chọn ít nhất một vị trí');
      const h = Number(form.height);
      const w = Number(form.weight);
      if (form.height && (h < 120 || h > 230)) e.height = t('Chiều cao từ 120 đến 230 cm');
      if (form.weight && (w < 30 || w > 150)) e.weight = t('Cân nặng từ 30 đến 150 kg');
    }
    if (screen === 'region' && !form.region) e.region = t('Chọn khu vực bạn sẽ tham gia tuyển trạch');
    if (screen === 'confirm') {
      if (!form.terms) e.terms = t('Vui lòng đồng ý với điều khoản tham gia');
      if (form.isPlayer && CONSENTS.some((c) => !form.consents[c.id])) e.consents = t('Vui lòng xác nhận tất cả cam kết của cầu thủ');
    }
    return e;
  };

  const scrollTop = () => {
    const el = panelRef.current;
    if (el && el.getBoundingClientRect().top < 0) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const next = () => {
    const e = validate();
    setErrors(e);
    if (Object.keys(e).length) {
      track('form_validation_error', { form_name: 'registration', step: screen, fields_with_errors: Object.keys(e) });
      return;
    }
    if (screen === 'confirm') return submit();
    setStep((s) => Math.min(steps.length - 1, s + 1));
    scrollTop();
  };

  const back = () => {
    setErrors({});
    setApiError('');
    setStep((s) => Math.max(0, s - 1));
    scrollTop();
  };

  const submit = async () => {
    setSubmitting(true);
    setApiError('');
    const data: RegisterData = {
      fullName: form.fullName.trim(),
      phone: form.phone,
      password: form.password,
      role: form.isPlayer ? 'PLAYER' : 'USER',
      ...(form.email ? { email: form.email.trim() } : {}),
      ...(form.provinceId ? { provinceId: Number(form.provinceId) } : {}),
      ...(form.dob ? { dob: form.dob } : {}),
      ...(form.isPlayer
        ? {
            selectedRegion: form.region || undefined,
            playerProfile: {
              positions: form.positions,
              ...(form.height ? { height: form.height } : {}),
              ...(form.weight ? { weight: form.weight } : {}),
              ...(form.preferredFoot ? { preferredFoot: form.preferredFoot } : {}),
            },
          }
        : {}),
    };
    try {
      await register(data);
      track('user_register', { role: data.role, has_player_profile: form.isPlayer, region: form.region || null });
      setDone(true);
      scrollTop();
    } catch (err: unknown) {
      const raw = (err as { message?: string })?.message;
      // fetch() rejects with a TypeError when the API is unreachable or blocked by CORS
      const message =
        err instanceof TypeError || /failed to fetch|networkerror|load failed/i.test(raw ?? '')
          ? t('Không kết nối được máy chủ. Kiểm tra mạng và thử lại sau ít phút.')
          : t(raw || 'Đăng ký thất bại. Vui lòng thử lại.');
      track('api_error', { endpoint: '/auth/register', error_message: message, user_action: 'registration_attempt' });
      if (/điện thoại/i.test(message)) {
        setStep(0);
        setErrors({ phone: message });
      } else {
        setApiError(message);
      }
    } finally {
      setSubmitting(false);
    }
  };

  const togglePosition = (id: string) =>
    set('positions', form.positions.includes(id) ? form.positions.filter((p) => p !== id) : [...form.positions, id]);

  return (
    <div ref={rootRef} className={`of-root ${barlowCondensed.variable} ${chakraPetch.variable}`}>
      <StadiumBackdrop />
      <header className="of-header is-solid">
        <div className="mx-auto flex h-full max-w-[1240px] items-center gap-3 px-4 lg:px-6">
          <Link href="/" className="flex shrink-0 items-center" aria-label={t('11 On Field – Trang chủ')}>
            <Image src="/images/logo-white-full.png" alt="11 On Field" width={182} height={36} priority className="h-[28px] w-auto lg:h-[36px]" />
          </Link>
          <div className="ml-auto flex items-center gap-3 text-[13px] text-[#CBD6CF]">
            {done ? (
              <Link href="/profile" className="of-btn-ghost of-cut !min-h-[38px] !px-4 !text-[15px]">
                {t('Hồ sơ')}
              </Link>
            ) : (
              <>
                <span className="hidden sm:inline">{t('Đã có tài khoản?')}</span>
                <Link href="/auth/login" className="of-btn-ghost of-cut !min-h-[38px] !px-4 !text-[15px]">
                  {t('Đăng nhập')}
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      <main className="relative z-[1] px-4 pb-28 lg:px-6 lg:pb-20" style={{ paddingTop: 'calc(var(--header-h) + 24px)' }}>
        <div className="mx-auto grid max-w-[1240px] gap-8 lg:grid-cols-[360px_1fr] lg:gap-12">
          {/* left rail: progress + live card (desktop) */}
          <aside className="hidden lg:block">
            <div className="sticky top-[96px]">
              <div className="of-eyebrow of-eyebrow--left">{t('Đăng ký · Mùa 1')}</div>
              <h1 className="of-display mt-3 text-[56px] text-white" style={{ textShadow: '0 0 30px rgba(166,227,90,.35)' }}>
                {t('Bắt đầu')}
                <br />
                <span className="of-neon">{t('hành trình')}</span>
              </h1>
              <ol className="mt-6 flex flex-col gap-2">
                {steps.map((s, i) => (
                  <li key={s} className={`of-rstep ${done || i < step ? 'is-done' : i === step ? 'is-current' : ''}`}>
                    <span className="of-rstep-dot of-cut">{done || i < step ? '✓' : `0${i + 1}`}</span>
                    {t(s)}
                  </li>
                ))}
              </ol>
              {form.isPlayer && (
                <div className="mt-8 max-w-[300px]">
                  <PlayerCard form={form} done={done} />
                </div>
              )}
            </div>
          </aside>

          <div ref={panelRef} className="min-w-0 scroll-mt-24">
            {!done ? (
              <>
                {/* mobile progress */}
                <div className="lg:hidden">
                  <div className="of-hud text-[11px] text-[color:var(--gold)]">
                    {t('Bước')} {step + 1}/{steps.length}
                  </div>
                  <div className="mt-2 flex gap-1.5" aria-hidden="true">
                    {steps.map((s, i) => (
                      <span key={s} className={`of-seg ${i <= step ? 'is-on' : ''}`} />
                    ))}
                  </div>
                </div>

                <div key={screen} className="of-step-in of-glass of-cut of-cut--lg of-cut--b2 of-run mt-4 p-5 lg:mt-0 lg:p-9">
                  <div className="of-brackets" />
                  <div className="of-hud text-[11px] text-[color:var(--lime)]">
                    {t('Bước')} {step + 1} · {t(steps[step])}
                  </div>

                  {screen === 'account' && (
                    <>
                      <h2 className="of-display mt-1 text-[38px] lg:text-[48px]">{t('Tạo tài khoản')}</h2>
                      <p className="mt-1 text-[14.5px] text-[#CBD6CF]">{t('Nam, sinh từ 2006 đến 2011 · Miễn phí · Người Việt trong nước &amp; toàn cầu')}</p>
                      <div className="mt-5 grid grid-cols-2 gap-2" role="radiogroup" aria-label={t('Bạn tham gia với tư cách')}>
                        {[
                          { v: true, t: t('Đăng ký thi đấu'), s: t('Dành cho cầu thủ') },
                          { v: false, t: t('Người hâm mộ'), s: t('Theo dõi & bình chọn') },
                        ].map((o) => (
                          <button
                            key={o.t}
                            type="button"
                            role="radio"
                            aria-checked={form.isPlayer === o.v}
                            onClick={() => {
                              set('isPlayer', o.v);
                              setStep(0);
                            }}
                            className={`of-choice of-cut ${form.isPlayer === o.v ? 'is-on' : ''}`}
                          >
                            <span className="of-display text-[20px] text-white">{o.t}</span>
                            <span className="text-[12.5px] text-[#AFC0B6]">{o.s}</span>
                          </button>
                        ))}
                      </div>
                      <div className="mt-5 grid gap-4">
                        <Field label={t('Số điện thoại')} error={errors.phone} hint={t('Dùng để đăng nhập và nhận thông báo qua Zalo')}>
                          <input
                            className="of-field"
                            type="tel"
                            inputMode="numeric"
                            autoComplete="tel"
                            placeholder="0901234567"
                            value={form.phone}
                            onChange={(e) => set('phone', e.target.value.replace(/\D/g, '').slice(0, 10))}
                          />
                        </Field>
                        <div className="grid gap-4 sm:grid-cols-2">
                          <Field label={t('Mật khẩu')} error={errors.password}>
                            <input className="of-field" type="password" autoComplete="new-password" placeholder={t('Ít nhất 8 ký tự')} value={form.password} onChange={(e) => set('password', e.target.value)} />
                          </Field>
                          <Field label={t('Nhập lại mật khẩu')} error={errors.confirmPassword}>
                            <input className="of-field" type="password" autoComplete="new-password" value={form.confirmPassword} onChange={(e) => set('confirmPassword', e.target.value)} />
                          </Field>
                        </div>
                      </div>
                    </>
                  )}

                  {screen === 'personal' && (
                    <>
                      <h2 className="of-display mt-1 text-[38px] lg:text-[48px]">{t('Thông tin cá nhân')}</h2>
                      <div className="mt-5 grid gap-4">
                        <Field label={t('Họ và tên')} error={errors.fullName}>
                          <input className="of-field" autoComplete="name" placeholder={t('Nguyễn Văn A')} value={form.fullName} onChange={(e) => set('fullName', e.target.value)} />
                        </Field>
                        <div className="grid gap-4 sm:grid-cols-2">
                          <Field
                            label={form.isPlayer ? t('Ngày sinh') : t('Ngày sinh (không bắt buộc)')}
                            error={errors.dob}
                            hint={
                              form.isPlayer && age !== null ? (
                                eligible ? (
                                  <span className="text-[color:var(--lime-2)]">✓ {age} {t('tuổi: đủ điều kiện độ tuổi 16 – 21')}</span>
                                ) : (
                                  <span className="text-[color:var(--gold-2)]">{age} {t('tuổi: mùa 1 dành cho cầu thủ sinh 2006 – 2011')}</span>
                                )
                              ) : undefined
                            }
                          >
                            <input className="of-field" type="date" max={new Date().toISOString().slice(0, 10)} value={form.dob} onChange={(e) => set('dob', e.target.value)} />
                          </Field>
                          {provinces.length > 0 && (
                            <Field label={t('Tỉnh / Thành phố')}>
                              <select className="of-field" value={form.provinceId} onChange={(e) => set('provinceId', e.target.value)}>
                                <option value="">{t('Chọn tỉnh / thành')}</option>
                                {provinces.map((p) => (
                                  <option key={p.id} value={p.id}>
                                    {p.name}
                                  </option>
                                ))}
                              </select>
                            </Field>
                          )}
                        </div>
                        <Field label={t('Email (không bắt buộc)')} error={errors.email} hint={t('Nhận xác nhận hồ sơ và lịch tuyển trạch')}>
                          <input className="of-field" type="email" autoComplete="email" placeholder="email@example.com" value={form.email} onChange={(e) => set('email', e.target.value)} />
                        </Field>
                      </div>
                    </>
                  )}

                  {screen === 'player' && (
                    <>
                      <h2 className="of-display mt-1 text-[38px] lg:text-[48px]">{t('Hồ sơ cầu thủ')}</h2>
                      <div className="mt-5 grid gap-6 md:grid-cols-[minmax(0,340px)_1fr] md:items-start">
                        <div>
                          <div className="of-hud mb-2 text-[10px] text-[color:var(--mute)]">{t('Vị trí sở trường (chạm vào sân)')}</div>
                          <PitchPicker value={form.positions} onToggle={togglePosition} />
                          <div className={`mt-2 text-[12.5px] ${errors.positions ? 'text-[#FF8A80]' : 'text-[#9FB0A6]'}`}>
                            {errors.positions ||
                              (form.positions.length
                                ? t('Đã chọn: {positions}', { positions: form.positions.map((id) => t(POSITIONS.find((p) => p.id === id)?.label ?? '')).join(', ') })
                                : t('Chọn nhiều vị trí được, vị trí đầu tiên là vị trí chính'))}
                          </div>
                        </div>
                        <div className="grid gap-4">
                          <div>
                            <div className="of-hud mb-2 text-[10px] text-[color:var(--mute)]">{t('Chân thuận')}</div>
                            <div className="grid grid-cols-3 gap-2">
                              {FEET.map((f) => (
                                <button
                                  key={f.id}
                                  type="button"
                                  aria-pressed={form.preferredFoot === f.id}
                                  onClick={() => set('preferredFoot', f.id)}
                                  className={`of-choice of-cut !min-h-[48px] !items-center ${form.preferredFoot === f.id ? 'is-on' : ''}`}
                                >
                                  <span className="text-[15px] font-semibold text-white">{t(f.label)}</span>
                                </button>
                              ))}
                            </div>
                          </div>
                          <div className="grid grid-cols-2 gap-3">
                            <Field label={t('Chiều cao (cm)')} error={errors.height}>
                              <input className="of-field" type="number" inputMode="numeric" placeholder="175" value={form.height} onChange={(e) => set('height', e.target.value)} />
                            </Field>
                            <Field label={t('Cân nặng (kg)')} error={errors.weight}>
                              <input className="of-field" type="number" inputMode="numeric" placeholder="68" value={form.weight} onChange={(e) => set('weight', e.target.value)} />
                            </Field>
                          </div>
                          <p className="text-[13px] text-[#9FB0A6]">{t('Ảnh chân dung, video highlight và CLB đã thi đấu bạn bổ sung trong hồ sơ ngay sau khi đăng ký.')}</p>
                        </div>
                      </div>
                    </>
                  )}

                  {screen === 'region' && (
                    <>
                      <h2 className="of-display mt-1 text-[38px] lg:text-[48px]">{t('Khu vực tuyển trạch')}</h2>
                      <p className="mt-1 text-[14.5px] text-[#CBD6CF]">{t('Chọn nơi bạn sẽ thi đấu trực tiếp ở vòng Scouting.')}</p>
                      <div className="mt-5 grid gap-3 md:grid-cols-3" role="radiogroup" aria-label={t('Khu vực tuyển trạch')}>
                        {REGIONS.map((r) => {
                          const st = stageFor(r.id);
                          const on = form.region === r.id;
                          return (
                            <button key={r.id} type="button" role="radio" aria-checked={on} onClick={() => set('region', r.id)} className={`of-choice of-cut of-choice--big ${on ? 'is-on' : ''}`}>
                              <span className="of-radio" aria-hidden="true" />
                              <span className="of-display text-[26px] text-white">{t(r.label)}</span>
                              <span className="of-num text-[13px] text-[#AFC0B6]">{st ? `${formatDate(st.stageDate)}${st.title ? ` · ${st.title}` : ''}` : t('Lịch sẽ thông báo sau')}</span>
                            </button>
                          );
                        })}
                      </div>
                      {errors.region && <div className="mt-2 text-[12.5px] text-[#FF8A80]">{errors.region}</div>}
                    </>
                  )}

                  {screen === 'confirm' && (
                    <>
                      <h2 className="of-display mt-1 text-[38px] lg:text-[48px]">{t('Xác nhận &amp; gửi')}</h2>
                      <dl className="mt-5 grid gap-x-6 gap-y-3 sm:grid-cols-2">
                        {[
                          [t('Họ tên'), form.fullName],
                          [t('Số điện thoại'), form.phone],
                          [t('Ngày sinh'), form.dob ? `${formatDate(form.dob)}${age !== null ? t(' · {age} tuổi', { age }) : ''}` : '—'],
                          ...(form.isPlayer
                            ? [
                                [t('Vị trí'), form.positions.map((id) => t(POSITIONS.find((p) => p.id === id)?.label ?? '')).join(', ')],
                                [t('Chân thuận'), t(FEET.find((f) => f.id === form.preferredFoot)?.label ?? '—')],
                                [t('Khu vực'), t(REGIONS.find((r) => r.id === form.region)?.label ?? '—')],
                              ]
                            : []),
                        ].map(([k, v]) => (
                          <div key={k} className="border-b border-white/10 pb-2">
                            <dt className="of-hud text-[10px] text-[color:var(--mute)]">{k}</dt>
                            <dd className="mt-0.5 text-[15px] text-white">{v || '—'}</dd>
                          </div>
                        ))}
                      </dl>
                      <div className="mt-6 grid gap-3">
                        <Check checked={form.terms} onChange={(v) => set('terms', v)}>
                          {t('Tôi đồng ý với')}{' '}
                          <Link href="/terms" target="_blank" className="text-[color:var(--lime-2)] underline underline-offset-2">
                            {t('Điều khoản tham gia')}
                          </Link>{' '}
                          {t('và')}{' '}
                          <Link href="/privacy" target="_blank" className="text-[color:var(--lime-2)] underline underline-offset-2">
                            {t('Chính sách bảo mật')}
                          </Link>
                          .
                        </Check>
                        {errors.terms && <div className="text-[12.5px] text-[#FF8A80]">{errors.terms}</div>}
                        {form.isPlayer && (
                          <>
                            <div className="of-rule my-1" />
                            <div className="of-hud text-[10px] text-[color:var(--mute)]">{t('Cam kết của cầu thủ')}</div>
                            {CONSENTS.map((c) => (
                              <Check key={c.id} checked={!!form.consents[c.id]} onChange={(v) => set('consents', { ...form.consents, [c.id]: v })}>
                                {t(c.text)}
                              </Check>
                            ))}
                            <button
                              type="button"
                              className="self-start text-[13px] text-[color:var(--lime-2)] underline underline-offset-2"
                              onClick={() => set('consents', Object.fromEntries(CONSENTS.map((c) => [c.id, true])))}
                            >
                              {t('Đồng ý tất cả cam kết')}
                            </button>
                            {errors.consents && <div className="text-[12.5px] text-[#FF8A80]">{errors.consents}</div>}
                          </>
                        )}
                      </div>
                      {apiError && <div className="mt-4 border border-[#FF8A80]/50 bg-[#FF8A80]/10 px-4 py-3 text-[14px] text-[#FFD2CC]">{apiError}</div>}
                    </>
                  )}

                  {/* actions (desktop inline, mobile sticky) */}
                  <div className="of-actions">
                    {step > 0 ? (
                      <button type="button" onClick={back} className="of-btn-ghost of-cut">
                        {t('Quay lại')}
                      </button>
                    ) : (
                      <span />
                    )}
                    <button type="button" onClick={next} disabled={submitting} className="of-btn flex-1 sm:flex-none">
                      {submitting ? t('Đang gửi…') : screen === 'confirm' ? t('Gửi hồ sơ') : t('Tiếp tục')} {!submitting && <ArrowRight />}
                    </button>
                  </div>
                </div>

                {form.isPlayer && step > 0 && (
                  <div className="mx-auto mt-8 max-w-[260px] lg:hidden">
                    <div className="of-hud mb-2 text-center text-[10px] text-[color:var(--gold-2)]">{t('Thẻ cầu thủ của bạn')}</div>
                    <PlayerCard form={form} />
                  </div>
                )}
              </>
            ) : (
              <div className="of-step-in grid items-center gap-8 md:grid-cols-[260px_1fr] lg:grid-cols-1">
                <div className="mx-auto w-full max-w-[260px] lg:hidden">{form.isPlayer && <PlayerCard form={form} done />}</div>
                <div className="of-glass of-cut of-cut--lg of-cut--b2 of-run p-6 lg:p-10">
                  <div className="of-brackets" />
                  <div className="of-burst" aria-hidden="true">
                    {Array.from({ length: 14 }).map((_, i) => (
                      <i key={i} style={cssVars({ '--r': `${(360 / 14) * i}deg`, '--dl': `${(i % 4) * 60}ms` })} />
                    ))}
                  </div>
                  <div className="of-hud text-[11px] text-[color:var(--lime)]">{t('Hoàn tất')}</div>
                  <h2 className="of-display mt-1 text-[46px] text-white lg:text-[64px]">
                    {form.isPlayer ? (
                      <>
                        {t('Hồ sơ')} <span className="of-neon">{t('đã gửi!')}</span>
                      </>
                    ) : (
                      <>
                        {t('Chào mừng')} <span className="of-neon">{t('bạn!')}</span>
                      </>
                    )}
                  </h2>
                  <p className="mt-2 max-w-[560px] text-[15.5px] text-[#E2EAE4]">
                    {form.isPlayer
                      ? t('Ban tổ chức sẽ liên hệ qua số điện thoại và email bạn đăng ký về lịch tuyển trạch khu vực.')
                      : t('Tài khoản của bạn đã sẵn sàng để theo dõi chương trình và bình chọn cho cầu thủ yêu thích.')}
                  </p>
                  {form.isPlayer && (
                    <>
                      <div className="of-hud mt-6 text-[10px] text-[color:var(--mute)]">{t('Việc nên làm tiếp')}</div>
                      <ul className="mt-2 grid gap-2 text-[15px]">
                        {[t('Thêm ảnh chân dung và video highlight 1–3 phút'), t('Bổ sung thành tích, CLB đã thi đấu'), t('Theo dõi lịch tuyển trạch khu vực của bạn')].map((tip, i) => (
                          <li key={tip} className="flex items-center gap-3">
                            <span className="of-num flex h-7 w-7 shrink-0 items-center justify-center border border-[rgba(166,227,90,.5)] text-[12px] text-[color:var(--lime-2)]">0{i + 1}</span>
                            {tip}
                          </li>
                        ))}
                      </ul>
                    </>
                  )}
                  <div className="mt-7 flex flex-col gap-3 sm:flex-row">
                    <Link href="/profile" className="of-btn">
                      {form.isPlayer ? t('Hoàn thiện hồ sơ') : t('Vào trang cá nhân')} <ArrowRight />
                    </Link>
                    <Link href="/competitions" className="of-btn-ghost of-cut">
                      {t('Xem chương trình')}
                    </Link>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
