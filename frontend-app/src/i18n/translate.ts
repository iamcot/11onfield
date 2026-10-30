import type { Locale } from './config';
import { MESSAGES } from './messages';

/** Vietnamese source text → translation for one locale. Vietnamese itself needs no table. */
export type Dictionary = Record<string, string>;
export type Vars = Record<string, string | number>;
export type TFunction = (text: string, vars?: Vars) => string;

const LOCALE_INDEX: Record<Exclude<Locale, 'vi'>, number> = { en: 0, es: 1, ko: 2 };
const cache = new Map<Locale, Dictionary>();

export function getDictionary(locale: Locale): Dictionary {
  if (locale === 'vi') return {};
  let dict = cache.get(locale);
  if (!dict) {
    const i = LOCALE_INDEX[locale];
    dict = {};
    for (const [vi, row] of Object.entries(MESSAGES)) dict[vi] = row[i];
    cache.set(locale, dict);
  }
  return dict;
}

export function interpolate(text: string, vars?: Vars): string {
  if (!vars) return text;
  return text.replace(/\{(\w+)\}/g, (m, k) => (k in vars ? String(vars[k]) : m));
}

/**
 * Strings in the code are written in Vietnamese and double as keys:
 * `t('Đăng ký')`, `t('Còn {n} ngày', { n })`. A missing translation falls back to Vietnamese.
 */
export function createT(dict: Dictionary): TFunction {
  return (text, vars) => interpolate(dict[text] ?? text, vars);
}
