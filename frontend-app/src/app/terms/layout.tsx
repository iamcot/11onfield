import type { Metadata } from 'next';
import { getT } from '@/i18n/server';

export function generateMetadata(): Metadata {
  const { t } = getT();
  return {
    title: t('Điều khoản sử dụng'),
    description: t('Điều khoản và điều kiện sử dụng dịch vụ của nền tảng 11 người ra sân. Vui lòng đọc kỹ trước khi sử dụng dịch vụ.'),
    robots: {
      index: true,
      follow: true,
    },
  };
}

export default function TermsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
