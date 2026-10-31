import AppTheme from '@/components/shell/AppTheme';
import type { Metadata } from 'next';
import { getT } from '@/i18n/server';

export function generateMetadata(): Metadata {
  const { t } = getT();
  return {
    title: t('Danh sách cầu thủ'),
    description: t('Tìm kiếm và khám phá cầu thủ bóng đá trên hệ thống. Xem thông tin chi tiết, chỉ số kỹ năng, vị trí thi đấu và lịch sử thi đấu của các cầu thủ.'),
    keywords: ['danh sách cầu thủ', 'tìm kiếm cầu thủ', 'cầu thủ bóng đá', 'chỉ số cầu thủ', 'vị trí thi đấu', 'cấp độ cầu thủ'],
  };
}

export default function PlayersLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AppTheme>{children}</AppTheme>;
}
