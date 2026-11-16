import { useAdminAuthStore, isTokenExpired } from './auth-store';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1';

// Mutex / Shared Promise for concurrent token refreshes
let adminRefreshPromise: Promise<string | null> | null = null;

async function performAdminTokenRefresh(): Promise<string | null> {
  if (adminRefreshPromise) {
    return adminRefreshPromise;
  }

  adminRefreshPromise = (async () => {
    try {
      const storedRefreshToken =
        typeof window !== 'undefined' ? localStorage.getItem('platform_refresh_token') : null;

      const refreshUrl = `${API_BASE_URL}/auth/refresh`;
      const res = await fetch(refreshUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          refreshToken: storedRefreshToken || undefined,
        }),
      });

      if (!res.ok) {
        throw new Error(`Refresh token rejected with status ${res.status}`);
      }

      const text = await res.text();
      let data: any;
      try {
        data = JSON.parse(text);
      } catch {
        data = text;
      }

      const payload = data?.response !== undefined ? data.response : data;
      const newAccessToken = payload?.accessToken;
      const newRefreshToken = payload?.refreshToken || storedRefreshToken;

      if (!newAccessToken) {
        throw new Error('No access token in refresh response');
      }

      useAdminAuthStore.getState().setTokens(newAccessToken, newRefreshToken);
      return newAccessToken;
    } catch (err) {
      console.warn('[adminApiClient] Refresh token failed or expired:', err);
      useAdminAuthStore.getState().logout();
      if (typeof window !== 'undefined' && !window.location.pathname.includes('/login')) {
        window.location.href = '/login?expired=1';
      }
      return null;
    } finally {
      adminRefreshPromise = null;
    }
  })();

  return adminRefreshPromise;
}

export async function adminApiClient<T = any>(
  endpoint: string,
  options: {
    method?: string;
    body?: any;
    token?: string;
    headers?: Record<string, string>;
    skipAuthRefresh?: boolean;
  } = {},
): Promise<T> {
  const method = options.method || 'GET';
  const isAuthRoute =
    endpoint.includes('/auth/login') ||
    endpoint.includes('/auth/refresh') ||
    endpoint.includes('/auth/platform/login');

  let token = options.token;
  if (!token && typeof window !== 'undefined') {
    token = localStorage.getItem('platform_access_token') || undefined;
  }

  // Proactive refresh: if token is expired or expiring in <= 10s and not an auth route
  if (!isAuthRoute && !options.skipAuthRefresh && token && isTokenExpired(token)) {
    const freshToken = await performAdminTokenRefresh();
    if (freshToken) {
      token = freshToken;
    } else {
      throw new Error('Session expired. Please log in again.');
    }
  }

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers || {}),
  };

  const url = endpoint.startsWith('http')
    ? endpoint
    : `${API_BASE_URL}${endpoint.startsWith('/') ? '' : '/'}${endpoint}`;

  const serializedBody = options.body
    ? typeof options.body === 'string'
      ? options.body
      : JSON.stringify(options.body)
    : undefined;

  let res = await fetch(url, {
    method,
    headers,
    credentials: 'include',
    body: serializedBody,
  });

  // Reactive refresh: if request returned 401 Unauthorized and not an auth route
  if (res.status === 401 && !isAuthRoute && !options.skipAuthRefresh) {
    const freshToken = await performAdminTokenRefresh();
    if (freshToken) {
      headers['Authorization'] = `Bearer ${freshToken}`;
      res = await fetch(url, {
        method,
        headers,
        credentials: 'include',
        body: serializedBody,
      });
    } else {
      throw new Error('Session expired. Please log in again.');
    }
  }

  const text = await res.text();
  let json: any;
  try {
    json = JSON.parse(text);
  } catch {
    json = text;
  }

  if (!res.ok) {
    if (res.status === 401 && !isAuthRoute) {
      useAdminAuthStore.getState().logout();
      if (typeof window !== 'undefined' && !window.location.pathname.includes('/login')) {
        window.location.href = '/login?expired=1';
      }
    }

    const errorMsg =
      json?.responseMessage || json?.message || `Request failed with status ${res.status}`;
    throw new Error(errorMsg);
  }

  if (json && typeof json === 'object' && json.meta !== undefined && json.response !== undefined) {
    if (Array.isArray(json.response)) {
      return { items: json.response, meta: json.meta } as T;
    }
    return { ...json.response, meta: json.meta } as T;
  }

  return (json?.response !== undefined ? json.response : json) as T;
}
