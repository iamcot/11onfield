import type { Metadata } from 'next';
import { Inter, Roboto_Condensed } from 'next/font/google';
import { Suspense } from 'react';
import './globals.css';
import { AuthProvider } from '@/contexts/AuthContext';
import { NotificationProvider } from '@/contexts/NotificationContext';
import { EditProfileProvider } from '@/contexts/EditProfileContext';
import { SidebarProvider } from '@/contexts/SidebarContext';
import { AnalyticsProvider } from '@/contexts/AnalyticsContext';
import EditProfileHandler from '@/components/profile/EditProfileHandler';
import SafariLightModeWrapper from '@/components/forms/SafariLightModeWrapper';
import PageViewTracker from '@/components/analytics/PageViewTracker';

const inter = Inter({ subsets: ['latin'] });
const robotoCondensed = Roboto_Condensed({
  subsets: ['latin'],
  weight: ['300', '400', '700'],
  variable: '--font-roboto-condensed',
});

export const metadata: Metadata = {
  title: {
    template: '%s - 11 người ra sân - Từ đường phố đến sân cỏ',
    default: '11 người ra sân - Từ đường phố đến sân cỏ',
  },
  description: 'Nền tảng kết nối cầu thủ bóng đá từ đường phố đến sân cỏ. Tìm kiếm cầu thủ, tham gia sự kiện, xây dựng đội hình mơ ước.',
  keywords: ['bóng đá', 'cầu thủ', 'sân bóng', 'tuyển thủ', 'sự kiện bóng đá', 'đội bóng', 'football', 'soccer', '11 người ra sân'],
  authors: [{ name: '11 người ra sân' }],
  openGraph: {
    type: 'website',
    locale: 'vi_VN',
    siteName: '11 người ra sân',
    title: '11 người ra sân - Từ đường phố đến sân cỏ',
    description: 'Nền tảng kết nối cầu thủ bóng đá từ đường phố đến sân cỏ',
  },
  twitter: {
    card: 'summary_large_image',
    title: '11 người ra sân - Từ đường phố đến sân cỏ',
    description: 'Nền tảng kết nối cầu thủ bóng đá từ đường phố đến sân cỏ',
  },
  icons: {
    icon: '/favicon/favicon.ico',
    shortcut: '/favicon/favicon.ico',
    apple: '/favicon/favicon.ico',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="vi">
      <head>
        <meta name="color-scheme" content="light only" />
      </head>
      <body className={`${inter.className} ${robotoCondensed.variable}`}>
        <AuthProvider>
          <AnalyticsProvider>
            <Suspense fallback={null}>
              <PageViewTracker />
            </Suspense>
            <NotificationProvider>
              <SidebarProvider>
                <EditProfileProvider>
                  {children}
                  <EditProfileHandler />
                  <SafariLightModeWrapper />
                </EditProfileProvider>
              </SidebarProvider>
            </NotificationProvider>
          </AnalyticsProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
