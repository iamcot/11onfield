'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useTransition, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { DEFAULT_LOCALE, INTL_LOCALE, LOCALE_COOKIE, isLocale, type Locale } from './config';
import { createT, type Dictionary, type TFunction } from './translate';

type I18nValue = {
  locale: Locale;
  /** BCP 47 tag for toLocaleDateString and friends. */
  intlLocale: string;
  t: TFunction;
  setLocale: (locale: Locale) => void;
  /** true while the page re-renders in a newly chosen language */
  switching: boolean;
};

const STORAGE_KEY = 'locale';

function readStored(): Locale | null {
  try {
    const v = localStorage.getItem(STORAGE_KEY);
    return isLocale(v) ? v : null;
  } catch {
    return null;
  }
}

function persist(locale: Locale) {
  try {
    localStorage.setItem(STORAGE_KEY, locale);
  } catch {
    // private mode / blocked storage: the cookie still carries the choice
  }
  // the server renders from the cookie, localStorage is the durable copy
  document.cookie = `${LOCALE_COOKIE}=${locale}; path=/; max-age=31536000; samesite=lax`;
}

const I18nContext = createContext<I18nValue>({
  locale: DEFAULT_LOCALE,
  intlLocale: INTL_LOCALE[DEFAULT_LOCALE],
  t: createT({}),
  setLocale: () => {},
  switching: false,
});

export function I18nProvider({ locale, dictionary, children }: { locale: Locale; dictionary: Dictionary; children: ReactNode }) {
  const router = useRouter();
  const [switching, startTransition] = useTransition();
  const setLocale = useCallback(
    (next: Locale) => {
      persist(next);
      // re-render server components (and refetch this dictionary) in the new language
      startTransition(() => router.refresh());
    },
    [router]
  );

  // restore the saved choice when the cookie is gone (cleared, expired, other subdomain)
  useEffect(() => {
    const stored = readStored();
    if (stored && stored !== locale) setLocale(stored);
    else if (!stored) persist(locale);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const value = useMemo(
    () => ({ locale, intlLocale: INTL_LOCALE[locale], t: createT(dictionary), setLocale, switching }),
    [locale, dictionary, setLocale, switching]
  );
  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  return useContext(I18nContext);
}

export function useT() {
  return useContext(I18nContext).t;
}
