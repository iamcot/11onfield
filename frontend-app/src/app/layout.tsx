import type { Metadata } from 'next';
import { Be_Vietnam_Pro } from 'next/font/google';
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
import { I18nProvider } from '@/i18n/I18nProvider';
import { getT } from '@/i18n/server';
import { getDictionary } from '@/i18n/translate';

const beVietnamPro = Be_Vietnam_Pro({
  subsets: ['latin', 'vietnamese'],
  weight: ['300', '400', '500', '600', '700'],
  variable: '--font-be-vietnam-pro',
});

export function generateMetadata(): Metadata {
  const { locale, t } = getT();
  const tagline = t('11 người ra sân - Từ đường phố đến sân cỏ');
  const description = t('Nền tảng kết nối cầu thủ bóng đá từ đường phố đến sân cỏ');
  return {
    title: {
      template: `%s - ${tagline}`,
      default: tagline,
    },
    description: t('Nền tảng kết nối cầu thủ bóng đá từ đường phố đến sân cỏ. Tìm kiếm cầu thủ, tham gia sự kiện, xây dựng đội hình mơ ước.'),
    keywords: ['bóng đá', 'cầu thủ', 'sân bóng', 'tuyển thủ', 'sự kiện bóng đá', 'đội bóng', 'football', 'soccer', '11 người ra sân'],
    authors: [{ name: t('11 người ra sân') }],
    openGraph: {
      type: 'website',
      locale: { vi: 'vi_VN', en: 'en_GB', es: 'es_ES', ko: 'ko_KR' }[locale],
      siteName: t('11 người ra sân'),
      title: tagline,
      description,
    },
    twitter: {
      card: 'summary_large_image',
      title: tagline,
      description,
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
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { locale } = getT();
  return (
    <html lang={locale}>
      <head>
        <meta name="color-scheme" content="light only" />
      </head>
      <body className={`${beVietnamPro.className} ${beVietnamPro.variable}`}>
        <I18nProvider locale={locale} dictionary={getDictionary(locale)}>
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
        </I18nProvider>
      </body>
    </html>
  );
}
