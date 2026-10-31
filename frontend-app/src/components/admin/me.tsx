'use client';

import { createContext, useContext } from 'react';
import type { AdminRole } from '@/lib/admin/session';

export interface Me {
  fullName: string | null;
  role: AdminRole;
}
export const MeContext = createContext<Me>({ fullName: null, role: 'EDITOR' });
export const useMe = () => useContext(MeContext);
/** ADMIN may change data that EDITOR can only read. */
export const useIsManager = () => useMe().role === 'ADMIN';
/** On a competition's scouting panel. */
export const useIsPanel = () => ['HLV', 'TTV'].includes(useMe().role);
