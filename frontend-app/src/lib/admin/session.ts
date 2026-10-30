// Shared by middleware (edge) and server code, so keep it free of Node-only imports.
export const ADMIN_COOKIE = 'of_admin';
export const ADMIN_SESSION_SECONDS = 8 * 60 * 60;

export type AdminRole = 'EDITOR' | 'BGK' | 'ADMIN' | 'SUPER_USER';
export const ADMIN_ROLES: AdminRole[] = ['EDITOR', 'BGK', 'ADMIN', 'SUPER_USER'];

export const ROLE_LABEL: Record<AdminRole, string> = {
  EDITOR: 'Biên tập',
  BGK: 'Ban giám khảo',
  ADMIN: 'Quản trị',
  SUPER_USER: 'Quản trị cao cấp',
};

/**
 * Reads role and expiry from the JWT payload WITHOUT verifying the signature.
 * Only for routing and menus: the backend verifies the token on every API call.
 */
export function readToken(token: string | undefined): { role: AdminRole; exp: number } | null {
  if (!token) return null;
  try {
    const part = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
    const payload = JSON.parse(atob(part.padEnd(Math.ceil(part.length / 4) * 4, '=')));
    if (!ADMIN_ROLES.includes(payload.role) || typeof payload.exp !== 'number') return null;
    if (payload.exp * 1000 <= Date.now()) return null;
    return { role: payload.role, exp: payload.exp };
  } catch {
    return null;
  }
}

/** Server-side base URL of the Spring API (…/api). Prefer a localhost URL in production. */
export function backendUrl() {
  // A relative NEXT_PUBLIC_API_URL ("/api") only works in the browser; the server needs a full URL.
  const pub = process.env.NEXT_PUBLIC_API_URL?.startsWith('http') ? process.env.NEXT_PUBLIC_API_URL : '';
  return (process.env.ADMIN_API_URL || pub || 'http://localhost:7071/api').replace(/\/+$/, '');
}
