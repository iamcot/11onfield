import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Điều khoản sử dụng',
  description: 'Điều khoản và điều kiện sử dụng dịch vụ của nền tảng 11 người ra sân. Vui lòng đọc kỹ trước khi sử dụng dịch vụ.',
  robots: {
    index: true,
    follow: true,
  },
};

export default function TermsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
