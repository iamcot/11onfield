import type { Metadata } from 'next';
import { getT } from '@/i18n/server';
import LegalPage from '@/components/shell/LegalPage';
import docs from '@/content/legal/media-policy';

export function generateMetadata(): Metadata {
  const { t } = getT();
  return { title: t('Chính sách sử dụng hình ảnh/video') };
}

export default function MediaPolicyPage() {
  return <LegalPage docs={docs} updated="09/06/2026" current="/media-policy" />;
}
