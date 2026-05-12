import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { AuthProvider } from '@/contexts/AuthContext';
import { EditProfileProvider } from '@/contexts/EditProfileContext';
import { SidebarProvider } from '@/contexts/SidebarContext';
import EditProfileHandler from '@/components/profile/EditProfileHandler';
import SafariLightModeWrapper from '@/components/forms/SafariLightModeWrapper';

const inter = Inter({ subsets: ['latin'] });

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
      <body className={inter.className}>
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
