import AppTheme from '@/components/shell/AppTheme';
import type { Metadata } from 'next';
import { getT } from '@/i18n/server';

export function generateMetadata(): Metadata {
  const { t } = getT();
  return {
    title: t('Hồ sơ cầu thủ'),
    description: t('Xem và quản lý hồ sơ cầu thủ bóng đá. Cập nhật thông tin cá nhân, chỉ số kỹ năng, video highlights và lịch sử thi đấu.'),
    robots: {
      index: true,
      follow: true,
    },
  };
}

export default function ProfileLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AppTheme fireflies={false}>{children}</AppTheme>;
}
