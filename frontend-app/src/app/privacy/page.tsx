import type { Metadata } from 'next';
import { getT } from '@/i18n/server';
import LegalPage from '@/components/shell/LegalPage';
import docs from '@/content/legal/privacy';

export function generateMetadata(): Metadata {
  const { t } = getT();
  return { title: t('Chính sách bảo mật thông tin') };
}

export default function PrivacyPage() {
  return <LegalPage docs={docs} updated="09/06/2026" current="/privacy" />;
}
