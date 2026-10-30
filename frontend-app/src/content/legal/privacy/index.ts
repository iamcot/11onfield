import type { Locale } from '@/i18n/config';
import type { LegalDoc } from '../types';
import vi from './vi';
import en from './en';
import es from './es';
import ko from './ko';

const docs: Record<Locale, LegalDoc> = { vi, en, es, ko };
export default docs;
