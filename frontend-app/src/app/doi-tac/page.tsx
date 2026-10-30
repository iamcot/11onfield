import PartnerLanding from '@/components/partner/PartnerLanding';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Đối tác & nhà tài trợ',
  robots: { index: false, follow: false },
};

export default function PartnerPage() {
  return <PartnerLanding />;
}
