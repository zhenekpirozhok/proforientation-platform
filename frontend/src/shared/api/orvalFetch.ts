import { routing } from '@/shared/i18n/lib/routing';

function toBffUrl(url: string) {
  if (/^https?:\/\//.test(url)) return url;

  if (url.startsWith('/api/v1/')) {
    return '/api' + url.slice('/api/v1'.length);
  }

  if (url.startsWith('/api/')) {
    return url;
  }

  if (url.startsWith('/')) {
    return '/api' + url;
  }

  return '/api/' + url;
}

type MessageEnvelope = { message?: unknown };

let isRefreshing = false;
let refreshPromise: Promise<void> | null = null;

function tryGetMessage(v: unknown): string | null {
  if (typeof v !== 'object' || v === null) return null;
  if (!('message' in v)) return null;

  const msg = (v as MessageEnvelope).message;
  return typeof msg === 'string' ? msg : null;
}

async function refreshAccessToken(): Promise<boolean> {
  if (isRefreshing) {
    // If already refreshing, wait for the refresh to complete
    if (refreshPromise) {
      await refreshPromise;
      return true;
    }
    return false;
  }

  isRefreshing = true;

  refreshPromise = (async () => {
    try {
      const res = await fetch('/api/auth/refresh', {
        method: 'POST',
        credentials: 'include',
        headers: { 'content-type': 'application/json' },
      });

      if (res.ok) {
        return;
      } else {
        // Redirect to login on refresh failure
        if (typeof window !== 'undefined') {
          window.location.href = '/auth/login';
        }
      }
    } catch (err) {
      console.error('Token refresh failed:', err);
      if (typeof window !== 'undefined') {
        window.location.href = '/auth/login';
      }
    } finally {
      isRefreshing = false;
      refreshPromise = null;
    }
  })();

  await refreshPromise;
  return true;
}

export async function orvalFetch<T>(
  url: string,
  init?: RequestInit,
): Promise<T> {
  const headers = new Headers(init?.headers);

  if (typeof window !== 'undefined') {
    const firstSegment = window.location.pathname.split('/')[1];
    const browserLang = document.documentElement.lang;
    const detected = (routing.locales as readonly string[]).includes(
      firstSegment,
    )
      ? firstSegment
      : browserLang || routing.defaultLocale;

    if (!headers.has('x-locale') && detected) headers.set('x-locale', detected);
    if (!headers.has('Accept-Language') && detected)
      headers.set('Accept-Language', detected);
  }

  const res = await fetch(toBffUrl(url), {
    ...init,
    credentials: 'include',
    headers,
  });

  const text = await res.text().catch(() => '');
  const data: unknown = text
    ? (() => {
      try {
        return JSON.parse(text) as unknown;
      } catch {
        return text;
      }
    })()
    : null;

  if (!res.ok) {
    // If 401 Unauthorized, try to refresh the token and retry the request
    if (res.status === 401) {
      const refreshed = await refreshAccessToken();
      if (refreshed) {
        // Retry the original request with refreshed token
        const retryRes = await fetch(toBffUrl(url), {
          ...init,
          credentials: 'include',
          headers,
        });
        const retryText = await retryRes.text().catch(() => '');
        const retryData: unknown = retryText
          ? (() => {
            try {
              return JSON.parse(retryText) as unknown;
            } catch {
              return retryText;
            }
          })()
          : null;

        if (!retryRes.ok) {
          const msg = tryGetMessage(retryData);
          const message =
            msg ??
            (typeof retryData === 'string'
              ? retryData
              : `API error ${retryRes.status}`);
          throw new Error(message);
        }

        return retryData as T;
      }
    }

    const msg = tryGetMessage(data);
    const message =
      msg ?? (typeof data === 'string' ? data : `API error ${res.status}`);
    throw new Error(message);
  }

  return data as T;
}
