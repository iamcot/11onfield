import AdminShell from '@/components/admin/AdminShell';
import { UiProvider } from '@/components/admin/ui';
import { getMe } from '@/lib/admin/server';

export default async function AdminAppLayout({ children }: { children: React.ReactNode }) {
  const me = await getMe();
  return <UiProvider>
      <AdminShell me={{ fullName: me.fullName, role: me.role }}>{children}</AdminShell>
    </UiProvider>;
}
