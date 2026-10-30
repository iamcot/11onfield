import PartnerLanding from '@/components/partner/PartnerLanding';
import type { Metadata } from 'next';
import { getT } from '@/i18n/server';

export function generateMetadata(): Metadata {
  const { t } = getT();
  return {
    title: t('Đối tác & nhà tài trợ'),
    robots: { index: false, follow: false },
  };
}

export default function PartnerPage() {
  return <PartnerLanding />;
}
