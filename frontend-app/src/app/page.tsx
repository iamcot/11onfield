import PlayerLanding from '@/components/home/PlayerLanding';
import type { Metadata } from 'next';
import { getT } from '@/i18n/server';

export function generateMetadata(): Metadata {
  const { t } = getT();
  return {
    // the root layout's title template does not reach its own page
    title: { absolute: `${t('Trang chủ')} - ${t('11 người ra sân')}` },
    description: t('Nền tảng kết nối cầu thủ bóng đá từ đường phố đến sân cỏ. Khám phá tài năng, tham gia tuyển chọn, xây dựng sự nghiệp bóng đá chuyên nghiệp.'),
    keywords: ['bóng đá', 'tuyển thủ', 'cầu thủ bóng đá', 'đào tạo bóng đá', 'tìm kiếm cầu thủ', 'tuyển sinh bóng đá'],
  };
}

export default function HomePage() {
  return <PlayerLanding />;
}
