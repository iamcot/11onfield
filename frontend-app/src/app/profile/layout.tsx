import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Hồ sơ cầu thủ',
  description: 'Xem và quản lý hồ sơ cầu thủ bóng đá. Cập nhật thông tin cá nhân, chỉ số kỹ năng, video highlights và lịch sử thi đấu.',
  robots: {
    index: true,
    follow: true,
  },
};

export default function ProfileLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
