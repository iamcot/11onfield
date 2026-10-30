'use client';

import { createContext, useContext } from 'react';
import type { AdminRole } from '@/lib/admin/session';

export interface Me {
  fullName: string | null;
  role: AdminRole;
}
export const MeContext = createContext<Me>({ fullName: null, role: 'EDITOR' });
export const useMe = () => useContext(MeContext);
/** ADMIN and SUPER_USER may change data that EDITOR can only read. */
export const useIsManager = () => ['ADMIN', 'SUPER_USER'].includes(useMe().role);
