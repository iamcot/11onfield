import PartnerLanding from '@/components/partner/PartnerLanding';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Đối tác & nhà tài trợ',
  description:
    '11 On Field – format truyền hình thực tế bóng đá tiêu chuẩn quốc tế đầu tiên tại Việt Nam. 12 tập × 90 phút, 28 triệu gia đình Việt, 6 nguồn doanh thu từ một IP. Nhận hồ sơ hợp tác.',
  openGraph: {
    title: 'Đối tác & nhà tài trợ - 11 người ra sân',
    description: 'Sportainment reality show bóng đá đầu tiên tại Việt Nam. Cơ hội tài trợ và khai thác IP mùa 1.',
  },
};

export default function PartnerPage() {
  return <PartnerLanding />;
}
