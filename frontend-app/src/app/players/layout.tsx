import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Danh sách cầu thủ',
  description: 'Tìm kiếm và khám phá cầu thủ bóng đá trên hệ thống. Xem thông tin chi tiết, chỉ số kỹ năng, vị trí thi đấu và lịch sử thi đấu của các cầu thủ.',
  keywords: ['danh sách cầu thủ', 'tìm kiếm cầu thủ', 'cầu thủ bóng đá', 'chỉ số cầu thủ', 'vị trí thi đấu', 'cấp độ cầu thủ'],
  openGraph: {
    title: 'Danh sách cầu thủ - 11 người ra sân',
    description: 'Tìm kiếm và khám phá cầu thủ bóng đá trên hệ thống. Xem thông tin chi tiết, chỉ số kỹ năng và vị trí thi đấu.',
  },
};

export default function PlayersLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
