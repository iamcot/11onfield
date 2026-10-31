import AppTheme from '@/components/shell/AppTheme';
import type { Metadata } from 'next';
import { getT } from '@/i18n/server';

export function generateMetadata(): Metadata {
  const { t } = getT();
  return { title: t('Chương trình') };
}

export default function CompetitionsLayout({ children }: { children: React.ReactNode }) {
  return <AppTheme>{children}</AppTheme>;
}
