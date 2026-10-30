'use client';

import { useEffect, useRef, useState } from 'react';
import { LOCALES, LOCALE_LABELS } from '@/i18n/config';
import { useI18n } from '@/i18n/I18nProvider';

/** Globe button + menu of the four site languages. `tone="dark"` for the night-stadium headers. */
export default function LanguageSwitcher({
  tone = 'dark',
  up = false,
  className = '',
}: {
  tone?: 'dark' | 'light';
  /** open the menu above the button (footers) */
  up?: boolean;
  className?: string;
}) {
  const { locale, setLocale, t } = useI18n();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const dark = tone === 'dark';
  return (
    <div ref={ref} className={`relative ${className}`}>
      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={t('Ngôn ngữ')}
        onClick={() => setOpen((v) => !v)}
        className={`flex h-9 items-center gap-1.5 rounded-md border px-2.5 text-xs font-semibold tracking-wider transition-colors ${
          dark ? 'border-white/25 text-white hover:border-white/60' : 'border-gray-300 text-gray-700 hover:border-gray-500'
        }`}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} aria-hidden="true">
          <circle cx="12" cy="12" r="9" />
          <path d="M3 12h18M12 3c2.5 2.7 3.8 5.7 3.8 9s-1.3 6.3-3.8 9c-2.5-2.7-3.8-5.7-3.8-9S9.5 5.7 12 3z" />
        </svg>
        {LOCALE_LABELS[locale].short}
      </button>
      {open && (
        <ul
          role="listbox"
          aria-label={t('Ngôn ngữ')}
          className={`absolute right-0 z-[100] ${up ? 'bottom-full mb-2' : 'top-full mt-2'} min-w-[150px] overflow-hidden rounded-md border py-1 shadow-xl ${
            dark ? 'border-white/15 bg-[#0F3324] text-white' : 'border-gray-200 bg-white text-gray-800'
          }`}
        >
          {LOCALES.map((l) => (
            <li key={l} role="option" aria-selected={l === locale}>
              <button
                type="button"
                lang={l}
                onClick={() => {
                  setOpen(false);
                  if (l !== locale) setLocale(l);
                }}
                className={`flex w-full items-center justify-between gap-3 px-3 py-2 text-left text-sm ${
                  dark ? 'hover:bg-white/10' : 'hover:bg-gray-100'
                } ${l === locale ? 'font-semibold' : ''}`}
              >
                {LOCALE_LABELS[l].name}
                <span className="text-[11px] opacity-60">{LOCALE_LABELS[l].short}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
