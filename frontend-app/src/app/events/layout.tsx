import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Sự kiện',
  description: 'Danh sách các sự kiện tuyển chọn, giải đấu và hoạt động bóng đá. Tham gia ngay để thể hiện tài năng và kết nối với các đội bóng chuyên nghiệp.',
  keywords: ['sự kiện bóng đá', 'tuyển chọn cầu thủ', 'giải đấu', 'hoạt động bóng đá', 'sự kiện thể thao'],
  openGraph: {
    title: 'Sự kiện - 11 người ra sân',
    description: 'Danh sách các sự kiện tuyển chọn, giải đấu và hoạt động bóng đá. Tham gia ngay để thể hiện tài năng.',
  },
};

export default function EventsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
