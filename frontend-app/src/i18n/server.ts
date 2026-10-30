import { cookies } from 'next/headers';
import { DEFAULT_LOCALE, LOCALE_COOKIE, isLocale, type Locale } from './config';
import { createT, getDictionary } from './translate';

export function getLocale(): Locale {
  const value = cookies().get(LOCALE_COOKIE)?.value;
  return isLocale(value) ? value : DEFAULT_LOCALE;
}

/** Translator for server components, layouts and generateMetadata. */
export function getT() {
  const locale = getLocale();
  return { locale, t: createT(getDictionary(locale)) };
}
