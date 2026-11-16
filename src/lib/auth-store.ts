import { create } from 'zustand';

export interface PlatformUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
}

export function isTokenExpired(token: string | null): boolean {
  if (!token) return true;
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return true;
    const base64Url = parts[1];
    if (!base64Url) return true;
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join(''),
    );
    const payload = JSON.parse(jsonPayload);
    if (!payload.exp) return false;
    return payload.exp * 1000 <= Date.now() + 10000;
  } catch {
    return true;
  }
}

interface AdminAuthState {
  token: string | null;
  refreshToken: string | null;
  user: PlatformUser | null;
  isAuthenticated: boolean;
  setAuth: (token: string, user: PlatformUser, refreshToken?: string) => void;
  setTokens: (token: string, refreshToken?: string) => void;
  logout: () => void;
}

export const useAdminAuthStore = create<AdminAuthState>((set) => ({
  token: typeof window !== 'undefined' ? localStorage.getItem('platform_access_token') : null,
  refreshToken: typeof window !== 'undefined' ? localStorage.getItem('platform_refresh_token') : null,
  user:
    typeof window !== 'undefined' && localStorage.getItem('platform_user')
      ? JSON.parse(localStorage.getItem('platform_user') || '{}')
      : null,
  isAuthenticated:
    typeof window !== 'undefined'
      ? !!(localStorage.getItem('platform_access_token') || localStorage.getItem('platform_refresh_token'))
      : false,

  setAuth: (token, user, refreshToken) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('platform_access_token', token);
      if (refreshToken) {
        localStorage.setItem('platform_refresh_token', refreshToken);
      }
      localStorage.setItem('platform_user', JSON.stringify(user));
    }
    set({
      token,
      refreshToken: refreshToken || (typeof window !== 'undefined' ? localStorage.getItem('platform_refresh_token') : null),
      user,
      isAuthenticated: true,
    });
  },

  setTokens: (token, refreshToken) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('platform_access_token', token);
      if (refreshToken) {
        localStorage.setItem('platform_refresh_token', refreshToken);
      }
    }
    set((state) => ({
      token,
      refreshToken: refreshToken || state.refreshToken,
      isAuthenticated: true,
    }));
  },

  logout: () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('platform_access_token');
      localStorage.removeItem('platform_refresh_token');
      localStorage.removeItem('platform_user');
    }
    set({ token: null, refreshToken: null, user: null, isAuthenticated: false });
  },
}));
