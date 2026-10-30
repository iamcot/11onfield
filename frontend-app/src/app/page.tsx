import PlayerLanding from '@/components/home/PlayerLanding';
import type { Metadata } from 'next';
import { getT } from '@/i18n/server';

export function generateMetadata(): Metadata {
  const { t } = getT();
  return {
    title: t('Trang chủ'),
    description: t('Nền tảng kết nối cầu thủ bóng đá từ đường phố đến sân cỏ. Khám phá tài năng, tham gia tuyển chọn, xây dựng sự nghiệp bóng đá chuyên nghiệp.'),
    keywords: ['bóng đá', 'tuyển thủ', 'cầu thủ bóng đá', 'đào tạo bóng đá', 'tìm kiếm cầu thủ', 'tuyển sinh bóng đá'],
    openGraph: {
      title: `${t('Trang chủ')} - ${t('11 người ra sân - Từ đường phố đến sân cỏ')}`,
      description: t('Nền tảng kết nối cầu thủ bóng đá từ đường phố đến sân cỏ. Khám phá tài năng, tham gia tuyển chọn, xây dựng sự nghiệp bóng đá chuyên nghiệp.'),
    },
  };
}

export default function HomePage() {
  return <PlayerLanding />;
}
