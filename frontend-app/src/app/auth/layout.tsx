import type { Metadata } from 'next';
import { getT } from '@/i18n/server';

export function generateMetadata(): Metadata {
  const { t } = getT();
  return {
    title: t('Đăng nhập'),
    description: t('Đăng nhập vào hệ thống 11 người ra sân để quản lý hồ sơ cầu thủ, tham gia sự kiện và kết nối với cộng đồng bóng đá.'),
    robots: {
      index: false,
      follow: true,
    },
  };
}

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
