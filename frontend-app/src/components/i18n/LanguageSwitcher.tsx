'use client';

import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { LOCALES, LOCALE_LABELS, type Locale } from '@/i18n/config';
import { useI18n } from '@/i18n/I18nProvider';
import Flag from './Flag';

// shown on the transition screen, in the language being switched to
// i18n-ignore
const SWITCHING: Record<Locale, string> = { vi: 'Đang chuyển ngôn ngữ', en: 'Switching language', es: 'Cambiando de idioma', ko: '언어 전환 중' };
const COVER_MS = 520; // keep in sync with .of-lang-wipe in home.css
const MIN_HOLD_MS = 380;

type Phase = 'idle' | 'in' | 'hold' | 'out';

/**
 * Flag button that opens a centred language picker. Picking a language plays a stadium-board wipe
 * that covers the page while it re-renders, then uncovers it in the new language.
 * The button is a chamfered square filled by the current flag, sized like the header's menu button;
 * `round` makes it a circle, for the app bar next to the round bell and avatar.
 */
export default function LanguageSwitcher({ className = '', round = false }: { className?: string; round?: boolean }) {
  const { locale, setLocale, switching, t } = useI18n();
  const [open, setOpen] = useState(false);
  const [target, setTarget] = useState<Locale | null>(null);
  const [phase, setPhase] = useState<Phase>('idle');
  const [host, setHost] = useState<Element | null>(null);
  const btnRef = useRef<HTMLButtonElement>(null);
  const firstRef = useRef<HTMLButtonElement>(null);
  const holdStart = useRef(0);

  useEffect(() => {
    // portal into the themed root so fonts and colour tokens apply, and fixed positioning isn't
    // trapped by a header with backdrop-filter
    setHost(btnRef.current?.closest('.of-root') ?? document.body);
  }, []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    firstRef.current?.focus();
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
      btnRef.current?.focus();
    };
  }, [open]);

  // wipe in → switch under cover → wait for the re-render → wipe out
  useEffect(() => {
    if (phase === 'in' && target) {
      const id = setTimeout(() => {
        holdStart.current = Date.now();
        setPhase('hold');
        setLocale(target);
      }, COVER_MS);
      return () => clearTimeout(id);
    }
    if (phase === 'hold' && !switching && locale === target) {
      const id = setTimeout(() => setPhase('out'), Math.max(0, MIN_HOLD_MS - (Date.now() - holdStart.current)));
      return () => clearTimeout(id);
    }
    if (phase === 'out') {
      const id = setTimeout(() => {
        setPhase('idle');
        setTarget(null);
      }, COVER_MS + 80);
      return () => clearTimeout(id);
    }
  }, [phase, target, switching, locale, setLocale]);

  const choose = (l: Locale) => {
    setOpen(false);
    if (l === locale || phase !== 'idle') return;
    setTarget(l);
    setPhase('in');
  };

  return (
    <>
      <button
        ref={btnRef}
        type="button"
        aria-haspopup="dialog"
        aria-label={`${t('Ngôn ngữ')}: ${LOCALE_LABELS[locale].name}`}
        onClick={() => setOpen(true)}
        title={LOCALE_LABELS[locale].name}
        className={`of-lang-btn ${round ? 'of-lang-btn--round' : 'of-cut'} ${className}`}
      >
        <Flag locale={locale} square className="of-lang-flag" />
      </button>

      {host &&
        open &&
        createPortal(
          <div className="of-lang-modal" role="dialog" aria-modal="true" aria-labelledby="of-lang-title" onClick={() => setOpen(false)}>
            <div className="of-lang-panel of-glass of-cut of-cut--lg of-run" onClick={(e) => e.stopPropagation()}>
              <div className="of-brackets" />
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="of-hud text-[11px] text-[color:var(--lime,#a6e35a)]">Language · Idioma · 언어</div>
                  <h2 id="of-lang-title" className="of-display mt-1 text-[36px] leading-none text-white sm:text-[44px]">
                    {t('Chọn ngôn ngữ')}
                  </h2>
                </div>
                <button type="button" className="of-lang-close of-cut" style={{ ['--c' as string]: '8px' }} aria-label={t('Đóng')} onClick={() => setOpen(false)}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden="true">
                    <path d="M6 6l12 12M18 6L6 18" />
                  </svg>
                </button>
              </div>
              <div className="mt-6 grid grid-cols-2 gap-3">
                {LOCALES.map((l, i) => (
                  <button
                    key={l}
                    ref={i === 0 ? firstRef : undefined}
                    type="button"
                    lang={l}
                    aria-pressed={l === locale}
                    onClick={() => choose(l)}
                    className={`of-lang-card of-cut ${l === locale ? 'is-active' : ''}`}
                    style={{ ['--i' as string]: i }}
                  >
                    <Flag locale={l} className="of-lang-card-flag" />
                    <span className="min-w-0 text-left">
                      <span className="of-display block truncate text-[24px] leading-tight text-white sm:text-[28px]">{LOCALE_LABELS[l].name}</span>
                      <span className="of-hud block text-[10px] text-[color:var(--mute,#c4d0c8)]">{l === locale ? `✓ ${LOCALE_LABELS[l].short}` : LOCALE_LABELS[l].short}</span>
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>,
          host
        )}

      {host &&
        phase !== 'idle' &&
        target &&
        createPortal(
          <div className={`of-lang-wipe is-${phase}`} aria-live="polite">
            <i className="of-lang-wipe-a" />
            <i className="of-lang-wipe-b" />
            <div className="of-lang-wipe-label">
              <Flag locale={target} className="of-lang-wipe-flag" />
              <div className="of-display text-[56px] leading-none text-white sm:text-[88px]">{LOCALE_LABELS[target].name}</div>
              <div className="of-hud mt-3 text-[12px] text-[color:var(--lime,#a6e35a)]">{SWITCHING[target]}</div>
            </div>
          </div>,
          host
        )}
    </>
  );
}
