import type { Metadata } from 'next';
import RegisterFlow from '@/components/register/RegisterFlow';

export const metadata: Metadata = {
  title: 'Đăng ký',
  description: 'Đăng ký miễn phí tham gia 11 On Field – chương trình tuyển trạch cầu thủ trẻ toàn quốc.',
  robots: { index: false, follow: true },
};

export default function RegisterPage() {
  return <RegisterFlow />;
}
