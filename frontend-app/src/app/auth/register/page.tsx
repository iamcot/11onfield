import type { Metadata } from 'next';
import { getT } from '@/i18n/server';
import RegisterFlow from '@/components/register/RegisterFlow';

export function generateMetadata(): Metadata {
  const { t } = getT();
  return {
    title: t('Đăng ký'),
    description: t('Đăng ký miễn phí tham gia 11 On Field – chương trình tuyển trạch cầu thủ trẻ toàn quốc.'),
    robots: { index: false, follow: true },
  };
}

export default function RegisterPage() {
  return <RegisterFlow />;
}
