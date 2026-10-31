import AppTheme from '@/components/shell/AppTheme';
import type { Metadata } from 'next';
import { getT } from '@/i18n/server';

export function generateMetadata(): Metadata {
  const { t } = getT();
  return {
    title: t('Sự kiện'),
    description: t('Danh sách các sự kiện tuyển chọn, giải đấu và hoạt động bóng đá. Tham gia ngay để thể hiện tài năng và kết nối với các đội bóng chuyên nghiệp.'),
    keywords: ['sự kiện bóng đá', 'tuyển chọn cầu thủ', 'giải đấu', 'hoạt động bóng đá', 'sự kiện thể thao'],
  };
}

export default function EventsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AppTheme>{children}</AppTheme>;
}
