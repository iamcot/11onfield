const TOKEN_KEY = 'access_token';
const REFRESH_TOKEN_KEY = 'refresh_token';
const USER_KEY = 'user';

export const storage = {
  getToken: (): string | null => {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem(TOKEN_KEY);
  },

  setToken: (token: string): void => {
    if (typeof window === 'undefined') return;
    localStorage.setItem(TOKEN_KEY, token);
  },

  getRefreshToken: (): string | null => {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem(REFRESH_TOKEN_KEY);
  },

  setRefreshToken: (token: string): void => {
    if (typeof window === 'undefined') return;
    localStorage.setItem(REFRESH_TOKEN_KEY, token);
  },

  getUser: (): any | null => {
    if (typeof window === 'undefined') return null;
    const user = localStorage.getItem(USER_KEY);
    return user ? JSON.parse(user) : null;
  },

  setUser: (user: any): void => {
    if (typeof window === 'undefined') return;
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  },

  /** True when the stored access token is past its `exp` (with a small margin), or cannot be read. */
  isTokenExpired: (token: string | null = storage.getToken()): boolean => {
    if (!token) return true;
    try {
      const part = token.split('.')[1];
      const payload = JSON.parse(atob(part.replace(/-/g, '+').replace(/_/g, '/')));
      return typeof payload.exp === 'number' && payload.exp * 1000 < Date.now() + 10_000;
    } catch {
      return false; // not a JWT we can read: let the server decide
    }
  },

  clearAuth: (): void => {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  },
};
