'use client';

import { createContext, useCallback, useContext, useMemo, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { DEFAULT_LOCALE, INTL_LOCALE, LOCALE_COOKIE, type Locale } from './config';
import { createT, type Dictionary, type TFunction } from './translate';

type I18nValue = {
  locale: Locale;
  /** BCP 47 tag for toLocaleDateString and friends. */
  intlLocale: string;
  t: TFunction;
  setLocale: (locale: Locale) => void;
};

const I18nContext = createContext<I18nValue>({
  locale: DEFAULT_LOCALE,
  intlLocale: INTL_LOCALE[DEFAULT_LOCALE],
  t: createT({}),
  setLocale: () => {},
});

export function I18nProvider({ locale, dictionary, children }: { locale: Locale; dictionary: Dictionary; children: ReactNode }) {
  const router = useRouter();
  const setLocale = useCallback(
    (next: Locale) => {
      document.cookie = `${LOCALE_COOKIE}=${next}; path=/; max-age=31536000; samesite=lax`;
      // re-render server components (and refetch this dictionary) in the new language
      router.refresh();
    },
    [router]
  );
  const value = useMemo(
    () => ({ locale, intlLocale: INTL_LOCALE[locale], t: createT(dictionary), setLocale }),
    [locale, dictionary, setLocale]
  );
  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  return useContext(I18nContext);
}

export function useT() {
  return useContext(I18nContext).t;
}
