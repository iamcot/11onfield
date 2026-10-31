import type { Metadata } from 'next';
import { getT } from '@/i18n/server';

export function generateMetadata(): Metadata {
  const { t } = getT();
  return { title: t('Check-in tuyển trạch') };
}

export default function CheckinLayout({ children }: { children: React.ReactNode }) {
  return children;
}
