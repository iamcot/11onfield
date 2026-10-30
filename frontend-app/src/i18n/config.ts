export const LOCALES = ['vi', 'en', 'es', 'ko'] as const;
export type Locale = (typeof LOCALES)[number];

export const DEFAULT_LOCALE: Locale = 'vi';
export const LOCALE_COOKIE = 'NEXT_LOCALE';

export const LOCALE_LABELS: Record<Locale, { short: string; name: string }> = {
  vi: { short: 'VI', name: 'Tiếng Việt' }, // i18n-ignore
  en: { short: 'EN', name: 'English' },
  es: { short: 'ES', name: 'Español' },
  ko: { short: 'KO', name: '한국어' },
};

/** BCP 47 tags for Intl / toLocale*String. */
export const INTL_LOCALE: Record<Locale, string> = {
  vi: 'vi-VN',
  en: 'en-GB',
  es: 'es-ES',
  ko: 'ko-KR',
};

export function isLocale(value: unknown): value is Locale {
  return typeof value === 'string' && (LOCALES as readonly string[]).includes(value);
}
