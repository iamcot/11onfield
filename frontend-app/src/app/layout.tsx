import type { Metadata } from 'next';
import { Inter, Roboto_Condensed } from 'next/font/google';
import './globals.css';
import { AuthProvider } from '@/contexts/AuthContext';
import { EditProfileProvider } from '@/contexts/EditProfileContext';
import { SidebarProvider } from '@/contexts/SidebarContext';
import EditProfileHandler from '@/components/profile/EditProfileHandler';
import SafariLightModeWrapper from '@/components/forms/SafariLightModeWrapper';

const inter = Inter({ subsets: ['latin'] });
const robotoCondensed = Roboto_Condensed({
  subsets: ['latin'],
  weight: ['300', '400', '700'],
  variable: '--font-roboto-condensed',
});

export const metadata: Metadata = {
  title: '11of - Frontend App',
  description: 'End-user application for 11of platform',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <meta name="color-scheme" content="light only" />
      </head>
      <body className={`${inter.className} ${robotoCondensed.variable}`}>
        <AuthProvider>
          <SidebarProvider>
            <EditProfileProvider>
              {children}
              <EditProfileHandler />
              <SafariLightModeWrapper />
            </EditProfileProvider>
          </SidebarProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
