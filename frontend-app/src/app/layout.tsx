import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { AuthProvider } from '@/contexts/AuthContext';
import { EditProfileProvider } from '@/contexts/EditProfileContext';
import { SidebarProvider } from '@/contexts/SidebarContext';
import EditProfileHandler from '@/components/profile/EditProfileHandler';

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
      <body className={inter.className}>
        <AuthProvider>
          <SidebarProvider>
            <EditProfileProvider>
              {children}
              <EditProfileHandler />
            </EditProfileProvider>
          </SidebarProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
